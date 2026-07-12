// Supabase Edge Function: generate-itinerary
// Deno 런타임. API Key는 이 파일에서만 사용하며 절대 프론트에 노출되지 않습니다.

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type LLMProvider = "gemini" | "openai" | "grok";

interface ItineraryRequest {
  departurePort: string;
  islands: string[];
  startDate: string;
  endDate: string;
  travelers: number;
  travelStyle: string;
  budget: string;
  specialRequests?: string;
  provider?: LLMProvider;
}

// ─── 배편 컨텍스트 (LLM 환각 방지) ──────────────────────────────────────────
// 요청과 무관한 다른 섬의 항로까지 다 보여주면 모델이 그쪽으로 일정을 만들어버리는
// 문제가 있었음(예: 백령도 요청인데 대청도/풍도로 응답) → 실제 요청과 매칭되는
// 항로만 골라서 보여주도록 변경.

const FERRY_ROUTES: { from: string; to: string; depart: string; arrive: string; price: number }[] = [
  { from: "인천항", to: "백령도",   depart: "08:00", arrive: "12:00", price: 45000 },
  { from: "인천항", to: "대청도",   depart: "08:30", arrive: "12:30", price: 45000 },
  { from: "인천항", to: "연평도",   depart: "09:00", arrive: "12:30", price: 40000 },
  { from: "인천항", to: "덕적도",   depart: "09:00", arrive: "11:30", price: 28000 },
  { from: "인천항", to: "자월도",   depart: "09:30", arrive: "12:00", price: 25000 },
  { from: "인천항", to: "승봉도",   depart: "10:00", arrive: "12:00", price: 23000 },
  { from: "인천항", to: "대이작도", depart: "10:30", arrive: "12:30", price: 25000 },
  { from: "대부도", to: "자월도",   depart: "09:00", arrive: "11:00", price: 25000 },
  { from: "대부도", to: "승봉도",   depart: "09:30", arrive: "11:00", price: 23000 },
  { from: "대부도", to: "풍도",     depart: "11:30", arrive: "14:00", price: 27000 },
  { from: "대부도", to: "덕적도",   depart: "11:00", arrive: "13:00", price: 28000 },
];

function buildFerryContext(departurePort: string, islands: string[]): string {
  const relevant = FERRY_ROUTES.filter((r) => r.from === departurePort && islands.includes(r.to));
  const body = relevant.length > 0
    ? relevant.map((r) => `- ${r.from}→${r.to}: ${r.depart} 출발, ${r.arrive} 도착 (${r.price.toLocaleString()}원/인)`).join("\n")
    : `- ${departurePort}→${islands.join(", ")}: 정확한 시간표는 확인되지 않음 — 오전 출발/오후 복귀로 가정하고 구체적 시각은 지어내지 말 것`;
  return `${body}\n복귀 배편은 출발 배편의 역방향으로 오후 14:00~15:30 사이 출발합니다.\n주의: 실제 운항 여부는 당일 기상에 따라 달라질 수 있습니다.`;
}

// ─── 프롬프트 생성 ────────────────────────────────────────────────────────────

function buildPrompt(req: ItineraryRequest): { system: string; user: string } {
  const ms = new Date(req.endDate).getTime() - new Date(req.startDate).getTime();
  const numDays = Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;

  const system = `당신은 인천 섬 여행 전문 플래너입니다.
사용자 조건에 맞는 여행 일정을 반드시 순수 JSON만으로 응답하세요.
마크다운 코드블록(\`\`\`), 설명 텍스트, 주석은 절대 포함하지 마세요.
첫 날은 배편 탑승으로 시작하고 마지막 날은 복귀 배편으로 끝내세요.
일정에 등장하는 모든 장소(숙소·식당·관광지)는 반드시 사용자가 지정한 섬 안에만 있어야 합니다.
[참고 배편 정보]에 나오지 않는 다른 섬 이름을 절대 등장시키지 마세요.`;

  const user = `다음 조건으로 ${numDays}일 섬 여행 일정을 만들어주세요:
- 출발 항구: ${req.departurePort}
- 목적지 섬 (반드시 이 섬만 방문, 다른 섬으로 절대 바꾸지 말 것): ${req.islands.join(", ")}
- 여행 기간: ${req.startDate} ~ ${req.endDate} (${numDays}일)
- 인원: ${req.travelers}명
- 여행 스타일: ${req.travelStyle}
- 예산: ${req.budget} (알뜰=민박·분식, 보통=펜션·식당, 여유=리조트·해산물)
${req.specialRequests ? `- 특별 요청: ${req.specialRequests}` : ""}

[참고 배편 정보]
${buildFerryContext(req.departurePort, req.islands)}

아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "title": "여행 제목",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dayNumber": 1,
      "activities": [
        {
          "time": "HH:MM",
          "type": "ferry | meal | attraction | accommodation | tip",
          "title": "활동 이름",
          "location": "장소",
          "description": "설명",
          "duration": 60,
          "estimatedCost": 28000
        }
      ]
    }
  ],
  "tips": ["팁1", "팁2"],
  "cautions": ["주의사항1", "주의사항2"],
  "estimatedTotalCost": 150000,
  "highlights": ["핵심 볼거리1", "핵심 볼거리2"]
}`;

  return { system, user };
}

