// AI 일정 생성 서비스 레이어
// 프론트는 이 파일만 사용합니다. API Key는 절대 여기 없습니다.

import { supabase } from "../supabase";
import {
  generateItinerary as generateItineraryFallback,
  type TripFormData,
  type GeneratedItinerary,
} from "../../app/utils/itineraryGenerator";

// ─── 타입 ─────────────────────────────────────────────────────────────────────

export type LLMProvider = "gemini" | "openai" | "grok";

export interface AIItineraryRequest {
  departurePort: string;
  islands: string[];
  startDate: string;
  endDate: string;
  travelers: number;
  travelStyle: string;       // "관광" | "휴양" | "체험" | "사진"
  budget: string;            // "알뜰" | "보통" | "여유"
  specialRequests?: string;
  provider?: LLMProvider;    // 기본값: "gemini"
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

// ─── 공개 API: AI 시도 → 실패 시 규칙 기반 fallback ─────────────────────────

export async function generateItinerary(
  req: AIItineraryRequest,
  onFallback?: (reason: string) => void
): Promise<GeneratedItineraryWithMeta> {
  try {
    return await callEdgeFunction(req);
  } catch (err: any) {
    const reason = err?.message ?? "알 수 없는 오류";
    console.warn(`AI 일정 생성 실패 (${reason}), 규칙 기반 fallback 실행`);
    onFallback?.(reason);

    const formData: TripFormData = {
      departurePort: req.departurePort,
      startDate:     req.startDate,
      endDate:       req.endDate,
      travelers:     req.travelers,
      travelType:    req.travelStyle,
      islands:       req.islands,
      budget:        req.budget,
    };

    return {
      ...generateItineraryFallback(formData),
      generatedBy: "fallback" as const,
    };
  }
}
