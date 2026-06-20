import { useParams, useNavigate, Link } from "react-router";
import { ChevronLeft, Ship, Clock, MapPin, Camera, Star, Heart, Share2, Waves, Wind, Sun, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getWeatherForIsland } from "../utils/weatherData";
import { DetailHeaderSkeleton } from "../components/SkeletonLoader";
import { getIslandById, type IslandDetail as IslandDetailType } from "../../lib/api/islands";
import { favoritesService } from "../../lib/favoritesService";
import { getFerryScheduleForIsland, type FerrySchedule } from "../../lib/api/ferry";
import { getIslandCongestion, type IslandCongestionData } from "../../lib/api/congestion";

export function IslandDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [island, setIsland] = useState<IslandDetailType | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "restaurant" | "accommodation">("info");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ferrySchedule, setFerrySchedule] = useState<FerrySchedule[]>([]);
  const [ferryLoading, setFerryLoading] = useState(true);
  const [congestion, setCongestion] = useState<IslandCongestionData | null>(null);
  const [congestionLoading, setCongestionLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([
      getIslandById(id),
      favoritesService.isFavorite(id),
    ]).then(([islandData, fav]) => {
      setIsland(islandData);
      setIsFavorite(fav);
      if (islandData) {
        getFerryScheduleForIsland(id!)
          .then(setFerrySchedule)
          .catch(() => {})
          .finally(() => setFerryLoading(false));
        getIslandCongestion(id!)
          .then(setCongestion)
          .catch(() => {})
          .finally(() => setCongestionLoading(false));
      } else {
        setFerryLoading(false);
        setCongestionLoading(false);
      }
    }).finally(() => setIsLoading(false));
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

  const handleFavorite = async () => {
    if (!id) return;
    if (isFavorite) {
      await favoritesService.removeFavorite(id);
      toast.success("찜 목록에서 제거됐어요");
    } else {
      await favoritesService.addFavorite(id);
      toast.success("찜 목록에 추가됐어요");
    }
    setIsFavorite(!isFavorite);
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

      <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Ship className="w-4 h-4 text-blue-600" strokeWidth={2} />
            오늘 출발 여객선
          </h3>
          <span className="text-xs text-gray-400">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</span>
        </div>
        {ferryLoading ? (
          <div className="flex gap-2">
            {[1,2,3].map(i => <div key={i} className="h-16 w-28 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : ferrySchedule.length === 0 ? (
          <p className="text-sm text-gray-400">오늘 운항 정보가 없어요</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ferrySchedule.map((f, i) => {
              const isCancelled = f.status.includes('결항');
              const isDone = f.status === '완료';
              const isActive = f.status.includes('출항') || f.status.includes('운항') || f.status.includes('항중') || f.status.includes('도착');
              return (
                <div key={i} className={`flex-shrink-0 w-28 rounded-xl p-3 border ${
                  isCancelled ? 'bg-red-50 border-red-200' : isDone ? 'bg-gray-50 border-gray-200' : isActive ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                }`}>
                  <div className={`text-xs font-semibold mb-1 ${
                    isCancelled ? 'text-red-600' : isDone ? 'text-gray-400' : isActive ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {f.status}
                  </div>
                  <div className={`text-lg font-bold ${isCancelled ? 'text-red-400 line-through' : isDone ? 'text-gray-400' : 'text-gray-900'}`}>
                    {f.departureTime}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{f.ferryName}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 혼잡도 예측 */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-blue-600" strokeWidth={2} />
          향후 7일 혼잡도 예측
        </h3>
        {congestionLoading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : !congestion ? (
          <p className="text-sm text-gray-400 flex items-center gap-1.5">
            <span className="text-gray-300">ℹ</span>
            이 섬은 혼잡도 예측 데이터가 없어요
          </p>
        ) : (
          <>
            <div className="flex gap-1">
              {congestion.forecast.map((f) => {
                const bg = f.level === 'high' ? 'bg-red-50' : f.level === 'medium' ? 'bg-yellow-50' : 'bg-green-50'
                const barColor = f.level === 'high' ? 'bg-red-400' : f.level === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                const textColor = f.level === 'high' ? 'text-red-700' : f.level === 'medium' ? 'text-yellow-700' : 'text-green-700'
                return (
                  <div key={f.date} className={`flex-1 ${bg} rounded-xl py-2.5 px-1 flex flex-col items-center gap-1.5`}>
                    <span className={`text-[10px] font-semibold ${textColor}`}>{f.dayLabel}</span>
                    <div className="w-1.5 h-10 bg-gray-100 rounded-full overflow-hidden flex flex-col justify-end">
                      <div
                        className={`w-full rounded-full ${barColor} transition-all`}
                        style={{ height: `${Math.max(f.rate * 100, 8)}%` }}
                      />
                    </div>
                    <span className={`text-[9px] font-medium ${textColor}`}>{Math.round(f.rate * 100)}%</span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 mt-2">
              {([['bg-green-400', '여유'], ['bg-yellow-400', '보통'], ['bg-red-400', '혼잡']] as const).map(([color, label]) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
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
