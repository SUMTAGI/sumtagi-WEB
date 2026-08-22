import { supabase } from './supabase'
import { logAdminAction } from './adminAuditLogService'

export interface ServiceResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export interface AdminCommunityPost {
  id: string
  title: string
  content: string
  author_name: string
  island_name: string | null
  post_type: string
  hidden_at: string | null
  created_at: string
}

export const adminCommunityService = {
  // 공개 여부와 무관하게 전부 가져온다(숨김 게시글 포함) — 관리자 전용
  // community_posts_select_admin 정책이 이걸 보장한다.
  getAllPosts: async (): Promise<ServiceResult<AdminCommunityPost[]>> => {
    const { data, error } = await supabase
      .from('community_posts')
      .select('id, title, content, author_name, island_name, post_type, hidden_at, created_at')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('getAllPosts error:', error)
      return { success: false, error: error.message }
    }
    return { success: true, data: data ?? [] }
  },

  // island.ts의 getPopularIslands와 같은 방식: 신고 테이블 전체를 가져와
  // post_id별로 집계한다(신고 건수 자체가 많지 않을 것으로 보이는 초기
  // 서비스 특성상 별도 집계 뷰 없이 클라이언트 tally로 충분하다).
  getReportCounts: async (): Promise<Record<string, number>> => {
    const { data, error } = await supabase.from('community_reports').select('post_id')
    if (error) {
      console.error('getReportCounts error:', error)
      return {}
    }
    const counts: Record<string, number> = {}
    for (const row of data ?? []) {
      if (!row.post_id) continue
      counts[row.post_id] = (counts[row.post_id] ?? 0) + 1
    }
    return counts
  },

  hidePost: async (id: string, title: string): Promise<ServiceResult> => {
    const { error } = await supabase.from('community_posts').update({ hidden_at: new Date().toISOString() }).eq('id', id)
    if (error) {
      console.error('hidePost error:', error)
      return { success: false, error: error.message }
    }
    await logAdminAction({
      action: 'post_hide', targetTable: 'community_posts', targetId: id,
      summary: `게시글 숨김: ${title}`,
    })
    return { success: true }
  },

  unhidePost: async (id: string, title: string): Promise<ServiceResult> => {
    const { error } = await supabase.from('community_posts').update({ hidden_at: null }).eq('id', id)
    if (error) {
      console.error('unhidePost error:', error)
      return { success: false, error: error.message }
    }
    await logAdminAction({
      action: 'post_unhide', targetTable: 'community_posts', targetId: id,
      summary: `게시글 숨김 해제: ${title}`,
    })
    return { success: true }
  },

  deletePost: async (id: string, title: string): Promise<ServiceResult> => {
    const { error } = await supabase.from('community_posts').delete().eq('id', id)
    if (error) {
      console.error('deletePost error:', error)
      return { success: false, error: error.message }
    }
    await logAdminAction({
      action: 'post_delete', targetTable: 'community_posts', targetId: id,
      summary: `게시글 삭제: ${title}`,
    })
    return { success: true }
  },
}
