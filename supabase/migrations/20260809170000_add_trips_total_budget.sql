-- ============================================================================
-- 경비관리(Budget) 기능: trips.total_budget 컬럼 추가
-- ============================================================================
-- 적용 방법: supabase db push
-- 또는 Supabase Dashboard > SQL Editor 에 이 파일 내용을 붙여넣어 실행
--
-- 경비관리 화면(Budget.tsx / budget_screen.dart)에서 사용자가 직접 설정하는
-- 여행 총예산 상한(원 단위). 기존 trips.budget(알뜰/보통/여유 정성적 태그),
-- trips.total_cost(AI가 생성한 일정의 추정 비용)와는 별개 필드 — 혼동 금지.
-- 재실행 안전(add column if not exists).
-- ============================================================================

alter table public.trips
  add column if not exists total_budget integer;
