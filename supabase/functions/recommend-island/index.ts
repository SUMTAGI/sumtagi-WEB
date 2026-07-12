// Supabase Edge Function: recommend-island
// 홈 검색창에 입력한 자연어 여행 취향을 분석해 인천 옹진군 섬 중 1개를 추천한다.
// 섬간 이동(환승)이 번거로워 CreateTrip이 한 번에 한 섬만 선택 가능하도록 바뀌어서,
// 이 함수도 여러 섬을 추천하지 않고 가장 잘 맞는 섬 하나만 고른다.
// Deno 런타임. API Key는 이 파일에서만 사용하며 절대 프론트에 노출되지 않습니다.

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

interface RecommendRequest {
  query: string;
}

// ─── 섬 목록 (ferry.ts ALL_ISLANDS와 동일 22개) — 환각 방지를 위해 enum으로 강제 ──

const ISLAND_NAMES = [
  "백령도", "대청도", "소청도", "연평도",
  "덕적도", "자월도", "승봉도", "대이작도",
  "소이작도", "풍도", "육도", "신도", "장봉도",
  "영흥도", "선재도", "굴업도", "시도", "모도", "소야도",
  "문갑도", "백아도", "울도",
];

const TRAVEL_STYLES = ["관광", "휴양", "체험", "사진", "생태", "무장애", "반려동물"];

// LLM이 섬을 고를 때 참고할 섬별 한 줄 특징 (프롬프트 컨텍스트, 환각 방지용)
const ISLAND_CONTEXT = `
- 백령도: 서해 최북단, 사곶 천연비행장 해변, 두무진 기암괴석, 배편 4시간
- 대청도: 옥죽동 모래사막, 농여해변 풀등
- 소청도: 분바위(대리석 해안), 아주 조용함
- 연평도: 꽃게잡이로 유명, 소박한 어촌
- 덕적도: 서포리해수욕장, 소나무숲, 접근성 좋음
- 자월도: 장골해변, 가족 단위 휴양
- 승봉도: 이일레해변, 야영/캠핑
- 대이작도: 풀등(썰물 때 드러나는 모래섬), 트레킹
- 소이작도: 한적하고 인적 드묾
- 풍도: 봄철 야생화 군락
- 육도: 주민 30명 남짓, 매우 작고 조용한 섬
- 신도·시도·모도: 다리로 연결된 3형제 섬, 배미꾸미 조각공원(모도)
- 장봉도: 넓은 갯벌 체험
- 영흥도: 다리 연결, 십리포해변, 근교 당일치기
- 선재도: 목섬 산책로(물때에 따라 걸어서 이동)
- 굴업도: 트레킹 명소, 개머리언덕
- 소야도: 다리 연결, 조용함
- 문갑도: 깃대봉 산행
- 백아도: 기차바위 산행
- 울도: 작고 조용한 어촌
`;

// ─── 프롬프트 ──────────────────────────────────────────────────────────────────

function buildPrompt(query: string): { system: string; user: string } {
  const system = `당신은 인천 옹진군 섬 여행 추천 전문가입니다.
사용자의 자연어 요청을 분석해 아래 22개 섬 중에서 가장 잘 어울리는 섬을 딱 1개만 추천하고,
7개 여행 스타일 중 가장 어울리는 하나를 고르세요.
섬간 이동은 배편이 마땅치 않아 번거로우므로 여러 섬을 묶어 추천하지 마세요.
목록에 없는 섬 이름은 절대 만들어내지 마세요.
반드시 순수 JSON만으로 응답하세요.`;

  const user = `사용자 요청: "${query}"

[섬 목록과 특징]
${ISLAND_CONTEXT}

[여행 스타일 목록]
${TRAVEL_STYLES.join(", ")}

아래 JSON 형식으로만 응답하세요 (섬은 반드시 1개만):
{
  "island": "섬 이름",
  "travelStyle": "스타일",
  "reason": "이 섬과 스타일을 추천한 이유 (한두 문장, 사용자에게 보여줄 친근한 말투)"
}`;

  return { system, user };
}

// ─── 응답 스키마 (constrained decoding — 유효하지 않은 섬/스타일 원천 차단) ──────

const RECOMMEND_SCHEMA = {
  type: "OBJECT",
  properties: {
    island: { type: "STRING", enum: ISLAND_NAMES },
    travelStyle: { type: "STRING", enum: TRAVEL_STYLES },
    reason: { type: "STRING" },
  },
  required: ["island", "travelStyle", "reason"],
};

// ─── Gemini 호출 ───────────────────────────────────────────────────────────────

async function callGemini(prompt: { system: string; user: string }): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다");

  // flash-lite: 섬 1개 고르는 정도의 가벼운 작업이라 무료 티어 일일 한도가
  // 훨씬 넉넉한(약 20회 → 약 1,000회) lite 모델로 낮춤. enum 스키마로 이미
  // 유효한 섬/스타일만 나오도록 강제하고 있어 모델을 가볍게 해도 무방함.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: prompt.system }] },
      contents: [{ role: "user", parts: [{ text: prompt.user }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RECOMMEND_SCHEMA,
        temperature: 0.8,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API 오류 ${res.status}: ${err}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? []).map((p: any) => p.text ?? "").join("");
  console.log(`[LLM 응답] finishReason: ${candidate?.finishReason} | 길이: ${text.length}자`);
  return text;
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

  try {
    const body: RecommendRequest = await req.json();

    if (!body.query?.trim()) {
      return new Response(
        JSON.stringify({ error: "INVALID_INPUT", message: "query는 필수입니다" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const prompt = buildPrompt(body.query.trim());

    let raw: string;
    try {
      raw = await callGemini(prompt);
    } catch (firstErr) {
      console.error("[1차 시도 실패] 1초 후 재시도:", String(firstErr));
      await new Promise((r) => setTimeout(r, 1000));
      raw = await callGemini(prompt);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error(`[파싱 실패] raw 앞 300자: ${raw.slice(0, 300)}`);
      return new Response(
        JSON.stringify({ error: "LLM_PARSE_FAILED" }),
        { status: 422, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // 스키마 enum이 있어도 방어적으로 한 번 더 유효성 검사
    const island: string | undefined = ISLAND_NAMES.includes(parsed.island) ? parsed.island : undefined;

    if (!island || !TRAVEL_STYLES.includes(parsed.travelStyle)) {
      console.error("[구조 오류] 유효한 섬/스타일 없음 →", JSON.stringify(parsed).slice(0, 300));
      return new Response(
        JSON.stringify({ error: "LLM_PARSE_FAILED" }),
        { status: 422, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        island,
        travelStyle: parsed.travelStyle,
        reason: parsed.reason ?? "",
      }),
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
