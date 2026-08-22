-- ============================================================================
-- 관리자 기능 확장: 작업 로그 / 사용자 권한 관리 / 공지사항 / 커뮤니티 모더레이션
--                  + 기존 호스트 승인·반려 흐름에 로그 기록 추가
-- ============================================================================
-- 주의: 이 파일은 초안입니다. 운영 DB에는 아직 적용하지 않았습니다.
-- 적용 방법:
--   supabase db push
--   또는 Supabase Dashboard > SQL Editor 에 이 파일 내용을 붙여넣어 실행
--
-- 재실행 안전성: CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS /
-- DROP POLICY IF EXISTS / DO 블록 / CREATE OR REPLACE FUNCTION으로 작성해
-- 이 파일을 여러 번 실행해도 에러가 나지 않는다.
--
-- 이 파일이 건드리지 않는 것:
--   - community_posts/community_comments/community_reports의 RLS 활성화
--     여부 자체는 바꾸지 않는다(이 저장소 마이그레이션 밖에서 이미 만들어진
--     테이블이라 현재 RLS on/off 상태를 확인할 방법이 없었다). 대신 "추가"
--     정책만 얹어서, RLS가 이미 켜져 있으면 관리자 접근 권한을 넓히고
--     꺼져 있으면 정책 자체가 조용히 무시되도록(=기존 동작 불변) 했다.
--     사용자 화면에서 숨김 게시글이 안 보이는 것은 이번 커밋에서 클라이언트
--     쿼리(communityService)에 명시적 필터를 추가하는 방식으로 보장한다.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. admin_audit_logs 테이블
-- ----------------------------------------------------------------------------
-- 관리자 작업 이력. 일반적으로 삭제하지 않으므로 UPDATE/DELETE 정책은 아예
-- 두지 않는다 — PostgREST로는 수정/삭제가 원천적으로 불가능해진다(관리자
-- 포함). INSERT도 클라이언트가 테이블에 직접 하지 않고, 항상 아래 2번의
-- log_admin_action() 또는 이미 admin임을 검증한 다른 SECURITY DEFINER
-- 함수(admin_update_user_role 등)를 통해서만 기록한다 — 그래서 이 테이블
-- 자체에는 INSERT 정책도 두지 않았다(직접 INSERT 경로를 원천 차단).

