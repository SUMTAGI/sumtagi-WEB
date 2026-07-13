// Supabase Edge Function: island-chat
// 고객센터 화면의 AI 상담 챗봇. Deno 런타임. API Key는 이 파일에서만 사용하며 절대 프론트에 노출되지 않습니다.
// generate-itinerary/recommend-island와 동일한 골격(재시도 1회, CORS, 섬 이름 환각 방지)을 따른다.

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

// ─── 섬 목록 (generate-itinerary/recommend-island와 동일 22개 미러) ────────────

const ISLAND_NAME_TO_ID: Record<string, string> = {
  '백령도': 'baengnyeong', '대청도': 'daecheong',   '소청도': 'socheong',
  '연평도': 'yeonpyeong',  '덕적도': 'deokjeok',    '자월도': 'jawol',
  '승봉도': 'seungbong',   '대이작도': 'daeijak',   '소이작도': 'soijak',
  '영흥도': 'yeonghung',   '풍도': 'pungdo',        '굴업도': 'guleop',
  '육도': 'yukdo',         '선재도': 'seonjae',
  '신도': 'sindo',         '시도': 'sido',          '모도': 'modo',
  '장봉도': 'jangbongdo',  '소야도': 'soya',        '문갑도': 'mungap',
  '백아도': 'baegado',     '울도': 'uldo',
};

// ─── 실제 관광지/맛집/숙박 컨텍스트 (Supabase DB, LLM 환각 방지) ───────────────
// generate-itinerary/index.ts의 fetchIslandTourContext와 동일 로직

async function fetchIslandTourContext(islandName: string): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) return "";

  const islandId = ISLAND_NAME_TO_ID[islandName];
  if (!islandId) return "";

  const headers = { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` };
  const fetchTable = async (table: string, select: string, orderBy: string) => {
    const url = `${supabaseUrl}/rest/v1/${table}?island_id=eq.${islandId}&select=${select}&order=${orderBy}&limit=8`;
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  };

  const [attractions, restaurants, accommodations] = await Promise.all([
    fetchTable("attractions", "name,category,description", "order_index.asc"),
    fetchTable("restaurants", "name,cuisine,specialty", "order_index.asc"),
    fetchTable("accommodations", "name,type", "order_index.asc"),
  ]);

  if (attractions.length === 0 && restaurants.length === 0 && accommodations.length === 0) return "";

  const lines: string[] = [];
  if (attractions.length > 0) {
    lines.push(`관광지: ${attractions.map((a: any) => `${a.name}${a.category ? `(${a.category})` : ""}`).join(", ")}`);
  }
  if (restaurants.length > 0) {
    lines.push(`맛집: ${restaurants.map((r: any) => `${r.name}${r.specialty ? `(${r.specialty})` : r.cuisine ? `(${r.cuisine})` : ""}`).join(", ")}`);
  }
  if (accommodations.length > 0) {
    lines.push(`숙박: ${accommodations.map((a: any) => `${a.name}${a.type ? `(${a.type})` : ""}`).join(", ")}`);
  }

  return `\n[${islandName} 실제 관광지/맛집/숙박 정보 — 질문에 관련 있으면 이 안의 실제 이름을 활용하세요. 목록에 없는 구체적 상호명은 지어내지 마세요.]\n${lines.join("\n")}`;
}

function detectIslandInText(text: string): string | null {
  for (const name of Object.keys(ISLAND_NAME_TO_ID)) {
    if (text.includes(name)) return name;
  }
  return null;
}

// ─── FAQ 지식 (Support.tsx FAQS와 동일 내용, 서버 쪽 단일 사본) ────────────────

const FAQ_KNOWLEDGE = `
- 예약 취소: '내 여행' > '일정 관리'에서 취소 가능. 취소 수수료는 출발일 기준 3일 전까지 무료, 1-2일 전 30%, 당일 50%.
- 예약 확인: '내 여행' 탭에서 확정된 일정 확인 가능, 예약 완료 시 알림 전송됨.
- 여객선 운항 취소: 기상 악화로 운항 취소되면 앱 알림으로 안내, 전액 환불 또는 일정 변경 가능.
- 실시간 운항 정보: 홈 화면 날씨 위젯 또는 '교통 시간표' 페이지에서 확인 가능.
- 결제 수단: 신용카드, 체크카드, 계좌이체, 간편결제(카카오페이, 네이버페이) 지원.
- 그룹 여행: '그룹 여행' 페이지에서 새 그룹을 만들고 초대 코드를 공유하면 참여 가능.
- 고객센터 전화: 1588-0000, 평일 09:00-18:00 / 주말·공휴일 10:00-17:00 (점심 12:00-13:00 제외).
`;

// ─── 프롬프트 생성 ────────────────────────────────────────────────────────────

function buildPrompt(messages: ChatMessage[], tourContext: string): { system: string; user: string } {
  const system = `당신은 인천 옹진군 섬 여행 서비스 'sumtagi'의 상담 챗봇입니다.
다음 두 범위 안에서만 답변하세요:
1) 서비스 이용 방법(예약/취소/결제/그룹여행) — 아래 [FAQ 지식]을 근거로 답변
2) 인천 옹진군 22개 섬 여행 정보 — [실제 관광지/맛집/숙박 정보]가 주어지면 그 안의 실제 이름만 언급, 없으면 일반적인 조언만 하세요.
절대로 지어내지 말아야 할 것: 오늘의 실제 여객선 운항 여부, 현재 날씨, 컨텍스트에 없는 구체적 요금·전화번호·영업시간.
이런 실시간/미확인 정보를 물으면 "교통 시간표 페이지"나 "고객센터(1588-0000)"로 안내하고 직접 답하지 마세요.
서비스와 무관한 질문(일반 상식, 다른 지역 여행 등)은 정중히 범위를 벗어난다고 안내하고 거절하세요.
답변은 2~4문장 이내로 짧고 친근하게, 순수 텍스트로만 작성하세요(마크다운/코드블록 금지).

