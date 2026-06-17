import { supabase } from './supabase'

const authorName = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.user_metadata?.nickname ?? user?.email?.split('@')[0] ?? '여행자'
}

export const communityService = {
  getPosts: async (type = 'feed') => {
    const { data } = await supabase
      .from('community_posts').select()
      .eq('post_type', type)
      .order('created_at', { ascending: false }).limit(50)
    return data ?? []
  },

  createPost: async (content: string, islandName?: string, type = 'feed') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('community_posts').insert({
      user_id: user.id,
      title: content.length > 30 ? content.substring(0, 30) + '...' : content,
      content,
      island_name: islandName || null,
      post_type: type,
      author_name: await authorName(),
    })
  },

  updateLikes: async (postId: string, count: number) => {
    await supabase.from('community_posts').update({ likes_count: count }).eq('id', postId)
  },
}