create table if not exists public.admin_audit_logs (
  id             uuid primary key default gen_random_uuid(),
  admin_user_id  uuid references public.profiles(id) on delete set null,
  action         text not null,
  target_table   text,
  target_id      text,
  summary        text not null,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

drop policy if exists admin_audit_logs_select_admin on public.admin_audit_logs;
create policy admin_audit_logs_select_admin
  on public.admin_audit_logs
  for select
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 범용 로그 기록 RPC — 섬/공지/커뮤니티처럼 "상태 전이 자체는 이미 안전한
-- RLS로 보호되는 단순 CRUD"에 붙여서 쓴다. 호출자가 관리자인지 함수 내부에서
-- 다시 검증하므로, 로그 위조(다른 관리자 행세, 비관리자가 로그만 잔뜩 쌓기)를
-- 막는다.
create or replace function public.log_admin_action(
  p_action text,
  p_target_table text,
  p_target_id text,
  p_summary text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception '관리자만 호출할 수 있습니다';
  end if;

  insert into public.admin_audit_logs (admin_user_id, action, target_table, target_id, summary, metadata)
  values (auth.uid(), p_action, p_target_table, p_target_id, p_summary, coalesce(p_metadata, '{}'::jsonb));
end;
$$;

revoke execute on function public.log_admin_action(text, text, text, text, jsonb) from public;
revoke execute on function public.log_admin_action(text, text, text, text, jsonb) from anon;
grant execute on function public.log_admin_action(text, text, text, text, jsonb) to authenticated;


-- ----------------------------------------------------------------------------
-- 2. 사용자 목록 조회 / role 변경 RPC
-- ----------------------------------------------------------------------------
-- profiles 테이블에는 이메일이 없고(이메일은 auth.users 소유), auth 스키마는
-- PostgREST로 직접 노출되지 않는다. admin_list_users()는 SECURITY DEFINER로
-- auth.users를 조인해 이메일을 안전하게 노출하는 표준적인 Supabase 패턴이다
-- — 익명/일반 사용자는 이 함수를 호출할 수 없고(EXECUTE 권한 자체가 없음),
-- 호출자가 admin인지 내부에서 한 번 더 검증한다(이중 방어).

create or replace function public.admin_list_users()
returns table (
  id           uuid,
  email        text,
  nickname     text,
  role         text,
  created_at   timestamptz,
  updated_at   timestamptz,
  host_status  text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 이 함수는 RETURNS TABLE(id, role, ...)이라 "id"/"role"이 함수 안에서
  -- 반환 컬럼과 동명의 변수처럼 취급된다. 아래 검증 서브쿼리에서 컬럼을
  -- 테이블 별칭 없이 쓰면 그 변수와 profiles.id/profiles.role 중 무엇인지
  -- 애매해져 "column reference is ambiguous" 에러가 나므로, 여기서만
  -- 명시적으로 별칭(chk)을 붙여 확실히 profiles 쪽 컬럼을 가리키게 한다.
  if not exists (select 1 from public.profiles chk where chk.id = auth.uid() and chk.role = 'admin') then
    raise exception '관리자만 호출할 수 있습니다';
  end if;

  -- auth.users.email은 text가 아니라 character varying(255)라, 선언한
  -- 반환 타입(email text)과 그대로 맞춰 SELECT하면 "structure of query
  -- does not match function result type" 에러가 난다. 명시적으로 text로
  -- 캐스팅해서 반환 타입과 정확히 일치시킨다.
  return query
    select
      p.id,
      u.email::text,
      p.nickname,
      p.role,
      p.created_at,
      p.updated_at,
      h.status as host_status
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.hosts h on h.id = p.id
    order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_list_users() from public;
revoke execute on function public.admin_list_users() from anon;
grant execute on function public.admin_list_users() to authenticated;

-- role 변경 전용 RPC. protect_profiles_role 트리거(1단계 마이그레이션)가
-- "호출자가 admin이어야 role을 바꿀 수 있다"는 이미 막아주지만, 그 트리거는
-- "자기 자신의 admin 권한 실수 제거"까지는 막지 않는다 — 그래서 여기서
-- 별도로 검증한다. 이 함수가 role 변경과 로그 기록을 한 트랜잭션으로 묶어서
-- 처리하므로, 로그가 남지 않은 채 role만 바뀌는 상황이 생기지 않는다.
create or replace function public.admin_update_user_role(p_target_id uuid, p_new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_id uuid := auth.uid();
  v_old_role  text;
begin
  if not exists (select 1 from public.profiles where id = v_caller_id and role = 'admin') then
    raise exception '관리자만 호출할 수 있습니다';
  end if;

  if p_new_role not in ('user', 'host', 'admin') then
    raise exception '올바르지 않은 role 값입니다: %', p_new_role;
  end if;

  if p_target_id = v_caller_id and p_new_role <> 'admin' then
    raise exception '자기 자신의 관리자 권한은 이 화면에서 해제할 수 없습니다';
  end if;

  select role into v_old_role from public.profiles where id = p_target_id;
  if v_old_role is null then
    raise exception '대상 사용자를 찾을 수 없습니다';
  end if;
  if v_old_role = p_new_role then
    return;
  end if;

  update public.profiles set role = p_new_role where id = p_target_id;

  insert into public.admin_audit_logs (admin_user_id, action, target_table, target_id, summary, metadata)
  values (
    v_caller_id, 'role_change', 'profiles', p_target_id::text,
    format('사용자 role을 %s에서 %s(으)로 변경', v_old_role, p_new_role),
    jsonb_build_object('old_role', v_old_role, 'new_role', p_new_role)
  );
end;
$$;

revoke execute on function public.admin_update_user_role(uuid, text) from public;
revoke execute on function public.admin_update_user_role(uuid, text) from anon;
grant execute on function public.admin_update_user_role(uuid, text) to authenticated;


-- ----------------------------------------------------------------------------
-- 3. 기존 호스트 승인/반려 함수에 로그 기록 추가
-- ----------------------------------------------------------------------------
-- 함수 본문은 1단계 마이그레이션과 동일하고, 맨 끝에 admin_audit_logs INSERT만
-- 추가했다(CREATE OR REPLACE라 재실행 안전). 권한 검증/상태 전이 로직은
-- 그대로다.

create or replace function public.approve_host_application(p_host_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_business_name text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception '관리자만 호출할 수 있습니다';
  end if;

  select status, business_name into v_status, v_business_name from public.hosts where id = p_host_id for update;
  if v_status is null then
    raise exception '신청서를 찾을 수 없습니다';
  end if;
  if v_status <> 'pending' then
    raise exception 'pending 상태의 신청만 승인할 수 있습니다 (현재: %)', v_status;
  end if;

  update public.hosts
    set status = 'approved', rejection_reason = null
    where id = p_host_id;

  update public.profiles
    set role = 'host'
    where id = p_host_id;

  insert into public.admin_audit_logs (admin_user_id, action, target_table, target_id, summary, metadata)
  values (
    auth.uid(), 'host_approve', 'hosts', p_host_id::text,
    format('숙박 신청 승인: %s', coalesce(v_business_name, p_host_id::text)),
    '{}'::jsonb
  );
end;
$$;

create or replace function public.reject_host_application(p_host_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_business_name text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception '관리자만 호출할 수 있습니다';
  end if;

  select status, business_name into v_status, v_business_name from public.hosts where id = p_host_id for update;
  if v_status is null then
    raise exception '신청서를 찾을 수 없습니다';
  end if;
  if v_status <> 'pending' then
    raise exception 'pending 상태의 신청만 반려할 수 있습니다 (현재: %)', v_status;
  end if;

  update public.hosts
    set status = 'rejected', rejection_reason = p_reason
    where id = p_host_id;

  update public.profiles
    set role = 'user'
    where id = p_host_id;

  insert into public.admin_audit_logs (admin_user_id, action, target_table, target_id, summary, metadata)
  values (
    auth.uid(), 'host_reject', 'hosts', p_host_id::text,
    format('숙박 신청 반려: %s', coalesce(v_business_name, p_host_id::text)),
    jsonb_build_object('reason', p_reason)
  );
end;
$$;

-- 두 함수 모두 재정의됐으므로 revoke/grant도 다시 명시한다(권한 자체는
-- 1·2단계 마이그레이션과 동일하게 유지).
revoke execute on function public.approve_host_application(uuid) from public;
revoke execute on function public.approve_host_application(uuid) from anon;
grant execute on function public.approve_host_application(uuid) to authenticated;

revoke execute on function public.reject_host_application(uuid, text) from public;
revoke execute on function public.reject_host_application(uuid, text) from anon;
grant execute on function public.reject_host_application(uuid, text) to authenticated;


-- ----------------------------------------------------------------------------
-- 4. notices 테이블(신규)
-- ----------------------------------------------------------------------------

create table if not exists public.notices (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  content       text not null,
  status        text not null default 'draft',
  pinned        boolean not null default false,
  published_at  timestamptz,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'notices_status_check'
  ) then
    alter table public.notices
      add constraint notices_status_check check (status in ('draft', 'published', 'archived'));
  end if;
end $$;

-- updated_at 자동 갱신 트리거 함수 — hosts 전용이던 것과 별개로, 앞으로
-- 추가되는 관리자 테이블 전반에서 재사용할 수 있는 범용 버전을 새로 둔다
-- (기존 hosts_set_updated_at은 hosts 전용으로 그대로 둬서 기존 트리거를
-- 건드리지 않는다).
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists notices_updated_at on public.notices;
create trigger notices_updated_at
  before update on public.notices
  for each row
  execute function public.touch_updated_at();

alter table public.notices enable row level security;

-- 일반 사용자: published 상태만 조회 가능(추후 사용자 화면에 노출할 때를
-- 대비해 최소 구조만 열어둔다 — 지금 당장 이 데이터를 보여주는 화면은 없다).
drop policy if exists notices_select_public on public.notices;
create policy notices_select_public
  on public.notices
  for select
  to public
  using (status = 'published');

drop policy if exists notices_select_admin on public.notices;
create policy notices_select_admin
  on public.notices
  for select
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists notices_admin_insert on public.notices;
create policy notices_admin_insert
  on public.notices
  for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists notices_admin_update on public.notices;
create policy notices_admin_update
  on public.notices
  for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists notices_admin_delete on public.notices;
create policy notices_admin_delete
  on public.notices
  for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );


-- ----------------------------------------------------------------------------
-- 5. 커뮤니티 게시글 모더레이션(기존 테이블 보강)
-- ----------------------------------------------------------------------------
-- hidden_at이 NULL이면 공개, 값이 있으면 관리자가 숨긴 게시글이다. 상태를
-- 별도 enum 컬럼으로 두지 않고 timestamptz 하나로 표현해 "언제 숨겼는지"도
-- 함께 남긴다.

alter table public.community_posts
  add column if not exists hidden_at timestamptz;

-- 아래 정책들은 "추가" 정책이다 — 기존에 이 테이블에 이미 있을 수 있는
-- select/insert/update/delete 정책(본인 글 작성/수정/삭제 등)은 전혀
-- 건드리지 않는다. RLS가 켜져 있다면 관리자 권한만 넓히고, 꺼져 있다면
-- 이 정책들은 평가 자체가 되지 않아 기존 동작에 영향이 없다.

drop policy if exists community_posts_select_admin on public.community_posts;
create policy community_posts_select_admin
  on public.community_posts
  for select
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists community_posts_admin_update on public.community_posts;
create policy community_posts_admin_update
  on public.community_posts
  for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists community_posts_admin_delete on public.community_posts;
create policy community_posts_admin_delete
  on public.community_posts
  for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 신고 수 집계(관리자 화면 전용)를 위해 community_reports도 관리자에게
-- 조회를 열어준다.
drop policy if exists community_reports_select_admin on public.community_reports;
create policy community_reports_select_admin
  on public.community_reports
  for select
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
