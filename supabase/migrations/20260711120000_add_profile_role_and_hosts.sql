-- ============================================================================
-- 1단계: profiles.role 컬럼 + hosts 테이블
--        + role/hosts 컬럼 보호 트리거 + 승인/반려/재신청 함수
-- ============================================================================
-- 주의: 이 파일은 초안입니다. 운영 DB에는 아직 적용하지 않았습니다.
-- 적용 방법(승인 후):
--   supabase db push
--   또는 Supabase Dashboard > SQL Editor 에 이 파일 내용을 붙여넣어 실행
--
-- 재실행 안전성: IF NOT EXISTS / DROP ... IF EXISTS / 존재 확인 DO 블록 /
-- CREATE OR REPLACE로 작성해 이 파일을 여러 번 실행해도 에러가 나지 않는다.
-- 단, CREATE TABLE IF NOT EXISTS는 이미 테이블이 있으면 컬럼 정의가 달라도
-- 조용히 건너뛰므로 스키마 자체를 바꾸려면 별도 ALTER가 필요하다. 이 파일이
-- 정의하는 트리거/정책 이름은 전부 이 파일 전용 이름이라 DROP ... IF EXISTS가
-- 기존의 다른 운영 객체를 실수로 지울 위험은 없다.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. profiles.role 컬럼 추가
-- ----------------------------------------------------------------------------
-- NOT NULL + DEFAULT를 함께 지정하면 Postgres가 기존 row에도 기본값을
-- 안전하게 채워 넣는다(별도 UPDATE 불필요, 풀 테이블 재작성도 발생하지 않음).
-- handle_new_user()는 profiles(id, nickname)만 INSERT하지만, INSERT 문에
-- 없는 컬럼은 자동으로 DEFAULT가 적용되므로 트리거 함수를 수정할 필요는 없다.

alter table public.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'host', 'admin'));
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 2. hosts 테이블 생성
-- ----------------------------------------------------------------------------

create table if not exists public.hosts (
  id                            uuid primary key references public.profiles(id) on delete cascade,
  business_name                 text not null,
  representative_name           text,
  phone                         text not null,
  business_registration_number  text,
  status                        text not null default 'pending',
  rejection_reason              text,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'hosts_status_check'
  ) then
    alter table public.hosts
      add constraint hosts_status_check check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

alter table public.hosts enable row level security;

-- updated_at은 값과 무관하게 매 UPDATE마다 항상 now()로 덮어쓴다. 그래서
-- 클라이언트가 updated_at에 어떤 값을 보내도 결과에는 영향이 없고,
-- 3-2번의 컬럼 보호 트리거는 updated_at을 별도로 검사하지 않는다
-- (검사해도 항상 이 트리거가 마지막에 now()로 다시 덮어쓰므로 의미가 없다).
create or replace function public.hosts_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists hosts_updated_at on public.hosts;
create trigger hosts_updated_at
  before update on public.hosts
  for each row
  execute function public.hosts_set_updated_at();


-- ----------------------------------------------------------------------------
-- 3-1. role 보호: BEFORE UPDATE 트리거 (profiles)
-- ----------------------------------------------------------------------------
-- 현재 profiles_update 정책은 `using (auth.uid() = id)`만 있고 컬럼 단위
-- 제한이 없어, role 컬럼을 추가하면 사용자가 자신의 role을 직접 바꿀 수 있다.
-- RLS는 "어느 row인지"만 제어할 뿐 "어느 컬럼인지"는 제어하지 못하므로,
-- 컬럼 단위 보호는 트리거로 처리한다.
--
-- 동작 방식:
--   - role 값이 바뀌지 않는 일반 UPDATE(nickname, avatar_url, travel_style 등)는
--     그대로 통과한다.
--   - role 값이 바뀌려는 요청인데, 호출자가 관리자가 아니면 예외를 던져 차단한다.
--   - auth.uid()가 NULL인 경우(= PostgREST/JWT를 거치지 않은 직접 DB 접근,
--     예: Dashboard SQL Editor, service_role 키 사용)는 이미 신뢰된 컨텍스트로
--     보고 검사를 건너뛴다. 이는 "최초 admin 부트스트랩"을 가능하게 하기 위한
--     의도된 설계다(7번 항목 참고).

