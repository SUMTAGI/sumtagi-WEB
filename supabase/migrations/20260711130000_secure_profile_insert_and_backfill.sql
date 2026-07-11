-- ============================================================================
-- 1-2단계: anon 함수 실행 권한 정리 + profiles INSERT 시 role 위조 차단
--          + 기존 profiles-less 사용자 백필
-- ============================================================================
-- 주의: 이 파일은 초안입니다. 적용 전 검토 대상입니다.
-- 적용 방법:
--   supabase db push
--   또는 Supabase Dashboard > SQL Editor 에 이 파일 내용을 붙여넣어 실행
--
-- 이 파일이 다루지 않는 것: kimsungil322@gmail.com 계정을 admin으로 지정하는
-- UPDATE는 특정 계정에 대한 1회성 운영 작업이라 스키마 마이그레이션에 넣지
-- 않고, 이 파일 적용 및 백필 확인 후 별도의 단발 SQL로 실행한다.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. anon 함수 실행 권한 제거
-- ----------------------------------------------------------------------------
-- 직전 마이그레이션에서 PUBLIC만 revoke했는데, 이 프로젝트에 이미 걸려있던
-- Supabase 기본 ALTER DEFAULT PRIVILEGES가 anon에게 PUBLIC과 무관하게 직접
-- EXECUTE를 부여해서 anon 권한이 남아 있었다. anon에서 명시적으로 다시 revoke.
-- (함수 내부의 auth.uid() 검증 때문에 실제 악용은 불가능했지만, 호출 자체를
-- 막아 공격 표면을 줄이고 의도한 권한 모델과 실제 ACL을 일치시킨다.)

revoke execute on function public.approve_host_application(uuid) from anon;
revoke execute on function public.reject_host_application(uuid, text) from anon;
revoke execute on function public.resubmit_host_application() from anon;

revoke execute on function public.approve_host_application(uuid) from public;
revoke execute on function public.reject_host_application(uuid, text) from public;
revoke execute on function public.resubmit_host_application() from public;

grant execute on function public.approve_host_application(uuid) to authenticated;
grant execute on function public.reject_host_application(uuid, text) to authenticated;
grant execute on function public.resubmit_host_application() to authenticated;


-- ----------------------------------------------------------------------------
-- 2. profiles_insert 정책 교체: role='user'가 아니면 INSERT 자체를 거부
-- ----------------------------------------------------------------------------
-- 기존: with check (auth.uid() = id)  — role 값은 전혀 검사하지 않았음.
-- role 컬럼이 생긴 지금, profiles row가 없는 사용자가 자기 id로 직접
-- INSERT하면서 role='host'/'admin'을 끼워 넣을 수 있었던 구멍을 막는다.
--
-- handle_new_user()는 SECURITY DEFINER(테이블 소유자 권한으로 실행)라 이
-- RLS 정책 자체가 적용되지 않고, role 컬럼도 명시하지 않아 DEFAULT 'user'가
-- 그대로 들어가므로 이 정책 변경과 무관하게 항상 정상 동작한다(사전 확인함).

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert
  on public.profiles
  for insert
  to public
  with check (auth.uid() = id and role = 'user');


-- ----------------------------------------------------------------------------
-- 3. INSERT 단계 role 보호: BEFORE INSERT 트리거 (RLS와 별개의 방어 계층)
-- ----------------------------------------------------------------------------
-- RLS만 의존하지 않고, 정책이 나중에 실수로 느슨해지거나 우회되는 경우에도
-- 막을 수 있도록 컬럼 값 자체를 검사하는 트리거를 별도로 둔다.
--
-- SECURITY DEFINER를 쓰지 않았다 — auth.uid()는 STABLE SQL 함수라 별도 권한이
-- 필요 없고, NEW.role도 테이블 조회 없이 트리거에 바로 주어지므로 이 함수는
-- 권한 상승이 전혀 필요 없다(최소 권한 원칙).
--
-- auth.uid()가 NULL인 경우(Dashboard SQL Editor, service_role, 그리고
-- handle_new_user처럼 SECURITY DEFINER로 실행되어 RLS를 우회하는 트리거 등
-- JWT 컨텍스트가 없는 모든 신뢰된 경로)는 검사를 건너뛴다 — 관리자 부트스트랩과
-- 백필은 항상 이런 경로로만 수행되므로 막히지 않는다.

create or replace function public.protect_profiles_insert_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and new.role is distinct from 'user' then
    raise exception '신규 프로필의 role은 user로만 생성할 수 있습니다';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_insert_role on public.profiles;
create trigger profiles_protect_insert_role
  before insert on public.profiles
  for each row
  execute function public.protect_profiles_insert_role();


-- ----------------------------------------------------------------------------
-- 4. 누락된 profiles 백필
-- ----------------------------------------------------------------------------
-- auth.users에는 있지만 public.profiles가 없는 사용자에게만 role='user'로
-- 최소 프로필을 만들어준다. 이미 존재하는 profiles는 절대 건드리지 않는다
-- (LEFT JOIN ... WHERE p.id IS NULL로 대상 자체를 좁히고,
--  ON CONFLICT (id) DO NOTHING으로 한 번 더 방어).
--
-- nickname 우선순위: raw_user_meta_data->>'nickname' → 이메일 @ 앞부분 →
-- 그마저 없으면 'user_' + id 앞 8자리(안전한 대체값).
--
-- 이 INSERT는 db query CLI(신뢰된 컨텍스트, auth.uid() = null)로 실행되므로
-- 위 3번 트리거에 걸리지 않는다. role은 어차피 전부 'user'라 걸릴 값도 없다.

insert into public.profiles (id, nickname, role)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data->>'nickname', ''),
    nullif(split_part(u.email, '@', 1), ''),
    'user_' || substr(u.id::text, 1, 8)
  ) as nickname,
  'user' as role
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;
