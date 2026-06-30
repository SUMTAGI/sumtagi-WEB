import { supabase } from './supabase'

const getAuthorName = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.user_metadata?.nickname ?? user?.email?.split('@')[0] ?? '여행자'
}

export const communityService = {
  getPosts: async (type = 'feed', islandFilter?: string) => {
    let query = supabase
      .from('community_posts').select()
      .eq('post_type', type)
      .order('created_at', { ascending: false }).limit(50)
    if (islandFilter) query = query.eq('island_name', islandFilter)
    const { data } = await query
    return data ?? []
  },

  createPost: async (params: {
    title: string
    content: string
    islandName?: string
    type?: string
    imageUrl?: string
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('community_posts').insert({
      user_id: user.id,
      title: params.title,
      content: params.content,
      island_name: params.islandName || null,
      post_type: params.type ?? 'feed',
      author_name: await getAuthorName(),
      image_url: params.imageUrl || null,
    })
  },

  uploadImage: async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('community-images').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('community-images').getPublicUrl(path)
    return data.publicUrl
  },

  updateLikes: async (postId: string, count: number) => {
    const { error } = await supabase
      .from('community_posts')
      .update({ likes_count: count })
      .eq('id', postId)
    if (error) throw error
  },

  getComments: async (postId: string) => {
    const { data } = await supabase
      .from('community_comments').select()
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    return data ?? []
  },

  deletePost: async (postId: string) => {
    await supabase.from('community_posts').delete().eq('id', postId)
  },

  createComment: async (postId: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('로그인이 필요합니다')
    const { error: insertError } = await supabase.from('community_comments').insert({
      post_id: postId,
      user_id: user.id,
      author_name: await getAuthorName(),
      content,
    })
    if (insertError) throw insertError
    const { data: post } = await supabase
      .from('community_posts').select('comments_count').eq('id', postId).single()
    const { error: updateError } = await supabase.from('community_posts')
      .update({ comments_count: ((post?.comments_count as number) ?? 0) + 1 })
      .eq('id', postId)
    if (updateError) throw updateError
  },
}
