import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Heart, MessageCircle, Share2, MapPin, Users, ThumbsUp, Send } from "lucide-react";
import { toast } from "sonner";

interface Post {
  id: string;
  author: string;
  authorAvatar: string;
  island: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked: boolean;
  weatherReport?: {
    condition: string;
    congestion: "여유" | "보통" | "혼잡";
  };
}

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    author: "섬여행러",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
    island: "백령도",
    content: "두무진 일몰 진짜 미쳤어요!! 꼭 가보세요 🌅",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    likes: 124,
    comments: 18,
    timestamp: "2시간 전",
    isLiked: false,
  },
  {
    id: "2",
    author: "바다사랑",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
    island: "덕적도",
    content: "오늘 서포리 해변 날씨 완전 좋아요! 사람도 많지 않고 물도 맑아요 👍",
    likes: 89,
    comments: 12,
    timestamp: "3시간 전",
    isLiked: false,
    weatherReport: {
      condition: "맑음 23°C",
      congestion: "여유",
    },
  },
  {
    id: "3",
    author: "힐링여행",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
    island: "자월도",
    content: "자월도 큰말해변에서 캠핑 중이에요. 별이 정말 많이 보여요 ⭐",
    image: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    likes: 156,
    comments: 24,
    timestamp: "5시간 전",
    isLiked: true,
  },
  {
    id: "4",
    author: "먹방러버",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=4",
    island: "덕적도",
    content: "덕적도 물회 맛집 찾았어요! 항구 근처 '바다횟집' 강추합니다",
    likes: 67,
    comments: 8,
    timestamp: "1일 전",
    isLiked: false,
  },
  {
    id: "5",
    author: "사진작가",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=5",
    island: "백령도",
    content: "사곶해변 일출 타임랩스 찍었어요. 날씨가 도와줘서 대박 샷 건졌습니다 📸",
    image: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    likes: 203,
    comments: 31,
    timestamp: "1일 전",
    isLiked: false,
  },
];

export function Community() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"feed" | "qna">("feed");
  const [posts, setPosts] = useState(MOCK_POSTS);

  const toggleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  const handleShare = (postId: string) => {
    toast.success("링크가 복사됐어요");
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
        {activeTab === "feed" ? (
          <div className="divide-y divide-gray-200">
            {posts.map((post, index) => (
              <div
                key={post.id}
                className="p-6 bg-white animate-stagger-item"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Author Info */}
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={post.authorAvatar}
                    alt={post.author}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{post.author}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" strokeWidth={2} />
                      <span>{post.island}</span>
                      <span>•</span>
                      <span>{post.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Weather Report */}
                {post.weatherReport && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-900">실시간 현장 정보</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-blue-700">{post.weatherReport.condition}</span>
                        <span className={`px-2 py-0.5 rounded font-medium text-xs ${
                          post.weatherReport.congestion === "여유" ? "bg-green-100 text-green-700" :
                          post.weatherReport.congestion === "보통" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {post.weatherReport.congestion}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content */}
                <p className="text-gray-900 mb-3">{post.content}</p>

                {/* Image */}
                {post.image && (
                  <img
                    src={post.image}
                    alt="Post"
                    className="w-full rounded-xl mb-3"
                  />
                )}

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className="flex items-center gap-2 text-sm font-medium active:scale-95 transition-transform"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        post.isLiked ? "fill-red-500 text-red-500" : "text-gray-500"
                      }`}
                      strokeWidth={2}
                    />
                    <span className={post.isLiked ? "text-red-500" : "text-gray-700"}>
                      {post.likes}
                    </span>
                  </button>
                  <button className="flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95 transition-transform">
                    <MessageCircle className="w-5 h-5" strokeWidth={2} />
                    <span>{post.comments}</span>
                  </button>
                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 active:scale-95 transition-transform ml-auto"
                  >
                    <Share2 className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <QnASection />
        )}
      </div>

      {/* Write Button */}
      <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
        <button
          onClick={() => toast.info("글쓰기 기능은 곧 추가될 예정이에요")}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Send className="w-5 h-5" strokeWidth={2} />
          {activeTab === "feed" ? "게시글 작성" : "질문하기"}
        </button>
      </div>
    </div>
  );
}

function QnASection() {
  const qnaItems = [
    {
      id: "q1",
      author: "여행초보",
      question: "백령도 1박2일 충분할까요?",
      answers: 5,
      likes: 12,
      timestamp: "1시간 전",
      bestAnswer: "두무진, 사곶해변 정도만 보신다면 1박2일도 괜찮아요. 하지만 여유롭게 즐기시려면 2박3일 추천드려요!",
    },
    {
      id: "q2",
      author: "맛집탐방",
      question: "덕적도 맛집 추천해주세요",
      answers: 8,
      likes: 24,
      timestamp: "3시간 전",
      bestAnswer: "항구 근처 '바다횟집' 물회가 정말 맛있어요. 현지인들도 많이 가는 곳이에요!",
    },
    {
      id: "q3",
      author: "가족여행",
      question: "아이랑 가기 좋은 섬 어디인가요?",
      answers: 12,
      likes: 31,
      timestamp: "5시간 전",
      bestAnswer: "덕적도나 자월도 추천해요. 해변이 넓고 파도가 잔잔해서 아이들이 놀기 좋아요.",
    },
  ];

  return (
    <div className="p-6 space-y-4">
      {qnaItems.map((item) => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.id}`}
              alt={item.author}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-900 mb-1">{item.question}</div>
              <div className="text-xs text-gray-500">
                {item.author} • {item.timestamp}
              </div>
            </div>
          </div>

          {item.bestAnswer && (
            <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsUp className="w-4 h-4 text-blue-600" strokeWidth={2} />
                <span className="text-xs font-semibold text-blue-900">베스트 답변</span>
              </div>
              <p className="text-sm text-gray-700">{item.bestAnswer}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <MessageCircle className="w-4 h-4" strokeWidth={2} />
              <span>{item.answers}개 답변</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Heart className="w-4 h-4" strokeWidth={2} />
              <span>{item.likes}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