// ─── Provider별 API 호출 ──────────────────────────────────────────────────────

// 파싱 실패 시 원인 진단용 — 마지막 Gemini 호출의 finishReason/토큰 사용량
let lastGeminiDebug: { finishReason?: string; usageMetadata?: unknown; partsCount?: number } | null = null;

// Gemini responseSchema — responseMimeType만으로는 문법을 강제하지 않아 모델이
// 마지막 닫는 괄호를 빼먹고 finishReason: STOP으로 조기 종료하는 문제가 있었음.
// 스키마를 주면 constrained decoding으로 구조적으로 유효한 JSON만 나오도록 강제됨.
const ITINERARY_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    days: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          date: { type: "STRING" },
          dayNumber: { type: "INTEGER" },
          activities: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                time: { type: "STRING" },
                type: { type: "STRING" },
                title: { type: "STRING" },
                location: { type: "STRING" },
                description: { type: "STRING" },
                duration: { type: "INTEGER" },
                estimatedCost: { type: "INTEGER" },
              },
              required: ["time", "type", "title", "location", "duration"],
            },
          },
        },
        required: ["date", "dayNumber", "activities"],
      },
    },
    tips: { type: "ARRAY", items: { type: "STRING" } },
    cautions: { type: "ARRAY", items: { type: "STRING" } },
    estimatedTotalCost: { type: "INTEGER" },
    highlights: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["title", "days"],
};

