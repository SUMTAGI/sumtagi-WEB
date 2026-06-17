import { supabase } from './supabase'

const uid = async () => (await supabase.auth.getUser()).data.user?.id

export const diaryService = {
  getEntries: async () => {
    const id = await uid()
    if (!id) return []
    const { data } = await supabase
      .from('diary_entries').select()
      .eq('user_id', id).order('date', { ascending: false })
    return data ?? []
  },

  addEntry: async (date: string, island: string, title: string, content: string) => {
    const id = await uid()
    if (!id) return null
    const { data } = await supabase.from('diary_entries').insert({
      user_id: id, date, island, title, content,
    }).select().single()
    return data
  },

  updateEntry: async (entryId: string, date: string, island: string, title: string, content: string) => {
    await supabase.from('diary_entries').update({ date, island, title, content }).eq('id', entryId)
  },

  deleteEntry: async (entryId: string) => {
    await supabase.from('diary_entries').delete().eq('id', entryId)
  },
}
