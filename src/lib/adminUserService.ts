import { supabase } from './supabase'
import type { UserRole, HostStatus } from './hostService'

export interface ServiceResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface AdminUserRow {
  id: string
  email: string | null
  nickname: string | null
  role: UserRole
  created_at: string
  updated_at: string
  host_status: HostStatus | null
}

export const adminUserService = {
  // profiles만으로는 이메일을 알 수 없어(이메일은 auth.users 소유) admin_list_users
  // RPC를 통해 조회한다. RPC 내부에서 admin 여부를 다시 검증하므로, 일반
  // 사용자가 anon/authenticated 키로 직접 호출해도 실패한다.
  getAllUsers: async (): Promise<ServiceResult<AdminUserRow[]>> => {
    const { data, error } = await supabase.rpc('admin_list_users')
    if (error) {
      console.error('getAllUsers error:', error)
      return { success: false, error: error.message }
    }
    return { success: true, data: (data ?? []) as AdminUserRow[] }
  },

  // role 변경 + 로그 기록을 한 트랜잭션으로 처리하는 RPC를 호출한다.
  // 자기 자신의 admin 권한을 admin이 아닌 값으로 바꾸려는 시도는 RPC
  // 내부에서 거부된다(서버가 최종 방어선).
  updateUserRole: async (targetId: string, newRole: UserRole): Promise<ServiceResult> => {
    const { error } = await supabase.rpc('admin_update_user_role', {
      p_target_id: targetId,
      p_new_role: newRole,
    })
    if (error) {
      console.error('updateUserRole error:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  },
}
