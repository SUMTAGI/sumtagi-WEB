import { supabase } from './supabase'

const uid = async () => (await supabase.auth.getUser()).data.user?.id

export const notificationService = {
  getAll: async () => {
    const id = await uid()
    if (!id) return []
    const { data } = await supabase
      .from('notifications').select()
      .eq('user_id', id)
      .order('created_at', { ascending: false })
    return data ?? []
  },

  markRead: async (notifId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId)
  },

  markAllRead: async () => {
    const id = await uid()
    if (!id) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', id)
  },

  delete: async (notifId: string) => {
    await supabase.from('notifications').delete().eq('id', notifId)
  },
}
