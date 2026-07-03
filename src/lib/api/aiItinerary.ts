// AI 일정 생성 서비스 레이어
// 프론트는 이 파일만 사용합니다. API Key는 절대 여기 없습니다.

import { supabase } from "../supabase";
import {
  generateItinerary as generateItineraryFallback,
  prefetchDurunubiData,
  prefetchSpecialTourData,
  type TripFormData,
  type GeneratedItinerary,
} from "../../app/utils/itineraryGenerator";
import { buildRoutingHints } from "./relatedAttractions";
import { getIslandDemandLevel } from "./demandIntensity";
import { isSpecialTravelStyle } from "./specialTour";

// ─── 타입 ─────────────────────────────────────────────────────────────────────

export type LLMProvider = "gemini" | "openai" | "grok";

// 한국어 섬 이름 → id (ferry.ts ALL_ISLANDS와 동일 22개)
const ISLAND_NAME_TO_ID: Record<string, string> = {
  '백령도': 'baengnyeong', '대청도': 'daecheong',   '소청도': 'socheong',
  '연평도': 'yeonpyeong',  '덕적도': 'deokjeok',    '자월도': 'jawol',
  '승봉도': 'seungbong',   '대이작도': 'daeijak',   '소이작도': 'soijak',
  '영흥도': 'yeonghung',   '풍도': 'pungdo',        '굴업도': 'guleop',
  '육도': 'yukdo',         '선재도': 'seonjae',
  '신도': 'sindo',         '시도': 'sido',          '모도': 'modo',
  '장봉도': 'jangbongdo',  '소야도': 'soya',        '문갑도': 'mungap',
  '백아도': 'baegado',     '울도': 'uldo',
}

export interface AIItineraryRequest {
  departurePort: string;
  islands: string[];
  startDate: string;
  endDate: string;
  travelers: number;
  travelStyle: string;       // "관광" | "휴양" | "체험" | "사진" | "생태" | "무장애" | "반려동물"
  budget: string;            // "알뜰" | "보통" | "여유"
  specialRequests?: string;
  provider?: LLMProvider;    // 기본값: "gemini"
  // 관광공사 OpenAPI 컨텍스트 (Edge Function에서 프롬프트 강화에 사용)
  routingHints?:   Record<string, string[]>;  // 연관관광지 힌트
  demandLevels?:   Record<string, string>;    // 섬별 수요강도
  specialFilter?:  string;                    // 특수 여행 유형 ("eco"|"barrier_free"|"pet_friendly")
}

export type GeneratedBy = "llm" | "fallback";

export type GeneratedItineraryWithMeta = GeneratedItinerary & {
  generatedBy: GeneratedBy;  // "llm" = AI 생성, "fallback" = 규칙 기반 대체
  tips?: string[];
  cautions?: string[];
  highlights?: string[];
};

// ─── Edge Function 응답 → GeneratedItinerary 변환 ────────────────────────────

function transformResponse(aiData: any, req: AIItineraryRequest): GeneratedItinerary {
  return {
    id: Date.now().toString(),
    title: aiData.title ?? `${req.islands.join(", ")} 여행`,
    departurePort: req.departurePort,
    startDate: req.startDate,
    endDate: req.endDate,
    travelers: req.travelers,
    islands: req.islands,
    totalCost: aiData.estimatedTotalCost ?? 0,
    days: (aiData.days ?? []).map((day: any) => ({
      date: day.date,
      dayNumber: day.dayNumber,
      activities: (day.activities ?? []).map((act: any, idx: number) => ({
        id: `ai-d${day.dayNumber}-${idx}`,
        type: act.type ?? "attraction",
        time: act.time ?? "09:00",
        title: act.title ?? "",
        location: act.location ?? (req.islands[0] ?? ""),
        duration: act.duration ?? 60,
        description: act.description ?? "",
        price: act.estimatedCost ?? undefined,
        bookingStatus: act.type === "ferry" ? "available" : undefined,
      })),
    })),
  };
}

// ─── AI 호출 (Edge Function) ──────────────────────────────────────────────────

