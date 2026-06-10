import { useParams, useNavigate, Link } from "react-router";
import { ChevronLeft, Ship, Clock, MapPin, Camera, UtensilsCrossed, Hotel, Waves, Wind, Sun, Star, Heart, Share2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { getWeatherForIsland } from "../utils/weatherData";
import { DetailHeaderSkeleton } from "../components/SkeletonLoader";

interface IslandData {
  id: string;
  name: string;
  description: string;
  features: string[];
  ferryTime: string;
  ferryPrice: number;
  popularityTrend: "up" | "down" | "stable";
  congestion: "low" | "medium" | "high";
  bestSeason: string;
  image: string;
  ports: ("인천항" | "대부도")[];
  attractions: Attraction[];
  restaurants: Restaurant[];
  accommodations: Accommodation[];
  photoSpots: PhotoSpot[];
  weather: Weather;
}

interface Attraction {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  duration: string;
  rating: number;
}

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  price: string;
  specialty: string;
  image: string;
  rating: number;
}

interface Accommodation {
  id: string;
  name: string;
  type: string;
  price: number;
  image: string;
  rating: number;
}

interface PhotoSpot {
  id: string;
  name: string;
  description: string;
  image: string;
  bestTime: string;
}

interface Weather {
  temp: number;
  condition: string;
  waveHeight: number;
  windSpeed: number;
  ferryStatus: "정상" | "지연" | "결항";
}

const ISLAND_DETAILS: { [key: string]: IslandData } = {
  baengnyeong: {
    id: "baengnyeong",
    name: "백령도",
    description: "천혜의 자연경관과 독특한 지질을 자랑하는 서해 최북단 섬",
    features: ["두무진 해안 절벽", "사곶해변", "콩돌해변"],
    ferryTime: "4시간",
    ferryPrice: 45000,
    popularityTrend: "up",
    congestion: "medium",
    bestSeason: "5~10월",
    image: "https://images.unsplash.com/photo-1635355942488-a8bdb5a0803e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    ports: ["인천항"],
    weather: {
      temp: 22,
      condition: "맑음",
      waveHeight: 0.5,
      windSpeed: 3.2,
      ferryStatus: "정상",
    },
    attractions: [
      {
        id: "a1",
        name: "두무진",
        category: "자연경관",
        description: "백령도의 대표 절경, 기암괴석이 병풍처럼 펼쳐진 해안",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
        duration: "2시간",
        rating: 4.8,
      },
      {
        id: "a2",
        name: "사곶해변",
        category: "해변",
        description: "천연기념물 천연비행장, 모래가 단단해 차량 진입 가능",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
        duration: "1.5시간",
        rating: 4.6,
      },
      {
        id: "a3",
        name: "콩돌해변",
        category: "해변",
        description: "콩알만한 돌이 깔린 독특한 해변",
        image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
        duration: "1시간",
        rating: 4.5,
      },
    ],
    restaurants: [
      {
        id: "r1",
        name: "백령횟집",
        cuisine: "해산물",
        price: "₩₩",
        specialty: "싱싱한 물회, 백령도 전복",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
        rating: 4.7,
      },
      {
        id: "r2",
        name: "섬마을식당",
        cuisine: "한식",
        price: "₩",
        specialty: "바지락칼국수, 콩국수",
        image: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
        rating: 4.4,
      },
    ],
    accommodations: [
      {
        id: "h1",
        name: "백령리조트",
        type: "리조트",
        price: 120000,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
        rating: 4.5,
      },
      {
        id: "h2",
        name: "바다펜션",
        type: "펜션",
        price: 80000,
        image: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
        rating: 4.3,
      },
    ],
    photoSpots: [
      {
        id: "p1",
        name: "두무진 일몰",
        description: "노을이 물든 기암절벽의 장관",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
        bestTime: "오후 7시",
      },
      {
        id: "p2",
        name: "사곶해변 석양",
        description: "끝없이 펼쳐진 백사장과 석양",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
        bestTime: "오후 6-7시",
      },
    ],
  },
  deokjeok: {
    id: "deokjeok",
    name: "덕적도",
    description: "맑은 바다와 아름다운 해변이 어우러진 가족 여행지",
    features: ["서포리해수욕장", "비조봉", "소야도"],
    ferryTime: "2.5시간",
    ferryPrice: 28000,
    popularityTrend: "stable",
    congestion: "medium",
    bestSeason: "6~9월",
    image: "https://images.unsplash.com/photo-1662898069390-badabf2d65df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    ports: ["인천항", "대부도"],
    weather: {
      temp: 24,
      condition: "구름조금",
      waveHeight: 0.8,
      windSpeed: 4.5,
      ferryStatus: "정상",
    },
    attractions: [
      {
        id: "a1",
        name: "서포리해수욕장",
        category: "해변",
        description: "2km에 달하는 아름다운 백사장",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
        duration: "2-3시간",
        rating: 4.7,
      },
      {
        id: "a2",
        name: "비조봉",
        category: "등산",
        description: "덕적도 최고봉, 섬 전경 조망",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
        duration: "2시간",
        rating: 4.5,
      },
    ],
    restaurants: [
      {
        id: "r1",
        name: "덕적맛집",
        cuisine: "해산물",
        price: "₩₩",
        specialty: "회덮밥, 조개구이",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
        rating: 4.6,
      },
    ],
    accommodations: [
      {
        id: "h1",
        name: "덕적펜션",
        type: "펜션",
        price: 90000,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
        rating: 4.4,
      },
    ],
    photoSpots: [
      {
        id: "p1",
        name: "서포리 일출",
        description: "해수욕장에서 보는 장엄한 일출",
        image: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
        bestTime: "오전 5-6시",
      },
    ],
  },
};