async function callGemini(prompt: { system: string; user: string }): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다");

  // flash-lite로 낮춰봤다가 되돌림(2026-07-13): departurePort/islands 등 명시적으로
  // 지정한 입력값을 무시하고 전혀 다른 섬/항구로 일정을 만들어내는 문제가 재현돼서
  // (예: 백령도+인천항 요청 → 덕적도/풍도+대부도로 응답) 정확도가 필수인 이 함수는
  // 다시 flash-latest로 유지. 가벼운 작업(recommend-island)에만 lite를 적용함.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  console.log("[LLM 호출] Gemini API 요청 시작");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: prompt.system }] },
      contents: [{ role: "user", parts: [{ text: prompt.user }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: ITINERARY_SCHEMA,
        temperature: 0.7,
        maxOutputTokens: 32768,
        // ⚠️ 미해결 이슈(2026-07-13): 요청한 섬(예: 백령도)을 무시하고 다른 섬
        // (대청도/승봉도/풍도/대이작도 등, 매번 다름)으로 일정을 만드는 문제가
        // temperature 0.3~0.7, thinkingBudget 0~2048 여러 조합에서 재현됨 —
        // 이 파라미터들이 원인이 아닐 가능성이 높음(원인 미확인). API 일일
        // 할당량 소진으로 추가 조사 중단. thinkingBudget: 0은 최소한 JSON
        // 완성도(잘림 없음)는 검증됐으므로 그 값으로 유지.
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[LLM 오류] Gemini HTTP ${res.status}:`, err.slice(0, 300));
    throw new Error(`Gemini API 오류 ${res.status}: ${err}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  // parts가 여러 조각으로 나뉘어 오는 경우 parts[0]만 읽으면 뒷부분이 조용히 누락됨
  const text = (candidate?.content?.parts ?? []).map((p: any) => p.text ?? "").join("");
  lastGeminiDebug = {
    finishReason: candidate?.finishReason,
    usageMetadata: data.usageMetadata,
    partsCount: candidate?.content?.parts?.length ?? 0,
  };
  console.log(
    `[LLM 응답] Gemini 수신 완료 | finishReason: ${candidate?.finishReason} | parts: ${candidate?.content?.parts?.length ?? 0}개 | usage: ${JSON.stringify(data.usageMetadata)} | 길이: ${text.length}자 | 앞 200자: ${text.slice(0, 200)}`
  );
  return text;
}

async function callOpenAI(prompt: { system: string; user: string }): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY 환경변수가 설정되지 않았습니다");

  console.log("[LLM 호출] OpenAI API 요청 시작");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API 오류 ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.choices[0].message.content;
  console.log(`[LLM 응답] OpenAI 수신 완료 | 길이: ${text.length}자`);
  return text;
}

async function callGrok(prompt: { system: string; user: string }): Promise<string> {
  const apiKey = Deno.env.get("GROK_API_KEY");
  if (!apiKey) throw new Error("GROK_API_KEY 환경변수가 설정되지 않았습니다");

  console.log("[LLM 호출] Grok API 요청 시작");
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-beta",
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grok API 오류 ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.choices[0].message.content;
  console.log(`[LLM 응답] Grok 수신 완료 | 길이: ${text.length}자`);
  return text;
}

// Provider 라우터 — 나중에 provider 추가 시 여기에만 케이스를 추가
async function generateItineraryWithLLM(
  provider: LLMProvider,
  prompt: { system: string; user: string }
): Promise<string> {
  switch (provider) {
    case "gemini": return await callGemini(prompt);
    case "openai": return await callOpenAI(prompt);
    case "grok":   return await callGrok(prompt);
    default:       throw new Error(`알 수 없는 provider: ${provider}`);
  }
}

// ─── CORS ────────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── 메인 핸들러 ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const ts = new Date().toISOString();
  console.log(`\n========== [AI 일정 요청] ${ts} ==========`);
  console.log(`[요청 수신] method: ${req.method} | url: ${req.url}`);

  try {
    const body: ItineraryRequest = await req.json();
    const provider: LLMProvider = body.provider ?? "gemini";

    console.log(`[Provider 선택] ${provider}`);
    console.log(`[요청 내용] 섬: ${body.islands?.join(", ")} | 기간: ${body.startDate}~${body.endDate} | 인원: ${body.travelers}명 | 스타일: ${body.travelStyle} | 예산: ${body.budget}`);

    // 입력 유효성 검사
    if (!body.islands?.length || !body.startDate || !body.endDate || !body.departurePort) {
      console.error("[유효성 오류] 필수 항목 누락");
      return new Response(
        JSON.stringify({ error: "INVALID_INPUT", message: "islands, startDate, endDate, departurePort 는 필수입니다" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const prompt = buildPrompt(body);

    // LLM 호출 (1회 자동 재시도)
    let raw: string;
    try {
      raw = await generateItineraryWithLLM(provider, prompt);
    } catch (firstErr) {
      console.error("[1차 시도 실패] 2초 후 재시도:", String(firstErr));
      await new Promise((r) => setTimeout(r, 2000));
      console.log("[재시도] 2차 LLM 호출 시작");
      raw = await generateItineraryWithLLM(provider, prompt);
    }

    // JSON 파싱 검증 (Gemini가 가끔 코드블록을 붙이는 경우 방어 처리)
    let parsed: any;
    try {
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsed = JSON.parse(cleaned);
      console.log(`[파싱 성공] days: ${parsed.days?.length}일 | title: ${parsed.title}`);
    } catch {
      console.error(`[파싱 실패] fallback 트리거 | raw 앞 300자: ${raw.slice(0, 300)} | debug: ${JSON.stringify(lastGeminiDebug)}`);
      return new Response(
        JSON.stringify({ error: "LLM_PARSE_FAILED", raw, debug: lastGeminiDebug }),
        { status: 422, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // 최소 필드 검증
    if (!Array.isArray(parsed.days) || parsed.days.length === 0) {
      console.error("[구조 오류] days 배열 없음 → fallback 트리거");
      return new Response(
        JSON.stringify({ error: "LLM_PARSE_FAILED", raw }),
        { status: 422, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    console.log(`[완료] LLM 일정 생성 성공 | provider: ${provider}`);
    console.log(`==========================================\n`);

    return new Response(
      JSON.stringify({ ok: true, itinerary: parsed, provider }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[치명적 오류] Edge Function 예외:", String(err));
    return new Response(
      JSON.stringify({ error: "INTERNAL_ERROR", message: String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