async function callEdgeFunction(req: AIItineraryRequest): Promise<GeneratedItineraryWithMeta> {
  const { data, error } = await supabase.functions.invoke("generate-itinerary", {
    body: req,
  });

  if (error) throw new Error(`Edge Function 오류: ${error.message}`);

  // 422: LLM이 파싱 불가한 응답 반환 → fallback 트리거
  if (!data?.ok || !data?.itinerary) {
    const code = data?.error ?? "UNKNOWN";
    throw new Error(`LLM 응답 오류 [${code}]`);
  }

  const base = transformResponse(data.itinerary, req);

  return {
    ...base,
    generatedBy: "llm" as const,
    tips:        data.itinerary.tips       ?? [],
    cautions:    data.itinerary.cautions   ?? [],
    highlights:  data.itinerary.highlights ?? [],
  };
}

// ─── 관광공사 API 컨텍스트 사전 수집 ────────────────────────────────────────

async function enrichRequestContext(req: AIItineraryRequest): Promise<AIItineraryRequest> {
  const islandIds = req.islands.map((name) => ISLAND_NAME_TO_ID[name] ?? name)

  // 병렬로 컨텍스트 수집 (실패해도 계속 진행)
  const [routingResult, demandResult] = await Promise.allSettled([
    buildRoutingHints(islandIds),
    Promise.all(islandIds.map(async (id) => [id, await getIslandDemandLevel(id)] as [string, string | null])),
  ])

  const routingHints =
    routingResult.status === 'fulfilled' ? routingResult.value : {}

  const demandLevels: Record<string, string> = {}
  if (demandResult.status === 'fulfilled') {
    for (const [id, level] of demandResult.value) {
      if (level) demandLevels[id] = level
    }
  }

  // 두루누비 데이터 사전 로드 (fallback용)
  await prefetchDurunubiData(islandIds).catch(() => {})

  const specialFilter = isSpecialTravelStyle(req.travelStyle)
    ? req.travelStyle
    : undefined

  return { ...req, routingHints, demandLevels, specialFilter }
}

// ─── 공개 API: AI 시도 → 실패 시 규칙 기반 fallback ─────────────────────────

export async function generateItinerary(
  req: AIItineraryRequest,
  onFallback?: (reason: string) => void
): Promise<GeneratedItineraryWithMeta> {
  // 관광공사 API 컨텍스트 사전 수집
  const enrichedReq = await enrichRequestContext(req)

  try {
    return await callEdgeFunction(enrichedReq);
  } catch (err: any) {
    const reason = err?.message ?? "알 수 없는 오류";
    console.warn(`AI 일정 생성 실패 (${reason}), 규칙 기반 fallback 실행`);
    onFallback?.(reason);

    const islandIds = req.islands.map((name) => ISLAND_NAME_TO_ID[name] ?? name)

    // 특수 여행 유형이면 관광공사 데이터를 fallback 데이터로 보강
    let extraAttractions: any[] = []
    if (isSpecialTravelStyle(req.travelStyle)) {
      extraAttractions = await prefetchSpecialTourData(req.travelStyle, islandIds).catch(() => [])
    }

    const formData: TripFormData = {
      departurePort: req.departurePort,
      startDate:     req.startDate,
      endDate:       req.endDate,
      travelers:     req.travelers,
      travelType:    req.travelStyle,
      islands:       req.islands,
      budget:        req.budget,
    };

    const base = generateItineraryFallback(formData)

    // 특수 여행 관광지가 있으면 첫날에 삽입
    if (extraAttractions.length > 0 && base.days.length > 0) {
      const extra = extraAttractions.slice(0, 2).map((a: any, i: number) => ({
        id:          `special-fallback-${i}`,
        type:        'attraction' as const,
        time:        `${15 + i}:30`,
        title:       a.name,
        location:    a.island,
        duration:    a.duration ?? 90,
        description: a.description,
        congestionLevel: 'low' as const,
      }))
      base.days[0].activities.push(...extra)
    }

    return {
      ...base,
      generatedBy: "fallback" as const,
    };
  }
}
