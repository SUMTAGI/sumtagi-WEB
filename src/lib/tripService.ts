import { supabase } from './supabase'

const uid = async () => (await supabase.auth.getUser()).data.user?.id

export const tripService = {
  createTrip: async (title: string, startDate: string, endDate: string, islands: string[], plan?: object) => {
    const id = await uid()
    if (!id) return null
    const { data, error } = await supabase.from('trips').insert({
      user_id: id, title, start_date: startDate, end_date: endDate,
      islands, confirmed: false,
    }).select().single()
    if (error) {
      console.error('createTrip error:', error)
      return null
    }
    if (plan && data) {
      await supabase.from('trips').update({ plan }).eq('id', data.id)
    }
    return data
  },

  updateTripPlan: async (tripId: string, plan: object) => {
    await supabase.from('trips').update({ plan }).eq('id', tripId)
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

  getUpcomingTrip: async () => {
    const id = await uid()
    if (!id) return null
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const { data } = await supabase
      .from('trips').select()
      .eq('user_id', id)
      .gte('start_date', today)
      .order('start_date', { ascending: true }).limit(1).maybeSingle()
    return data
  },

  getTripById: async (tripId: string) => {
    const { data } = await supabase.from('trips').select().eq('id', tripId).maybeSingle()
    return data
  },

  getVisitedTrips: async () => {
    const id = await uid()
    if (!id) return []
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
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

  getTripCount: async () => {
    const id = await uid()
    if (!id) return 0
    const { count } = await supabase.from('trips').select('*', { count: 'exact', head: true }).eq('user_id', id)
    return count ?? 0
  },

  getChecklistProgress: async (tripId?: string | null) => {
    const id = await uid()
    if (!id) return 0
    let query = supabase.from('checklist_items').select('is_checked').eq('user_id', id)
    query = tripId ? query.eq('trip_id', tripId) : query.is('trip_id', null)
    const { data } = await query
    if (!data || data.length === 0) return 0
    const done = data.filter(i => i.is_checked).length
    return Math.round((done / data.length) * 100)
  },
}
