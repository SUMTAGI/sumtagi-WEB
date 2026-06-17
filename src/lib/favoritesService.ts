import { supabase } from './supabase'

const uid = async () => (await supabase.auth.getUser()).data.user?.id

export const favoritesService = {
  getFavorites: async () => {
    const id = await uid()
    if (!id) return []
    const { data } = await supabase
      .from('favorites')
      .select('*, islands(*)')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
    return data ?? []
  },

  isFavorite: async (islandId: string) => {
    const id = await uid()
    if (!id) return false
    const { data } = await supabase
      .from('favorites').select('id')
      .eq('user_id', id).eq('island_id', islandId).maybeSingle()
    return !!data
  },

  addFavorite: async (islandId: string) => {
    const id = await uid()
    if (!id) return
    await supabase.from('favorites').insert({ user_id: id, island_id: islandId })
  },

  removeFavorite: async (islandId: string) => {
    const id = await uid()
    if (!id) return
    await supabase.from('favorites').delete().eq('user_id', id).eq('island_id', islandId)
  },
}
