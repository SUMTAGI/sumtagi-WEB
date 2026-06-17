import { supabase } from './supabase'

const uid = async () => (await supabase.auth.getUser()).data.user?.id

export const tripService = {
  createTrip: async (title: string, startDate: string, endDate: string, islands: string[]) => {
    const id = await uid()
    if (!id) return null
    const { data } = await supabase.from('trips').insert({
      user_id: id, title, start_date: startDate, end_date: endDate,
      islands, confirmed: false,
    }).select().single()
    return data
  },

  confirmTrip: async (tripId: string) => {
    await supabase.from('trips').update({ confirmed: true }).eq('id', tripId)
  },


  getLatestConfirmedTrip: async () => {
    const id = await uid()
    if (!id) return null
    const { data } = await supabase
      .from('trips').select()
      .eq('user_id', id).eq('confirmed', true)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    return data
  },

  getVisitedTrips: async () => {
    const id = await uid()
    if (!id) return []
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('trips').select()
      .eq('user_id', id).eq('confirmed', true)
      .lt('end_date', today)
      .order('end_date', { ascending: false })
    return data ?? []
  },

  deleteTrip: async (id: string) => {
    await supabase.from('trips').delete().eq('id', id)
  },

  getChecklistProgress: async () => {
    const id = await uid()
    if (!id) return 0
    const { data } = await supabase.from('checklist_items').select('is_checked').eq('user_id', id)
    if (!data || data.length === 0) return 0
    const done = data.filter(i => i.is_checked).length
    return Math.round((done / data.length) * 100)
  },
}
