import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Heart, Share2, MapPin, Send, Plus } from "lucide-react";
import { toast } from "sonner";
import { communityService } from "../../lib/communityService";

export function Community() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"feed" | "qna">("feed");
  const [posts, setPosts] = useState<any[]>([]);
  const [qna, setQna] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [showWrite, setShowWrite] = useState(false);
  const [writeContent, setWriteContent] = useState("");
  const [writeIsland, setWriteIsland] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const [feedData, qnaData] = await Promise.all([
        communityService.getPosts('feed'),
        communityService.getPosts('qna'),
      ]);
      setPosts(feedData);
      setQna(qnaData);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleLike = async (post: any) => {
    const id = post.id as string;
    const liked = likedIds.has(id);
    const current = (post.likes_count as number) ?? 0;
    const next = liked ? current - 1 : current + 1;
    setLikedIds(prev => { const s = new Set(prev); liked ? s.delete(id) : s.add(id); return s; });
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes_count: next } : p));
    await communityService.updateLikes(id, next);
  };

  const handleSubmit = async () => {
    if (!writeContent.trim()) return;
    await communityService.createPost(writeContent, writeIsland || undefined, activeTab);
    setWriteContent(""); setWriteIsland(""); setShowWrite(false);
    toast.success("게시글이 등록됐어요");
    load();
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">커뮤니티</h1>
          <p className="text-xs text-gray-500">여행자들과 소통하세요</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex gap-2 flex-shrink-0">
        <button
          onClick={() => setActiveTab("feed")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "feed"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          실시간 피드
        </button>
        <button
          onClick={() => setActiveTab("qna")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === "qna"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          질문 & 답변
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === "feed" ? (
          posts.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="mb-2">아직 게시글이 없어요</p>
              <p className="text-sm text-gray-400">첫 번째 게시글을 작성해보세요!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {posts.map(post => (
                <div key={post.id} className="p-6 bg-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">{(post.author_name as string)?.[0] ?? '?'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{post.author_name ?? '여행자'}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {post.island_name && <><MapPin className="w-3 h-3" strokeWidth={2} /><span>{post.island_name}</span><span>•</span></>}
                        <span>{timeAgo(post.created_at as string)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-900 mb-3">{post.content as string}</p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleLike(post)} className="flex items-center gap-2 text-sm font-medium active:scale-95 transition-transform">
                      <Heart className={`w-5 h-5 ${likedIds.has(post.id as string) ? "fill-red-500 text-red-500" : "text-gray-500"}`} strokeWidth={2} />
                      <span className={likedIds.has(post.id as string) ? "text-red-500" : "text-gray-700"}>{(post.likes_count as number) ?? 0}</span>
                    </button>
                    <button onClick={() => toast.success("링크가 복사됐어요")} className="ml-auto text-gray-400 active:scale-95">
                      <Share2 className="w-5 h-5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          qna.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="mb-2">아직 질문이 없어요</p>
              <p className="text-sm text-gray-400">궁금한 점을 질문해보세요!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {qna.map(post => (
                <div key={post.id} className="p-6 bg-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">{(post.author_name as string)?.[0] ?? '?'}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{post.content as string}</p>
                      <p className="text-xs text-gray-500">{post.author_name as string} • {timeAgo(post.created_at as string)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                    <Heart className="w-4 h-4" strokeWidth={2} />
                    <span>{(post.likes_count as number) ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Write Sheet */}
      {showWrite && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setShowWrite(false)}>
          <div className="bg-white w-full rounded-t-2xl p-6 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900">{activeTab === 'feed' ? '게시글 작성' : '질문하기'}</h3>
            {activeTab === 'feed' && (
              <input
                value={writeIsland}
                onChange={e => setWriteIsland(e.target.value)}
                placeholder="섬 이름 (선택)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            <textarea
              value={writeContent}
              onChange={e => setWriteContent(e.target.value)}
              placeholder={activeTab === 'feed' ? '여행 중 느낀 점을 공유하세요' : '질문 내용을 입력하세요'}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
            >
              등록하기
            </button>
          </div>
        </div>
      )}

      {/* Write Button */}
      <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
        <button
          onClick={() => setShowWrite(true)}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Send className="w-5 h-5" strokeWidth={2} />
          {activeTab === "feed" ? "게시글 작성" : "질문하기"}
        </button>
      </div>
    </div>
  );
}
