import { supabase } from './supabase'

const uid = async () => (await supabase.auth.getUser()).data.user?.id

const DEFAULTS = [
  { title: '선크림', category: '필수품' },
  { title: '멀미약', category: '필수품' },
  { title: '모자', category: '필수품' },
  { title: '선글라스', category: '필수품' },
  { title: '우산 또는 우비', category: '필수품' },
  { title: '간편한 신발', category: '필수품' },
  { title: '수건', category: '필수품' },
  { title: '세면도구', category: '필수품' },
  { title: '보조배터리', category: '전자기기' },
  { title: '충전기', category: '전자기기' },
  { title: '여객선 예매 확인', category: '예약 확인' },
  { title: '숙소 예약 확인', category: '예약 확인' },
]

export const checklistService = {
  getItems: async (tripId?: string | null) => {
    const id = await uid()
    if (!id) return []
    let query = supabase.from('checklist_items').select().eq('user_id', id)
    query = tripId ? query.eq('trip_id', tripId) : query.is('trip_id', null)
    const { data, error } = await query.order('created_at')
    if (error) console.error('getItems error:', error)
    if (data && data.length > 0) return data
    // 비어있으면 기본 항목 seed
    const { error: seedError } = await supabase.from('checklist_items').insert(
      DEFAULTS.map(d => ({ user_id: id, trip_id: tripId ?? null, title: d.title, category: d.category, is_checked: false }))
    )
    if (seedError) console.error('seed checklist error:', seedError)
    let reloadQuery = supabase.from('checklist_items').select().eq('user_id', id)
    reloadQuery = tripId ? reloadQuery.eq('trip_id', tripId) : reloadQuery.is('trip_id', null)
    const { data: seeded, error: reloadError } = await reloadQuery.order('created_at')
    if (reloadError) console.error('reload checklist error:', reloadError)
    return seeded ?? []
  },

  toggle: async (itemId: string, current: boolean) => {
    const { error } = await supabase.from('checklist_items').update({ is_checked: !current }).eq('id', itemId)
    if (error) console.error('toggle checklist item error:', error)
  },

  addItem: async (title: string, category: string, tripId?: string | null) => {
    const id = await uid()
    if (!id) return
    const { error } = await supabase.from('checklist_items').insert({ user_id: id, trip_id: tripId ?? null, title, category, is_checked: false })
    if (error) console.error('addItem error:', error)
  },

  deleteItem: async (itemId: string) => {
    const { error } = await supabase.from('checklist_items').delete().eq('id', itemId)
    if (error) console.error('deleteItem error:', error)
  },

  reset: async (tripId?: string | null) => {
    const id = await uid()
    if (!id) return
    let deleteQuery = supabase.from('checklist_items').delete().eq('user_id', id)
    deleteQuery = tripId ? deleteQuery.eq('trip_id', tripId) : deleteQuery.is('trip_id', null)
    const { error: deleteError } = await deleteQuery
    if (deleteError) console.error('reset delete error:', deleteError)
    const { error: insertError } = await supabase.from('checklist_items').insert(
      DEFAULTS.map(d => ({ user_id: id, trip_id: tripId ?? null, title: d.title, category: d.category, is_checked: false }))
    )
    if (insertError) console.error('reset insert error:', insertError)
  },
}
