import { useState } from "react";
import { Link } from "react-router";
import { Star, Heart, MapPin, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";

interface Review {
  id: string;
  author: string;
  location: string;
  locationId: string;
  rating: number;
  date: string;
  preview: string;
  image: string;
  likes: number;
  tags: string[];
}

const ALL_REVIEWS: Review[] = [
  {
    id: "1",
    author: "김여행",
    location: "백령도",
    locationId: "baengnyeong",
    rating: 5,
    date: "2026-05-15",
    preview: "두무진의 절경이 정말 압권이었어요. 일몰은 꼭 보세요!",
    image: "https://images.unsplash.com/photo-1635355942488-a8bdb5a0803e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    likes: 124,
    tags: ["자연경관", "일몰명소", "사진촬영"],
  },
  {
    id: "2",
    author: "박바다",
    location: "덕적도",
    locationId: "deokjeok",
    rating: 5,
    date: "2026-05-10",
    preview: "서포리 해변의 투명한 바다에 감탄했어요. 가족 여행 최고!",
    image: "https://images.unsplash.com/photo-1662898069390-badabf2d65df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    likes: 98,
    tags: ["가족여행", "해수욕장", "맛집"],
  },
  {
    id: "3",
    author: "이섬순",
    location: "영흥도",
    locationId: "yeongheung",
    rating: 4,
    date: "2026-05-08",
    preview: "당일치기로 다녀오기 딱 좋았어요. 해산물도 맛있고!",
    image: "https://images.unsplash.com/photo-1628412071389-6e8f7a7a4e6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    likes: 87,
    tags: ["당일치기", "해산물", "산책로"],
  },
  {
    id: "4",
    author: "최힐링",
    location: "자월도",
    locationId: "jawol",
    rating: 5,
    date: "2026-05-05",
    preview: "한적한 섬에서 진정한 휴식을 찾았어요. 힐링 그 자체!",
    image: "https://images.unsplash.com/photo-1758327740342-4e705edea29b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    likes: 76,
    tags: ["힐링", "조용한", "일몰"],
  },
  {
    id: "5",
    author: "정모험",
    location: "대청도",
    locationId: "daecheong",
    rating: 5,
    date: "2026-05-01",
    preview: "모래사막이 섬에 있다니! 정말 신기하고 아름다웠어요.",
    image: "https://images.unsplash.com/photo-1700621496615-6ee6240503ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    likes: 112,
    tags: ["사막", "트레킹", "모험"],
  },
  {
    id: "6",
    author: "강청정",
    location: "이작도",
    locationId: "ijak",
    rating: 4,
    date: "2026-04-28",
    preview: "청정 바다에서 스노클링 했어요. 물고기가 정말 많아요!",
    image: "https://images.unsplash.com/photo-1661488601431-e8257e864068?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    likes: 65,
    tags: ["스노클링", "청정해역", "물놀이"],
  },
];

export function Reviews() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"latest" | "popular">("popular");

  const sortedReviews = [...ALL_REVIEWS].sort((a, b) => {
    if (sortBy === "popular") {
      return b.likes - a.likes;
    } else {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">리뷰</h1>
      </div>

      {/* Sort */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex gap-2">
        <button
          onClick={() => setSortBy("popular")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            sortBy === "popular"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          인기순
        </button>
        <button
          onClick={() => setSortBy("latest")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            sortBy === "latest"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          최신순
        </button>
      </div>

      {/* Reviews List */}
      <div className="px-6 py-4">
        <div className="space-y-3">
          {sortedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Link to={`/review/${review.id}`} className="block">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden active:scale-98 transition-transform">
        <div className="relative h-32">
          <img
            src={review.image}
            alt={review.location}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-white/40"
                  }`}
                  strokeWidth={2}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/90">
              <MapPin className="w-3 h-3" strokeWidth={2} />
              <span>{review.location}</span>
            </div>
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">{review.author}</span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Heart className="w-3 h-3" strokeWidth={2} />
              <span>{review.likes}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{review.preview}</p>
          <div className="flex flex-wrap gap-1">
            {review.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