create or replace function public.protect_profiles_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ) then
      raise exception 'role은 관리자 승인 절차를 통해서만 변경할 수 있습니다';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row
  execute function public.protect_profiles_role();


-- ----------------------------------------------------------------------------
-- 3-2. hosts 컬럼 보호: BEFORE UPDATE 트리거
-- ----------------------------------------------------------------------------
-- 일반 사용자가 직접 수정 가능:
--   business_name, representative_name, phone, business_registration_number
-- 일반 사용자가 직접 수정 불가:
--   id, status, rejection_reason, created_at
--   (updated_at은 위 hosts_set_updated_at이 항상 덮어쓰므로 별도 차단 불필요)
--
-- hosts_update_self RLS 정책만으로는 "어느 row/상태"만 제어할 뿐 rejection_reason
-- 같은 개별 컬럼은 막지 못한다(발견된 보안 허점). 그래서 role과 동일한 패턴으로
-- 컬럼 단위 보호를 트리거로 추가한다.
--
-- 우회를 허용하는 두 경로:
--   1) 호출자가 실제 admin인 경우 (auth.uid() 기준 profiles.role 조회)
--      → approve_host_application / reject_host_application이 여기 해당.
--        이 함수들은 별도 우회 플래그 없이도, 호출자가 진짜 admin이라는 사실
--        자체로 이 트리거를 통과한다.
--   2) 세션 로컬 플래그 app.bypass_hosts_guard가 설정된 경우
--      → resubmit_host_application이 "본인 신청서를 rejected → pending으로
--        되돌리는" 좁은 목적에 한해서만 이 플래그를 켠다. set_config의 세 번째
--        인자 true는 "트랜잭션 로컬"이라 함수가 끝나는 트랜잭션과 함께 자동
--        해제되며, 다른 요청에 영향을 주지 않는다.
--
-- 이 두 경로 중 어느 것도 아니면(=일반 사용자의 raw UPDATE) id/status/
-- rejection_reason/created_at 변경 시도는 전부 예외로 차단된다.

create or replace function public.protect_hosts_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_trusted boolean;
begin
  v_is_admin := auth.uid() is not null and exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
  v_trusted := coalesce(current_setting('app.bypass_hosts_guard', true), 'false') = 'true';

  if not (v_is_admin or v_trusted) then
    if new.id is distinct from old.id then
      raise exception 'id는 변경할 수 없습니다';
    end if;
    if new.status is distinct from old.status then
      raise exception 'status는 승인/반려/재신청 절차를 통해서만 변경할 수 있습니다';
    end if;
    if new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'rejection_reason은 관리자만 변경할 수 있습니다';
    end if;
    if new.created_at is distinct from old.created_at then
      raise exception 'created_at은 변경할 수 없습니다';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists hosts_protect_fields on public.hosts;
create trigger hosts_protect_fields
  before update on public.hosts
  for each row
  execute function public.protect_hosts_fields();


-- ----------------------------------------------------------------------------
-- 4. hosts RLS 정책
-- ----------------------------------------------------------------------------
-- 설계 원칙: 관리자에게도 hosts.status를 직접 바꾸는 UPDATE 정책은 주지 않는다.
-- 승인/반려/재신청은 반드시 5번의 SECURITY DEFINER 함수를 통해서만 이루어지도록
-- 해서 hosts.status와 profiles.role이 항상 한 트랜잭션 안에서 같이 바뀌도록
-- 강제한다. 아래 hosts_update_self 정책은 "어느 row를, 어떤 상태일 때 건드릴
-- 수 있는가"라는 행(row) 단위 게이트이고, status/rejection_reason 등 개별
-- 컬럼 보호는 3-2번 트리거가 담당한다(이중 방어).

