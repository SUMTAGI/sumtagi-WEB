import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { ChevronLeft, Heart, Share2, MapPin, Send, MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { communityService } from "../../lib/communityService";
import { supabase } from "../../lib/supabase";

const ISLANDS = ['강화도', '영흥도', '자월도', '덕적도', '백령도', '대청도', '연평도'];

export function Community() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"feed" | "qna">("feed");
  const [posts, setPosts] = useState<any[]>([]);
  const [qna, setQna] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [islandFilter, setIslandFilter] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const [feedData, qnaData] = await Promise.all([
        communityService.getPosts('feed', islandFilter ?? undefined),
        communityService.getPosts('qna', islandFilter ?? undefined),
      ]);
      setPosts(feedData);
      setQna(qnaData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [islandFilter]);

  const toggleLike = async (post: any) => {
    const id = post.id as string;
    const liked = likedIds.has(id);
    const next = liked ? (post.likes_count ?? 0) - 1 : (post.likes_count ?? 0) + 1;
    setLikedIds(prev => { const s = new Set(prev); liked ? s.delete(id) : s.add(id); return s; });
    const updater = (arr: any[]) => arr.map(p => p.id === id ? { ...p, likes_count: next } : p);
    setPosts(updater);
    setQna(updater);
    await communityService.updateLikes(id, next);
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('게시글을 삭제할까요?')) return;
    await communityService.deletePost(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    setQna(prev => prev.filter(p => p.id !== postId));
    toast.success('삭제됐어요');
  };

  const toggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    setExpandedPostId(postId);
    if (!comments[postId]) {
      const data = await communityService.getComments(postId);
      setComments(prev => ({ ...prev, [postId]: data }));
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = (commentTexts[postId] ?? '').trim();
    if (!text) return;
    setCommentTexts(prev => ({ ...prev, [postId]: '' }));
    await communityService.createComment(postId, text);
    const data = await communityService.getComments(postId);
    setComments(prev => ({ ...prev, [postId]: data }));
    const updater = (arr: any[]) =>
      arr.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count ?? 0) + 1 } : p);
    setPosts(updater);
    setQna(updater);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
  };

  const currentPosts = activeTab === 'feed' ? posts : qna;

  const renderPost = (post: any) => {
    const id = post.id as string;
    const isLiked = likedIds.has(id);
    const isExpanded = expandedPostId === id;
    const postComments = comments[id] ?? [];
    const isQna = activeTab === 'qna';
    const isMyPost = currentUserId && post.user_id === currentUserId;

    return (
      <div key={id} className="bg-white border-b border-gray-100">
        <div className="p-4">
          {/* Author row */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-sm font-bold">
                {(post.author_name as string)?.[0] ?? '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-gray-900">{post.author_name ?? '여행자'}</span>
                {post.island_name && (
                  <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" strokeWidth={2} />
                    {post.island_name}
                  </span>
                )}
                {isQna && (
                  <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">Q</span>
                )}
              </div>
              <span className="text-xs text-gray-400">{timeAgo(post.created_at as string)}</span>
            </div>
            {isMyPost && (
              <button
                onClick={() => handleDeletePost(id)}
                className="text-gray-300 hover:text-red-400 transition-colors active:scale-95 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Title */}
          {post.title && post.title !== post.content && (
            <p className="font-semibold text-gray-900 mb-1">{post.title}</p>
          )}

          {/* Content */}
          <p className="text-gray-700 text-sm leading-relaxed mb-3">{post.content as string}</p>

          {/* Image */}
          {post.image_url && (
            <img
              src={post.image_url}
              alt=""
              className="w-full rounded-xl mb-3 max-h-72 object-cover"
            />
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleLike(post)}
              className="flex items-center gap-1.5 text-sm active:scale-95 transition-transform"
            >
              <Heart
                className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                strokeWidth={2}
              />
              <span className={isLiked ? 'text-red-500 font-medium' : 'text-gray-500'}>
                {(post.likes_count as number) ?? 0}
              </span>
            </button>
            <button
              onClick={() => toggleComments(id)}
              className="flex items-center gap-1.5 text-sm text-gray-500 active:scale-95 transition-transform"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={2} />
              <span>
                {isQna
                  ? `답변 ${(post.comments_count as number) ?? 0}개`
                  : `댓글 ${(post.comments_count as number) ?? 0}`}
              </span>
            </button>
            <button
              onClick={() => toast.success('링크가 복사됐어요')}
              className="ml-auto text-gray-400 active:scale-95"
            >
              <Share2 className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Comments section */}
        {isExpanded && (
          <div className="bg-gray-50 border-t border-gray-100 px-4 py-3">
            {postComments.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">
                {isQna ? '아직 답변이 없어요' : '아직 댓글이 없어요'}
              </p>
            ) : (
              <div className="space-y-3 mb-3">
                {postComments.map((c: any) => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-xs font-bold">
                        {c.author_name?.[0] ?? '?'}
                      </span>
                    </div>
                    <div className="flex-1 bg-white rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-900">{c.author_name}</span>
                        {isQna && (
                          <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded font-semibold">A</span>
                        )}
                        <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={commentTexts[id] ?? ''}
                onChange={e => setCommentTexts(prev => ({ ...prev, [id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAddComment(id)}
                placeholder={isQna ? '답변을 입력하세요' : '댓글을 입력하세요'}
                className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleAddComment(id)}
                className="bg-blue-600 text-white w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
              >
                <Send className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-4 py-4 bg-white border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate(-1)} className="active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">리뷰 & Q&A</h1>
          <p className="text-xs text-gray-500">섬 여행 리뷰와 질문을 공유하세요</p>
        </div>
        <Link
          to={`/community/write?type=${activeTab}`}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold active:scale-95 transition-transform"
        >
          글쓰기
        </Link>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 pb-2 bg-white flex gap-2 flex-shrink-0">
        <button
          onClick={() => setActiveTab("feed")}
          className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === "feed" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          리뷰
        </button>
        <button
          onClick={() => setActiveTab("qna")}
          className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-all ${
            activeTab === "qna" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          질문 & 답변
        </button>
      </div>

      {/* Island filter chips */}
      <div className="px-4 pb-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setIslandFilter(null)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              !islandFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            전체
          </button>
          {ISLANDS.map(island => (
            <button
              key={island}
              onClick={() => setIslandFilter(islandFilter === island ? null : island)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                islandFilter === island ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {island}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : currentPosts.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-14 h-14 text-gray-200 mx-auto mb-3" strokeWidth={2} />
            <p className="font-medium text-gray-500">
              {activeTab === 'feed' ? '아직 리뷰가 없어요' : '아직 질문이 없어요'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === 'feed' ? '첫 번째 리뷰를 남겨보세요!' : '궁금한 점을 물어보세요!'}
            </p>
          </div>
        ) : (
          <div>{currentPosts.map(post => renderPost(post))}</div>
        )}
      </div>
    </div>
  );
}
