import { supabase } from './supabase'

const uid = async () => (await supabase.auth.getUser()).data.user?.id

export const favoritesService = {
  getFavorites: async () => {
    const id = await uid()
    if (!id) return []
    const { data, error } = await supabase
      .from('favorites')
      .select('*, islands(*)')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
    if (error) console.error('getFavorites error:', error)
    return data ?? []
  },

  isFavorite: async (islandId: string) => {
    const id = await uid()
    if (!id) return false
    const { data, error } = await supabase
      .from('favorites').select('id')
      .eq('user_id', id).eq('island_id', islandId).maybeSingle()
    if (error) console.error('isFavorite error:', error)
    return !!data
  },

  addFavorite: async (islandId: string) => {
    const id = await uid()
    if (!id) return
    const { error } = await supabase.from('favorites').insert({ user_id: id, island_id: islandId })
    if (error) console.error('addFavorite error:', error)
  },

  removeFavorite: async (islandId: string) => {
    const id = await uid()
    if (!id) return
    const { error } = await supabase.from('favorites').delete().eq('user_id', id).eq('island_id', islandId)
    if (error) console.error('removeFavorite error:', error)
  },
}