export function IslandDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"info" | "restaurant" | "accommodation">("info");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [id]);

  const baseIsland = id ? ISLAND_DETAILS[id] : null;

  // Merge real-time weather data
  const island = useMemo(() => {
    if (!baseIsland) return null;
    const realTimeWeather = getWeatherForIsland(baseIsland.name);
    return {
      ...baseIsland,
      weather: {
        temp: realTimeWeather.temp,
        condition: realTimeWeather.condition,
        waveHeight: realTimeWeather.waveHeight,
        windSpeed: realTimeWeather.windSpeed,
        ferryStatus: realTimeWeather.ferryStatus,
      }
    };
  }, [baseIsland]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <DetailHeaderSkeleton />
      </div>
    );
  }

  if (!island) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600 mb-4">섬 정보를 찾을 수 없어요</p>
          <Link to="/islands" className="text-blue-600 font-semibold">
            섬 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? "즐겨찾기에서 제거됐어요" : "즐겨찾기에 추가됐어요");
  };

  const handleShare = () => {
    toast.success("링크가 복사됐어요");
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header Image */}
      <div className="relative h-64 flex-shrink-0">
        <img
          src={island.image}
          alt={island.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={handleFavorite}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500 animate-heart-beat" : "text-gray-700"}`} strokeWidth={2} />
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Share2 className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
        </div>

        {/* Island Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">{island.name}</h1>
          <p className="text-sm text-white/90 mb-3">{island.description}</p>
          <div className="flex flex-wrap gap-2">
            {island.features.map((feature, idx) => (
              <span key={idx} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Weather & Ferry Status */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-orange-500" strokeWidth={2} />
              <div>
                <div className="text-xs text-gray-600">날씨</div>
                <div className="font-semibold text-gray-900">{island.weather.temp}°C {island.weather.condition}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-blue-600" strokeWidth={2} />
              <div>
                <div className="text-xs text-gray-600">파고</div>
                <div className="font-semibold text-gray-900">{island.weather.waveHeight}m</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-gray-500" strokeWidth={2} />
              <div>
                <div className="text-xs text-gray-600">풍속</div>
                <div className="font-semibold text-gray-900">{island.weather.windSpeed}m/s</div>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${
            island.weather.ferryStatus === "정상" ? "bg-green-100 text-green-700" :
            island.weather.ferryStatus === "지연" ? "bg-orange-100 text-orange-700" :
            "bg-red-100 text-red-700"
          }`}>
            {island.weather.ferryStatus}
          </div>
        </div>
      </div>

      {/* Ferry Info */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Ship className="w-5 h-5 text-blue-600" strokeWidth={2} />
              <div>
                <div className="text-xs text-gray-600">소요시간</div>
                <div className="font-semibold text-gray-900">{island.ferryTime}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-500" strokeWidth={2} />
              <div>
                <div className="text-xs text-gray-600">출발 항구</div>
                <div className="font-semibold text-gray-900">{island.ports.join(", ")}</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600">편도 요금</div>
            <div className="text-lg font-bold text-blue-600">{island.ferryPrice.toLocaleString()}원</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "info"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            관광지
          </button>
          <button
            onClick={() => setActiveTab("restaurant")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "restaurant"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            맛집
          </button>
          <button
            onClick={() => setActiveTab("accommodation")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "accommodation"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            숙박
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeTab === "info" && (
          <div className="space-y-6">
            {/* Attractions */}
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" strokeWidth={2} />
                주요 관광지
              </h3>
              <div className="space-y-3">
                {island.attractions.map((attraction) => (
                  <div key={attraction.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex gap-3">
                      <img
                        src={attraction.image}
                        alt={attraction.name}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-semibold text-gray-900">{attraction.name}</h4>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" strokeWidth={2} />
                            <span className="text-sm font-semibold text-gray-700">{attraction.rating}</span>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-medium mb-2">{attraction.category}</div>
                        <p className="text-sm text-gray-600 mb-2">{attraction.description}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" strokeWidth={2} />
                          <span>{attraction.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Photo Spots */}
            {island.photoSpots.length > 0 && (
              <section>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-pink-600" strokeWidth={2} />
                  포토 스팟
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {island.photoSpots.map((spot) => (
                    <div key={spot.id} className="relative rounded-xl overflow-hidden">
                      <img
                        src={spot.image}
                        alt={spot.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="text-white font-semibold text-sm mb-0.5">{spot.name}</div>
                        <div className="text-white/80 text-xs">{spot.bestTime}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === "restaurant" && (
          <div className="space-y-3">
            {island.restaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex gap-3">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">{restaurant.name}</h4>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" strokeWidth={2} />
                        <span className="text-sm font-semibold text-gray-700">{restaurant.rating}</span>
                      </div>
                    </div>
                    <div className="text-xs text-blue-600 font-medium mb-2">{restaurant.cuisine} · {restaurant.price}</div>
                    <p className="text-sm text-gray-600">{restaurant.specialty}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "accommodation" && (
          <div className="space-y-3">
            {island.accommodations.map((hotel) => (
              <div key={hotel.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex gap-3">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="font-semibold text-gray-900">{hotel.name}</h4>
                        <div className="text-xs text-gray-600 mt-0.5">{hotel.type}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" strokeWidth={2} />
                        <span className="text-sm font-semibold text-gray-700">{hotel.rating}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-lg font-bold text-blue-600">{hotel.price.toLocaleString()}원</div>
                      <div className="text-xs text-gray-500">1박 기준</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
        <Link
          to={`/create-trip?island=${island.id}&name=${encodeURIComponent(island.name)}`}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Ship className="w-5 h-5" strokeWidth={2} />
          {island.name} 여행 일정 만들기
        </Link>
      </div>
    </div>
  );
}
