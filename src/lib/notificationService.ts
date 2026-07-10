import { supabase } from './supabase'

const uid = async () => (await supabase.auth.getUser()).data.user?.id

export const notificationService = {
  add: async (title: string, message: string, type: string = 'general') => {
    const id = await uid()
    if (!id) return
    const { error } = await supabase.from('notifications').insert({ user_id: id, title, message, type })
    if (error) console.error('add notification error:', error)
  },

  getAll: async () => {
    const id = await uid()
    if (!id) return []
    const { data, error } = await supabase
      .from('notifications').select()
      .eq('user_id', id)
      .order('created_at', { ascending: false })
    if (error) console.error('getAll notifications error:', error)
    return data ?? []
  },

  markRead: async (notifId: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notifId)
    if (error) console.error('markRead error:', error)
  },

  markAllRead: async () => {
    const id = await uid()
    if (!id) return
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', id)
    if (error) console.error('markAllRead error:', error)
  },

  delete: async (notifId: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', notifId)
    if (error) console.error('delete notification error:', error)
  },
}
