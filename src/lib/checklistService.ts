import { supabase } from './supabase'

const uid = async () => (await supabase.auth.getUser()).data.user?.id

const DEFAULTS = [
  { text: '선크림', category: '필수품' },
  { text: '멀미약', category: '필수품' },
  { text: '모자', category: '필수품' },
  { text: '선글라스', category: '필수품' },
  { text: '우산 또는 우비', category: '필수품' },
  { text: '간편한 신발', category: '필수품' },
  { text: '수건', category: '필수품' },
  { text: '세면도구', category: '필수품' },
  { text: '보조배터리', category: '전자기기' },
  { text: '충전기', category: '전자기기' },
  { text: '여객선 예매 확인', category: '예약 확인' },
  { text: '숙소 예약 확인', category: '예약 확인' },
]

export const checklistService = {
  getItems: async () => {
    const id = await uid()
    if (!id) return []
    const { data, error } = await supabase.from('checklist_items').select().eq('user_id', id).order('created_at')
    if (error) console.error('getItems error:', error)
    if (data && data.length > 0) return data
    // 비어있으면 기본 항목 seed
    const { error: seedError } = await supabase.from('checklist_items').insert(
      DEFAULTS.map(d => ({ user_id: id, text: d.text, category: d.category, is_checked: false }))
    )
    if (seedError) console.error('seed checklist error:', seedError)
    const { data: seeded, error: reloadError } = await supabase.from('checklist_items').select().eq('user_id', id).order('created_at')
    if (reloadError) console.error('reload checklist error:', reloadError)
    return seeded ?? []
  },

  toggle: async (itemId: string, current: boolean) => {
    const { error } = await supabase.from('checklist_items').update({ is_checked: !current }).eq('id', itemId)
    if (error) console.error('toggle checklist item error:', error)
  },

  addItem: async (text: string, category: string) => {
    const id = await uid()
    if (!id) return
    const { error } = await supabase.from('checklist_items').insert({ user_id: id, text, category, is_checked: false })
    if (error) console.error('addItem error:', error)
  },

  deleteItem: async (itemId: string) => {
    const { error } = await supabase.from('checklist_items').delete().eq('id', itemId)
    if (error) console.error('deleteItem error:', error)
  },

  reset: async () => {
    const id = await uid()
    if (!id) return
    const { error: deleteError } = await supabase.from('checklist_items').delete().eq('user_id', id)
    if (deleteError) console.error('reset delete error:', deleteError)
    const { error: insertError } = await supabase.from('checklist_items').insert(
      DEFAULTS.map(d => ({ user_id: id, text: d.text, category: d.category, is_checked: false }))
    )
    if (insertError) console.error('reset insert error:', insertError)
  },
}