drop policy if exists hosts_insert_self on public.hosts;
create policy hosts_insert_self
  on public.hosts
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists hosts_select_self on public.hosts;
create policy hosts_select_self
  on public.hosts
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists hosts_select_admin on public.hosts;
create policy hosts_select_admin
  on public.hosts
  for select
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 본인 신청서 수정: pending/rejected 상태에서만(= approved면 대상 row 자체가
-- 안 보여 수정 불가), 수정 후에도 pending/rejected 중 하나여야 함.
-- (실제 status 값 변경은 3-2번 트리거가 한 번 더 막는다 — 이 정책만으로는
-- "값을 그대로 유지"만 강제할 뿐 컬럼 자체를 잠그지 못하기 때문)
drop policy if exists hosts_update_self on public.hosts;
create policy hosts_update_self
  on public.hosts
  for update
  to authenticated
  using (auth.uid() = id and status in ('pending', 'rejected'))
  with check (auth.uid() = id and status in ('pending', 'rejected'));


-- ----------------------------------------------------------------------------
-- 5. 승인 / 반려 / 재신청 함수 (SECURITY DEFINER)
-- ----------------------------------------------------------------------------
-- 상태 전이 규칙:
--   pending  → approved   (approve_host_application,  admin 전용)
--   pending  → rejected   (reject_host_application,   admin 전용)
--   rejected → pending    (resubmit_host_application,  본인 전용)
--   approved → (변경 불가, 세 함수 어디에도 approved를 벗어나는 경로 없음)
--
-- 세 함수 모두 시작하자마자 자격을 재검증한다(admin 여부 또는 본인 여부).
-- SECURITY DEFINER는 RLS를 우회하는 대신, 함수 내부의 이 검증이 유일한
-- 방어선이 되므로 반드시 필요하다.

create or replace function public.approve_host_application(p_host_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception '관리자만 호출할 수 있습니다';
  end if;

  select status into v_status from public.hosts where id = p_host_id for update;
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
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception '관리자만 호출할 수 있습니다';
  end if;

  select status into v_status from public.hosts where id = p_host_id for update;
  if v_status is null then
    raise exception '신청서를 찾을 수 없습니다';
  end if;
  if v_status <> 'pending' then
    raise exception 'pending 상태의 신청만 반려할 수 있습니다 (현재: %)', v_status;
  end if;

  update public.hosts
    set status = 'rejected', rejection_reason = p_reason
    where id = p_host_id;

  -- 반려 시 role은 'user' 유지(승인 이전이라 대부분 이미 'user'이지만,
  -- 재검토 케이스를 포함해 항상 명시적으로 보장한다)
  update public.profiles
    set role = 'user'
    where id = p_host_id;
end;
$$;

-- 본인 신청서를 rejected → pending 으로 되돌리는 재신청 함수.
-- 파라미터로 대상 id를 받지 않고 auth.uid()만 사용하므로 구조적으로
-- "본인 신청서만" 건드릴 수 있다 — 다른 사람의 id를 넘겨서 악용할 방법이
-- 애초에 존재하지 않는다.
create or replace function public.resubmit_host_application()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := auth.uid();
  v_status text;
begin
  if v_id is null then
    raise exception '로그인이 필요합니다';
  end if;

  select status into v_status from public.hosts where id = v_id for update;
  if v_status is null then
    raise exception '신청서를 찾을 수 없습니다';
  end if;
  if v_status <> 'rejected' then
    raise exception 'rejected 상태에서만 재신청할 수 있습니다 (현재: %)', v_status;
  end if;

  -- 3-2번 트리거에게 "이건 검증된 재신청 절차다"라고 알려주는 트랜잭션
  -- 로컬 플래그. 이 UPDATE 문이 끝나는 즉시(트랜잭션 커밋/롤백 시) 자동으로
  -- 해제되어 다른 요청에 영향을 주지 않는다.
  perform set_config('app.bypass_hosts_guard', 'true', true);

  update public.hosts
    set status = 'pending', rejection_reason = null
    where id = v_id;
end;
$$;

revoke execute on function public.approve_host_application(uuid) from public;
revoke execute on function public.reject_host_application(uuid, text) from public;
revoke execute on function public.resubmit_host_application() from public;
grant execute on function public.approve_host_application(uuid) to authenticated;
grant execute on function public.reject_host_application(uuid, text) to authenticated;
grant execute on function public.resubmit_host_application() to authenticated;