[FAQ 지식]
${FAQ_KNOWLEDGE}
${tourContext}`;

  // 최근 대화(클라이언트가 최대 6턴으로 캡해서 보냄)를 하나의 user 턴으로 직렬화
  const conversation = messages
    .map((m) => `${m.role === "user" ? "사용자" : "챗봇"}: ${m.text}`)
    .join("\n");

  const user = `다음은 지금까지의 대화입니다. 마지막 "사용자" 메시지에 챗봇으로서 답변하세요.\n\n${conversation}`;

  return { system, user };
}

// ─── Gemini 호출 ───────────────────────────────────────────────────────────────

async function callGemini(prompt: { system: string; user: string }): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다");

  // flash-lite: 대화형 짧은 응답이라 무거운 모델 불필요, 다른 두 함수와 동일 할당량 풀 공유
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: prompt.system }] },
      contents: [{ role: "user", parts: [{ text: prompt.user }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 512,
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
    const body: ChatRequest = await req.json();

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "INVALID_INPUT", message: "messages는 필수입니다" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const lastUserMessage = [...body.messages].reverse().find((m) => m.role === "user")?.text ?? "";
    const mentionedIsland = detectIslandInText(lastUserMessage);
    const tourContext = mentionedIsland ? await fetchIslandTourContext(mentionedIsland) : "";

    const prompt = buildPrompt(body.messages, tourContext);

    let reply: string;
    try {
      reply = await callGemini(prompt);
    } catch (firstErr) {
      console.error("[1차 시도 실패] 1초 후 재시도:", String(firstErr));
      await new Promise((r) => setTimeout(r, 1000));
      reply = await callGemini(prompt);
    }

    if (!reply.trim()) {
      return new Response(
        JSON.stringify({ error: "LLM_EMPTY_RESPONSE" }),
        { status: 422, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, reply: reply.trim() }),
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
