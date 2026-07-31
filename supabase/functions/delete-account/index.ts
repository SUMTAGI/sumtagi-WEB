// Supabase Edge Function: delete-account
// 요청자 본인의 계정만 삭제할 수 있도록, 토큰으로 조회한 유저 id로만 삭제한다.
// (body로 user id를 받아 지우면 타인 계정도 지울 수 있게 되므로 절대 그렇게 하지 않는다.)

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token) {
    return new Response(JSON.stringify({ error: "UNAUTHORIZED", message: "로그인이 필요합니다" }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    // 토큰으로 실제 로그인된 유저를 확인 (요청자 본인 확인)
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    });

    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: "UNAUTHORIZED", message: "유효하지 않은 로그인 정보입니다" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const user = await userRes.json();

    const deleteRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
      method: "DELETE",
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });

    if (!deleteRes.ok) {
      const err = await deleteRes.text();
      console.error("[계정 삭제 실패]", deleteRes.status, err);
      return new Response(JSON.stringify({ error: "DELETE_FAILED", message: err }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    console.log(`[계정 삭제 완료] user_id: ${user.id}`);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[치명적 오류] delete-account:", String(err));
    return new Response(JSON.stringify({ error: "INTERNAL_ERROR", message: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
