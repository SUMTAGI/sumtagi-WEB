-- ============================================================================
-- 섬 종류 관리자 CRUD: islands.status / islands.order_index 컬럼 + RLS 정책
-- ============================================================================
-- 주의: 이 파일은 초안입니다. 운영 DB에는 아직 적용하지 않았습니다.
-- 적용 방법:
--   supabase db push
--   또는 Supabase Dashboard > SQL Editor 에 이 파일 내용을 붙여넣어 실행
--
-- 재실행 안전성: ADD COLUMN IF NOT EXISTS / DROP POLICY IF EXISTS / DO 블록으로
-- 작성해 이 파일을 여러 번 실행해도 에러가 나지 않는다.
--
-- 배경: islands 테이블 자체는 이 저장소의 마이그레이션 밖(Dashboard)에서
-- 이미 생성되어 운영 중이며, 지금까지는 관리자가 이 데이터를 직접 관리할
-- 방법이 없었다(코드/DB 모두 CRUD 경로 없음). 이 파일은 그 관리 기능을
-- 추가하기 위해 최소한으로 필요한 스키마 변경만 담는다.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. status / order_index 컬럼 추가
-- ----------------------------------------------------------------------------
-- status 기본값을 'active'로 둬서, 컬럼이 추가되는 순간 기존에 등록된 섬은
-- 전부 그대로 활성 상태로 유지된다 (= 마이그레이션 적용 직후 사용자 화면에서
-- 섬이 갑자기 사라지는 회귀가 없다).
-- order_index 기본값 0 → 명시적으로 순서를 지정하지 않은 섬은 이름순 정렬의
-- 뒤를 그대로 따른다 (getIslands()가 order_index, name 순으로 정렬).

alter table public.islands
  add column if not exists status text not null default 'active';

alter table public.islands
  add column if not exists order_index integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'islands_status_check'
  ) then
    alter table public.islands
      add constraint islands_status_check check (status in ('active', 'inactive'));
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 2. RLS 활성화 + 정책
-- ----------------------------------------------------------------------------
-- 설계:
--   - SELECT: 일반 사용자(anon/authenticated)는 status='active'인 섬만 볼 수
--     있고, 관리자는 비활성 섬을 포함해 전부 볼 수 있다. Postgres RLS는 같은
--     명령(SELECT)에 대한 여러 permissive 정책을 OR로 합치므로 두 정책을
--     동시에 둬도 안전하다.
--   - INSERT/UPDATE/DELETE: 관리자만 가능. 지금까지 앱 코드 어디에도 islands
--     테이블에 쓰기 요청을 보내는 곳이 없었으므로(SELECT만 존재), 이 정책을
--     추가해도 기존 동작을 막을 위험이 없다 — 오히려 지금까지 열려 있었을 수
--     있는 쓰기 경로를 관리자 전용으로 좁히는 효과가 있다.

alter table public.islands enable row level security;

drop policy if exists islands_select_public on public.islands;
create policy islands_select_public
  on public.islands
  for select
  to public
  using (status = 'active');

drop policy if exists islands_select_admin on public.islands;
create policy islands_select_admin
  on public.islands
  for select
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists islands_admin_insert on public.islands;
create policy islands_admin_insert
  on public.islands
  for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists islands_admin_update on public.islands;
create policy islands_admin_update
  on public.islands
  for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists islands_admin_delete on public.islands;
create policy islands_admin_delete
  on public.islands
  for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
