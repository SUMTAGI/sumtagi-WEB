import { supabase } from './supabase'

export interface ServiceResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface AdminAuditLog {
  id: string
  admin_user_id: string | null
  action: string
  target_table: string | null
  target_id: string | null
  summary: string
  metadata: Record<string, unknown>
  created_at: string
  profiles: { nickname: string | null } | null
}

// 섬/공지/커뮤니티처럼 상태 전이 자체는 이미 RLS로 보호되는 단순 CRUD에
// 붙여 쓰는 범용 로그 기록 함수. 실패해도 본 작업(섬 수정 등)은 이미
// 끝난 뒤이므로 예외를 던지지 않고 콘솔에만 남긴다 — 로그 기록 실패가
// 실제 관리 작업을 롤백시키면 안 되기 때문(로그는 감사 목적의 부가 정보).
export async function logAdminAction(params: {
  action: string
  targetTable?: string
  targetId?: string
  summary: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabase.rpc('log_admin_action', {
    p_action: params.action,
    p_target_table: params.targetTable ?? null,
    p_target_id: params.targetId ?? null,
    p_summary: params.summary,
    p_metadata: params.metadata ?? {},
  })
  if (error) console.error('logAdminAction error:', error)
}

export const adminAuditLogService = {
  getLogs: async (limit = 200): Promise<ServiceResult<AdminAuditLog[]>> => {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*, profiles(nickname)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('getLogs error:', error)
      return { success: false, error: error.message }
    }
    return { success: true, data: (data ?? []) as unknown as AdminAuditLog[] }
  },
}
