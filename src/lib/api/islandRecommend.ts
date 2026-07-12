// 홈 검색창 — 자연어 여행 취향 → AI 섬 추천 서비스 레이어
// 프론트는 이 파일만 사용합니다. API Key는 절대 여기 없습니다.

import { supabase } from "../supabase";

export interface IslandRecommendation {
  island: string;
  travelStyle: string;
  reason: string;
}

export async function recommendIsland(query: string): Promise<IslandRecommendation> {
  const { data, error } = await supabase.functions.invoke("recommend-island", {
    body: { query },
  });

  if (error) throw new Error(`추천 요청 오류: ${error.message}`);
  if (!data?.ok) throw new Error(`추천 실패 [${data?.error ?? "UNKNOWN"}]`);

  return {
    island: data.island,
    travelStyle: data.travelStyle,
    reason: data.reason,
  };
}
