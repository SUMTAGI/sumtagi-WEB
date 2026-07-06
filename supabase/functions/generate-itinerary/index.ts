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

const FERRY_CONTEXT = `
인천항 출발 참고 배편:
- 인천항→백령도: 08:00 출발, 12:00 도착 (45,000원/인)
- 인천항→대청도: 08:30 출발, 12:30 도착 (45,000원/인)
- 인천항→연평도: 09:00 출발, 12:30 도착 (40,000원/인)
- 인천항→덕적도: 09:00 출발, 11:30 도착 (28,000원/인)
- 인천항→자월도: 09:30 출발, 12:00 도착 (25,000원/인)
- 인천항→승봉도: 10:00 출발, 12:00 도착 (23,000원/인)
- 인천항→대이작도: 10:30 출발, 12:30 도착 (25,000원/인)
대부도항 출발 참고 배편:
- 대부도→자월도: 09:00 출발, 11:00 도착 (25,000원/인)
- 대부도→승봉도: 09:30 출발, 11:00 도착 (23,000원/인)
- 대부도→풍도:   11:30 출발, 14:00 도착 (27,000원/인)
- 대부도→덕적도: 11:00 출발, 13:00 도착 (28,000원/인)
복귀 배편은 출발 배편의 역방향으로 오후 14:00~15:30 사이 출발합니다.
주의: 실제 운항 여부는 당일 기상에 따라 달라질 수 있습니다.
`;

// ─── 프롬프트 생성 ────────────────────────────────────────────────────────────

function buildPrompt(req: ItineraryRequest): { system: string; user: string } {
  const ms = new Date(req.endDate).getTime() - new Date(req.startDate).getTime();
  const numDays = Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1;

  const system = `당신은 인천 섬 여행 전문 플래너입니다.
사용자 조건에 맞는 여행 일정을 반드시 순수 JSON만으로 응답하세요.
마크다운 코드블록(\`\`\`), 설명 텍스트, 주석은 절대 포함하지 마세요.
첫 날은 배편 탑승으로 시작하고 마지막 날은 복귀 배편으로 끝내세요.`;

  const user = `다음 조건으로 ${numDays}일 섬 여행 일정을 만들어주세요:
- 출발 항구: ${req.departurePort}
- 목적지 섬: ${req.islands.join(", ")}
- 여행 기간: ${req.startDate} ~ ${req.endDate} (${numDays}일)
- 인원: ${req.travelers}명
- 여행 스타일: ${req.travelStyle}
- 예산: ${req.budget} (알뜰=민박·분식, 보통=펜션·식당, 여유=리조트·해산물)
${req.specialRequests ? `- 특별 요청: ${req.specialRequests}` : ""}

[참고 배편 정보]
${FERRY_CONTEXT}

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

async function callGemini(prompt: { system: string; user: string }): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다");

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
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[LLM 오류] Gemini HTTP ${res.status}:`, err.slice(0, 300));
    throw new Error(`Gemini API 오류 ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates[0].content.parts[0].text;
  console.log(`[LLM 응답] Gemini 수신 완료 | 길이: ${text.length}자 | 앞 200자: ${text.slice(0, 200)}`);
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
      console.error(`[파싱 실패] fallback 트리거 | raw 앞 300자: ${raw.slice(0, 300)}`);
      return new Response(
        JSON.stringify({ error: "LLM_PARSE_FAILED", raw }),
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
