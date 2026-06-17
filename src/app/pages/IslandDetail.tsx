import { useParams, useNavigate, Link } from "react-router";
import { ChevronLeft, Ship, Clock, MapPin, Camera, Star, Heart, Share2, Waves, Wind, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getWeatherForIsland } from "../utils/weatherData";
import { DetailHeaderSkeleton } from "../components/SkeletonLoader";
import { getIslandById, type IslandDetail as IslandDetailType } from "../../lib/api/islands";

export function IslandDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [island, setIsland] = useState<IslandDetailType | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "restaurant" | "accommodation">("info");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getIslandById(id)
      .then(setIsland)
      .finally(() => setIsLoading(false));
  }, [id]);

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
          <Link to="/islands" className="text-blue-600 font-semibold">섬 목록으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const weather = getWeatherForIsland(island.name);

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? "즐겨찾기에서 제거됐어요" : "즐겨찾기에 추가됐어요");
  };

  const handleShare = () => {
    toast.success("링크가 복사됐어요");
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="relative h-64 flex-shrink-0">
        <img src={island.image} alt={island.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>

        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={handleFavorite} className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-700"}`} strokeWidth={2} />
          </button>
          <button onClick={handleShare} className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <Share2 className="w-5 h-5 text-gray-700" strokeWidth={2} />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">{island.name}</h1>
          <p className="text-sm text-white/90 mb-3">{island.description}</p>
          <div className="flex flex-wrap gap-2">
            {island.features.map((feature, idx) => (
              <span key={idx} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">{feature}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-orange-500" strokeWidth={2} />
              <div>
                <div className="text-xs text-gray-600">날씨</div>
                <div className="font-semibold text-gray-900">{weather.temp}°C {weather.condition}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-blue-600" strokeWidth={2} />
              <div>
                <div className="text-xs text-gray-600">파고</div>
                <div className="font-semibold text-gray-900">{weather.waveHeight}m</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-gray-500" strokeWidth={2} />
              <div>
                <div className="text-xs text-gray-600">풍속</div>
                <div className="font-semibold text-gray-900">{weather.windSpeed}m/s</div>
              </div>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${
            weather.ferryStatus === "정상" ? "bg-green-100 text-green-700" :
            weather.ferryStatus === "지연" ? "bg-orange-100 text-orange-700" :
            "bg-red-100 text-red-700"
          }`}>
            {weather.ferryStatus}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Ship className="w-5 h-5 text-blue-600" strokeWidth={2} />
              <div>
                <div className="text-xs text-gray-600">소요시간</div>
                <div className="font-semibold text-gray-900">{island.ferry_time}</div>
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
            <div className="text-lg font-bold text-blue-600">{island.ferry_price.toLocaleString()}원</div>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex gap-2">
          {(["info", "restaurant", "accommodation"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              {tab === "info" ? "관광지" : tab === "restaurant" ? "맛집" : "숙박"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeTab === "info" && (
          <div className="space-y-6">
            <section>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" strokeWidth={2} />
                주요 관광지
              </h3>
              {island.attractions.length === 0 ? (
                <p className="text-sm text-gray-500">등록된 관광지가 없어요</p>
              ) : (
                <div className="space-y-3">
                  {island.attractions.map((attraction) => (
                    <div key={attraction.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex gap-3">
                        <img src={attraction.image} alt={attraction.name} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
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
              )}
            </section>

            {island.photo_spots.length > 0 && (
              <section>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-pink-600" strokeWidth={2} />
                  포토 스팟
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {island.photo_spots.map((spot) => (
                    <div key={spot.id} className="relative rounded-xl overflow-hidden">
                      <img src={spot.image} alt={spot.name} className="w-full h-32 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="text-white font-semibold text-sm mb-0.5">{spot.name}</div>
                        <div className="text-white/80 text-xs">{spot.best_time}</div>
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
            {island.restaurants.length === 0 ? (
              <p className="text-sm text-gray-500">등록된 맛집이 없어요</p>
            ) : island.restaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex gap-3">
                  <img src={restaurant.image} alt={restaurant.name} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">{restaurant.name}</h4>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" strokeWidth={2} />
                        <span className="text-sm font-semibold text-gray-700">{restaurant.rating}</span>
                      </div>
                    </div>
                    <div className="text-xs text-blue-600 font-medium mb-2">{restaurant.cuisine} · {restaurant.price_level}</div>
                    <p className="text-sm text-gray-600">{restaurant.specialty}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "accommodation" && (
          <div className="space-y-3">
            {island.accommodations.length === 0 ? (
              <p className="text-sm text-gray-500">등록된 숙박시설이 없어요</p>
            ) : island.accommodations.map((hotel) => (
              <div key={hotel.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex gap-3">
                  <img src={hotel.image} alt={hotel.name} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
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
                      <div className="text-lg font-bold text-blue-600">{hotel.price_per_night.toLocaleString()}원</div>
                      <div className="text-xs text-gray-500">1박 기준</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
