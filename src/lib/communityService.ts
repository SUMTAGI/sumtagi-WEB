import { supabase } from './supabase'

const getAuthorName = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.user_metadata?.nickname ?? user?.email?.split('@')[0] ?? '여행자'
}

const PAGE_SIZE = 20

export const communityService = {
  getPosts: async (type = 'feed', options?: {
    islandFilter?: string
    search?: string
    sortBy?: 'recent' | 'likes'
    page?: number
    pageSize?: number
  }) => {
    const pageSize = options?.pageSize ?? PAGE_SIZE
    const page = options?.page ?? 0
    const from = page * pageSize
    const to = from + pageSize - 1
    let query = supabase
      .from('community_posts').select()
      .eq('post_type', type)
    if (options?.islandFilter) query = query.eq('island_name', options.islandFilter)
    if (options?.search?.trim()) {
      const s = options.search.trim()
      query = query.or(`title.ilike.%${s}%,content.ilike.%${s}%`)
    }
    const orderCol = options?.sortBy === 'likes' ? 'likes_count' : 'created_at'
    const { data } = await query.order(orderCol, { ascending: false }).range(from, to)
    return data ?? []
  },

  getPost: async (id: string) => {
    const { data } = await supabase.from('community_posts').select().eq('id', id).single()
    return data
  },

  getMyLikedPostIds: async (postIds: string[]): Promise<Set<string>> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || postIds.length === 0) return new Set()
    const { data } = await supabase
      .from('community_post_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)
    return new Set((data ?? []).map((r: { post_id: string }) => r.post_id))
  },

  createPost: async (params: {
    title: string
    content: string
    islandName?: string
    type?: string
    images?: string[]
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
      images: params.images ?? [],
    })
  },

  updatePost: async (params: {
    id: string
    title: string
    content: string
    islandName?: string
    images?: string[]
  }) => {
    const { error } = await supabase.from('community_posts').update({
      title: params.title,
      content: params.content,
      island_name: params.islandName || null,
      images: params.images ?? [],
      updated_at: new Date().toISOString(),
    }).eq('id', params.id)
    if (error) throw error
  },

  uploadImage: async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('community-images').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('community-images').getPublicUrl(path)
    return data.publicUrl
  },

  uploadImages: async (files: File[]): Promise<string[]> => {
    const urls: string[] = []
    for (const file of files) {
      urls.push(await communityService.uploadImage(file))
    }
    return urls
  },

  // liked 여부는 DB 트리거가 likes_count를 자동 갱신하므로 클라이언트는 좋아요 행만 관리한다.
  toggleLike: async (postId: string, currentlyLiked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return currentlyLiked
    if (currentlyLiked) {
      const { error } = await supabase
        .from('community_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)
      if (error) throw error
      return false
    }
    const { error } = await supabase
      .from('community_post_likes')
      .upsert({ post_id: postId, user_id: user.id }, { onConflict: 'post_id,user_id' })
    if (error) throw error
    return true
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

  createComment: async (postId: string, content: string, parentId?: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('로그인이 필요합니다')
    const { error } = await supabase.from('community_comments').insert({
      post_id: postId,
      user_id: user.id,
      author_name: await getAuthorName(),
      content,
      parent_id: parentId ?? null,
    })
    if (error) throw error
  },

  updateComment: async (commentId: string, content: string) => {
    const { error } = await supabase.from('community_comments').update({
      content,
      updated_at: new Date().toISOString(),
    }).eq('id', commentId)
    if (error) throw error
  },

  deleteComment: async (commentId: string) => {
    const { error } = await supabase.from('community_comments').delete().eq('id', commentId)
    if (error) throw error
  },

  reportPost: async (postId: string, reason: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('community_reports').insert({
      post_id: postId,
      reporter_id: user.id,
      reason,
    })
    if (error) throw error
  },

  reportComment: async (commentId: string, reason: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('community_reports').insert({
      comment_id: commentId,
      reporter_id: user.id,
      reason,
    })
    if (error) throw error
  },
}
