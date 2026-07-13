// 고객센터 AI 상담 챗봇 서비스 레이어
// 프론트는 이 파일만 사용합니다. API Key는 절대 여기 없습니다.

import { supabase } from "../supabase";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

// 대화가 길어질수록 토큰 사용량이 늘어나므로 최근 6턴만 전송
const MAX_HISTORY_TURNS = 6;

export async function askIslandChat(history: ChatMessage[]): Promise<string> {
  const messages = history.slice(-MAX_HISTORY_TURNS);

  const { data, error } = await supabase.functions.invoke("island-chat", {
    body: { messages },
  });

  if (error) throw new Error(`상담 요청 오류: ${error.message}`);
  if (!data?.ok || !data?.reply) throw new Error(`상담 실패 [${data?.error ?? "UNKNOWN"}]`);

  return data.reply as string;
}
