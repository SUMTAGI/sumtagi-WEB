import { supabase } from './supabase'
import type { HostApplication, HostStatus } from './hostService'

export interface HostApplicationWithProfile extends HostApplication {
  profiles: { nickname: string | null } | null
}

export interface ServiceResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// 관리자 전용 — 승인/반려는 절대 테이블을 직접 UPDATE하지 않고 항상
// approve_host_application / reject_host_application RPC만 호출한다.
// 두 함수 모두 내부에서 auth.uid() 기준으로 profiles.role='admin'인지
// 재검증하므로(마이그레이션 참고), admin 여부의 최종 보안선은 DB에 있다 —
// 클라이언트는 admin의 uuid를 별도로 넘기지 않는다.
export const adminHostService = {
  getHostApplications: async (status?: HostStatus): Promise<ServiceResult<HostApplicationWithProfile[]>> => {
    let query = supabase
      .from('hosts')
      .select('*, profiles(nickname)')
      .order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) {
      console.error('getHostApplications error:', error)
      return { success: false, error: error.message }
    }
    return { success: true, data: (data ?? []) as unknown as HostApplicationWithProfile[] }
  },

  approveHostApplication: async (hostId: string): Promise<ServiceResult> => {
    const { error } = await supabase.rpc('approve_host_application', { p_host_id: hostId })
    if (error) {
      console.error('approveHostApplication error:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  },

  rejectHostApplication: async (hostId: string, reason: string): Promise<ServiceResult> => {
    const { error } = await supabase.rpc('reject_host_application', { p_host_id: hostId, p_reason: reason })
    if (error) {
      console.error('rejectHostApplication error:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  },
}
