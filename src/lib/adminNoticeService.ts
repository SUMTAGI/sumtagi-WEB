import { supabase } from './supabase'
import { logAdminAction } from './adminAuditLogService'

export interface ServiceResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

export type NoticeStatus = 'draft' | 'published' | 'archived'

export interface Notice {
  id: string
  title: string
  content: string
  status: NoticeStatus
  pinned: boolean
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface NoticeInput {
  title: string
  content: string
  status: NoticeStatus
  pinned: boolean
}

export function validateNoticeInput(input: NoticeInput): string | null {
  if (!input.title.trim()) return '제목을 입력해주세요'
  if (input.title.trim().length > 100) return '제목은 100자 이하로 입력해주세요'
  if (!input.content.trim()) return '내용을 입력해주세요'
  return null
}

export const adminNoticeService = {
  getAllNotices: async (): Promise<ServiceResult<Notice[]>> => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getAllNotices error:', error)
      return { success: false, error: error.message }
    }
    return { success: true, data: data ?? [] }
  },

  createNotice: async (input: NoticeInput): Promise<ServiceResult<Notice>> => {
    const inputError = validateNoticeInput(input)
    if (inputError) return { success: false, error: inputError }

    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('notices')
      .insert({
        title: input.title.trim(),
        content: input.content.trim(),
        status: input.status,
        pinned: input.pinned,
        published_at: input.status === 'published' ? new Date().toISOString() : null,
        created_by: user?.id ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('createNotice error:', error)
      return { success: false, error: error.message }
    }
    await logAdminAction({
      action: 'notice_create', targetTable: 'notices', targetId: data.id,
      summary: `공지 작성: ${data.title}`,
    })
    return { success: true, data }
  },

  updateNotice: async (id: string, input: NoticeInput): Promise<ServiceResult<Notice>> => {
    const inputError = validateNoticeInput(input)
    if (inputError) return { success: false, error: inputError }

    const { data, error } = await supabase
      .from('notices')
      .update({
        title: input.title.trim(),
        content: input.content.trim(),
        status: input.status,
        pinned: input.pinned,
        published_at: input.status === 'published' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('updateNotice error:', error)
      return { success: false, error: error.message }
    }
    await logAdminAction({
      action: 'notice_update', targetTable: 'notices', targetId: id,
      summary: `공지 수정: ${data.title}`,
    })
    return { success: true, data }
  },

  // 게시/보관 상태만 바꾸는 짧은 경로 — 목록에서 바로 토글할 때 쓴다.
  setNoticeStatus: async (id: string, status: NoticeStatus, title: string): Promise<ServiceResult> => {
    const { error } = await supabase
      .from('notices')
      .update({ status, published_at: status === 'published' ? new Date().toISOString() : null })
      .eq('id', id)
    if (error) {
      console.error('setNoticeStatus error:', error)
      return { success: false, error: error.message }
    }
    const label = status === 'published' ? '게시' : status === 'archived' ? '보관' : '비공개';
    await logAdminAction({
      action: 'notice_status_change', targetTable: 'notices', targetId: id,
      summary: `공지 ${label} 처리: ${title}`, metadata: { status },
    })
    return { success: true }
  },

  setNoticePinned: async (id: string, pinned: boolean, title: string): Promise<ServiceResult> => {
    const { error } = await supabase.from('notices').update({ pinned }).eq('id', id)
    if (error) {
      console.error('setNoticePinned error:', error)
      return { success: false, error: error.message }
    }
    await logAdminAction({
      action: 'notice_pin_change', targetTable: 'notices', targetId: id,
      summary: `공지 고정 ${pinned ? '설정' : '해제'}: ${title}`, metadata: { pinned },
    })
    return { success: true }
  },
}
