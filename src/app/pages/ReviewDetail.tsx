import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, Star, Heart, MapPin, Calendar, Share2, User } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  author: string;
  authorAvatar?: string;
  location: string;
  locationId: string;
  rating: number;
  date: string;
  content: string;
  images: string[];
  likes: number;
  isLiked: boolean;
  tags: string[];
}

const REVIEWS: Record<string, Review> = {
  "1": {
    id: "1",
    author: "김여행",
    location: "백령도",
    locationId: "baengnyeong",
    rating: 5,
    date: "2026-05-15",
    content: `두무진의 절경이 정말 압권이었어요!

배에서 내려 처음 두무진을 봤을 때의 감동을 잊을 수가 없어요. 기암괴석이 만들어낸 자연의 조각품 같았어요.

일몰 시간에 맞춰 가시면 정말 환상적인 풍경을 볼 수 있어요. 석양이 절벽을 따라 내려앉는 모습은 사진으로 담기 어려울 정도로 아름다웠어요.

사곶해변도 꼭 가보세요! 천연기념물로 지정된 곳인데, 모래가 단단해서 차도 다닐 수 있을 정도예요. 정말 신기한 경험이었어요!

민박집 사장님이 추천해주신 물범도 봤는데, 너무 귀여웠어요. 3박 4일 일정이었는데도 아쉬울 정도로 볼거리가 많았어요.`,
    images: [
      "https://images.unsplash.com/photo-1635355942488-a8bdb5a0803e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
      "https://images.unsplash.com/photo-1700621496615-6ee6240503ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    likes: 124,
    isLiked: false,
    tags: ["자연경관", "일몰명소", "사진촬영"],
  },
  "2": {
    id: "2",
    author: "박바다",
    location: "덕적도",
    locationId: "deokjeok",
    rating: 5,
    date: "2026-05-10",
    content: `가족과 함께 다녀온 덕적도 여행!

서포리 해수욕장의 투명한 바닷물에 아이들이 정말 좋아했어요. 물이 얕고 파도가 잔잔해서 안전하게 물놀이할 수 있었어요.

비조봉에 올라가서 본 전망도 정말 좋았어요. 다리가 좀 아프긴 했지만 정상에서 보는 서해 바다 풍경이 모든 피로를 날려줬어요.

민박집 주인분이 직접 잡아오신 새우로 만들어주신 저녁 식사... 정말 최고였어요! 싱싱한 해산물을 실컷 먹을 수 있어서 행복했어요.

가족 여행지로 정말 추천해요!`,
    images: [
      "https://images.unsplash.com/photo-1662898069390-badabf2d65df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    likes: 98,
    isLiked: false,
    tags: ["가족여행", "해수욕장", "맛집"],
  },
  "3": {
    id: "3",
    author: "이섬순",
    location: "영흥도",
    locationId: "yeongheung",
    rating: 4,
    date: "2026-05-08",
    content: `당일치기로 다녀온 영흥도 여행기!

서울에서 가깝다는 게 최고의 장점이에요. 아침 일찍 출발해서 저녁에 돌아왔는데 알차게 놀다 왔어요.

십리포 해변에서 바지락 캐기 체험도 하고, 해안 산책로도 걸었어요. 날씨가 좋아서 정말 기분 좋은 산책이었어요.

점심으로 먹은 바지락칼국수가 정말 맛있었어요! 바지락이 엄청 많이 들어있고 국물이 시원했어요.

주말에 가볍게 다녀오기 좋은 곳이에요. 다음엔 1박으로 여유롭게 다녀오고 싶어요.`,
    images: [
      "https://images.unsplash.com/photo-1628412071389-6e8f7a7a4e6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    ],
    likes: 87,
    isLiked: false,
    tags: ["당일치기", "해산물", "산책로"],
  },
};

export function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const review = id ? REVIEWS[id] : null;
  const [isLiked, setIsLiked] = useState(review?.isLiked || false);
  const [likes, setLikes] = useState(review?.likes || 0);

  if (!review) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white px-6">
        <p className="text-gray-600 mb-4">리뷰를 찾을 수 없어요</p>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium active:scale-95 transition-transform"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikes(likes - 1);
      toast.success("좋아요를 취소했어요");
    } else {
      setIsLiked(true);
      setLikes(likes + 1);
      toast.success("좋아요를 눌렀어요");
    }
  };

  const handleShare = () => {
    toast.success("링크가 복사됐어요");
  };

  const handleLocationClick = () => {
    navigate("/islands");
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => navigate("/")}
          className="active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">리뷰 상세</h1>
        <button
          onClick={handleShare}
          className="active:scale-95 transition-transform"
        >
          <Share2 className="w-5 h-5 text-gray-700" strokeWidth={2} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Images */}
        <div className="relative">
          <div className="aspect-[4/3] bg-gray-100">
            <img
              src={review.images[0]}
              alt={review.location}
              className="w-full h-full object-cover"
            />
          </div>
          {review.images.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
              1/{review.images.length}
            </div>
          )}
        </div>

        {/* Author Info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{review.author}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" strokeWidth={2} />
                  <span>{new Date(review.date).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  }`}
                  strokeWidth={2}
                />
              ))}
            </div>
          </div>

          {/* Location Tag */}
          <button
            onClick={handleLocationClick}
            className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium active:scale-95 transition-transform"
          >
            <MapPin className="w-4 h-4" strokeWidth={2} />
            {review.location}
          </button>
        </div>

        {/* Review Content */}
        <div className="px-6 py-6">
          <p className="text-gray-800 leading-relaxed whitespace-pre-line">
            {review.content}
          </p>
        </div>

        {/* Tags */}
        <div className="px-6 pb-6">
          <div className="flex flex-wrap gap-2">
            {review.tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* More Images */}
        {review.images.length > 1 && (
          <div className="px-6 pb-6">
            <h3 className="font-semibold text-gray-900 mb-3">사진 더보기</h3>
            <div className="grid grid-cols-2 gap-2">
              {review.images.slice(1).map((image, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`${review.location} ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
            isLiked
              ? "bg-red-50 text-red-700"
              : "bg-gray-100 text-gray-700"
          } active:scale-95`}
        >
          <Heart
            className={`w-5 h-5 ${isLiked ? "fill-red-700" : ""}`}
            strokeWidth={2}
          />
          <span>{likes}</span>
        </button>
        <button
          onClick={handleLocationClick}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <MapPin className="w-5 h-5" strokeWidth={2} />
          이 섬 보러가기
        </button>
      </div>
    </div>
  );
}
