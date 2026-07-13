import { useParams, useNavigate, Link } from "react-router";
import { ChevronLeft, Ship, Clock, MapPin, Camera, Star, Heart, Share2, Waves, Wind, Sun, Users, Bot, Footprints, Compass } from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
import { toast } from "sonner";

const CongestionChart = lazy(() => import("../components/CongestionChart").then(m => ({ default: m.CongestionChart })));
import { fetchWeatherForIsland, type WeatherResult } from "../../lib/weatherService";
import { IslandImage } from "../components/IslandImage";
import { DetailHeaderSkeleton } from "../components/SkeletonLoader";
import { TourApiBadge } from "../components/TourApiBadge";
import { getIslandById, formatFerryPrice, formatAccommodationPrice, type IslandDetail as IslandDetailType } from "../../lib/api/islands";
import { favoritesService } from "../../lib/favoritesService";
import { recentlyViewedService } from "../../lib/recentlyViewed";
import { getFerryScheduleForIsland, type FerrySchedule } from "../../lib/api/ferry";
import { getIslandCongestion, type IslandCongestionData } from "../../lib/api/congestion";
import { getCoursesForIsland, type DurunubiCourse } from "../../lib/api/durunubi";
import { getRelatedByIslandId, type RelatedAttraction } from "../../lib/api/relatedAttractions";

export function IslandDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [island, setIsland] = useState<IslandDetailType | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "restaurant" | "accommodation">("info");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ferrySchedule, setFerrySchedule] = useState<FerrySchedule[]>([]);
  const [ferryLoading, setFerryLoading] = useState(true);
  const [ferryError, setFerryError] = useState(false);
  const [congestion, setCongestion] = useState<IslandCongestionData | null>(null);
  const [congestionLoading, setCongestionLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherResult["current"] | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [durunubiCourses, setDurunubiCourses] = useState<DurunubiCourse[]>([]);
  const [durunubiLoading, setDurunubiLoading] = useState(true);
  const [relatedAttractions, setRelatedAttractions] = useState<RelatedAttraction[]>([]);

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
        recentlyViewedService.record({ id: id!, name: islandData.name, image: islandData.image });
        getFerryScheduleForIsland(id!)
          .then(setFerrySchedule)
          .catch(() => { setFerryError(true); toast.error("여객선 시간표를 불러오지 못했어요"); })
          .finally(() => setFerryLoading(false));
        getIslandCongestion(id!)
          .then(setCongestion)
          .catch(() => {})
          .finally(() => setCongestionLoading(false));
        fetchWeatherForIsland(id!, islandData.lat, islandData.lng)
          .then((result) => setWeather(result?.current ?? null))
          .catch(() => {})
          .finally(() => setWeatherLoading(false));
        getCoursesForIsland(id!)
          .then(setDurunubiCourses)
          .catch(() => {})
          .finally(() => setDurunubiLoading(false));
        getRelatedByIslandId(id!)
          .then(setRelatedAttractions)
          .catch(() => {});
      } else {
        setFerryLoading(false);
        setCongestionLoading(false);
        setWeatherLoading(false);
        setDurunubiLoading(false);
      }
    }).finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="bg-white">
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
    <div className="bg-white">
      <div className="relative h-64">
        <IslandImage src={island.image} alt={island.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>

        <div className="absolute top-4 right-4 flex gap-2">
          <Link
            to={`/support?chat=1&island=${encodeURIComponent(island.name)}`}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label={`${island.name}에 대해 AI에게 물어보기`}
          >
            <Bot className="w-5 h-5 text-blue-600" strokeWidth={2} />
          </Link>
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

      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-orange-500" strokeWidth={2} />
              <div>
                <div className="text-xs text-gray-600">날씨</div>
                <div className="font-semibold text-gray-900">
                  {weatherLoading ? "-" : weather ? `${weather.temp}°C ${weather.condition}` : "정보 없음"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-blue-600" strokeWidth={2} />
              <div>
                <div className="text-xs text-gray-600">파고</div>
                <div className="font-semibold text-gray-900">{weatherLoading ? "-" : weather ? `${weather.waveHeight}m` : "정보 없음"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-gray-500" strokeWidth={2} />
              <div>
                <div className="text-xs text-gray-600">풍속</div>
                <div className="font-semibold text-gray-900">{weatherLoading ? "-" : weather ? `${weather.windSpeed}m/s` : "정보 없음"}</div>
              </div>
            </div>
          </div>
          {!weatherLoading && weather && (
            <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${
              weather.ferryStatus === "정상" ? "bg-green-100 text-green-700" :
              weather.ferryStatus === "지연" ? "bg-orange-100 text-orange-700" :
              "bg-red-100 text-red-700"
            }`}>
              {weather.ferryStatus}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 bg-white border-b border-gray-200">
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
            <div className="text-lg font-bold text-blue-600">
              {formatFerryPrice(island.ferry_price)}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-white border-b border-gray-200">
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
        ) : ferryError ? (
          <p className="text-sm text-gray-400">지금 운항 정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요</p>
        ) : ferrySchedule.length === 0 ? (
          <p className="text-sm text-gray-400">오늘 운항 정보가 없어요</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ferrySchedule.map((f, i) => {
              const isCancelled = f.status.includes('결항');
              const isDone = f.status === '완료';
              const isActive = f.status.includes('출항') || f.status.includes('운항') || f.status.includes('항중') || f.status.includes('도착');
              return (
                <div key={i} className={`w-28 rounded-xl p-3 border ${
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
      <div className="px-6 py-5 bg-gradient-to-br from-slate-50 to-blue-50/50 border-b border-gray-100">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-blue-600" strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-gray-900">향후 7일 혼잡도 예측</h3>
          <TourApiBadge />
        </div>
        {congestionLoading ? (
          <div className="h-24 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : !congestion ? (
          <p className="text-sm text-gray-400 flex items-center gap-1.5">
            <span className="text-gray-300">ℹ</span>
            이 섬은 혼잡도 예측 데이터가 없어요
          </p>
        ) : (
          <Suspense fallback={<div className="h-24 flex items-center justify-center"><div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" /></div>}>
            <CongestionChart congestion={congestion} />
          </Suspense>
        )}
      </div>

      {/* 추천 걷기길/트레킹 코스 (두루누비) — 데이터 없는 섬은 섹션째로 숨김 */}
      {!durunubiLoading && durunubiCourses.length > 0 && (
        <div className="px-6 py-5 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Footprints className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
            </div>
            <h3 className="font-bold text-gray-900">추천 걷기길·트레킹 코스</h3>
            <TourApiBadge />
          </div>
          <div className="space-y-3">
            {durunubiCourses.slice(0, 4).map((course) => (
              <div key={course.courseId} className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{course.courseName}</h4>
                  <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    course.difficulty === "easy" ? "bg-green-100 text-green-700" :
                    course.difficulty === "medium" ? "bg-orange-100 text-orange-700" :
                    "bg-red-100 text-red-700"}`}>
                    {course.difficulty === "easy" ? "쉬움" : course.difficulty === "medium" ? "보통" : "어려움"}
                  </span>
                </div>
                {course.summary && <p className="text-sm text-gray-600 mb-2 line-clamp-2">{course.summary}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {course.distanceKm > 0 && (
                    <span className="flex items-center gap-1"><Compass className="w-3 h-3" strokeWidth={2} />{course.distanceKm}km</span>
                  )}
                  {course.durationMin > 0 && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={2} />약 {Math.round(course.durationMin / 60 * 10) / 10}시간</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 py-3 bg-white border-b border-gray-200">
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

      <div className="px-6 py-6">
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
                        <img src={attraction.image} alt={attraction.name} className="w-24 h-24 object-cover rounded-lg" />
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
                  <IslandImage src={restaurant.image} alt={restaurant.name} className="w-24 h-24 object-cover rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-gray-900">{restaurant.name}</h4>
                      {restaurant.rating != null && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" strokeWidth={2} />
                          <span className="text-sm font-semibold text-gray-700">{restaurant.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-blue-600 font-medium mb-2">{[restaurant.cuisine, restaurant.price_level].filter(Boolean).join(" · ")}</div>
                    {restaurant.specialty && <p className="text-sm text-gray-600">{restaurant.specialty}</p>}
                    {restaurant.phone && (
                      <a href={`tel:${restaurant.phone}`} className="inline-block mt-2 text-xs font-medium text-blue-600">
                        📞 {restaurant.phone}
                      </a>
                    )}
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
                  <IslandImage src={hotel.image} alt={hotel.name} className="w-24 h-24 object-cover rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="font-semibold text-gray-900">{hotel.name}</h4>
                        {hotel.type && <div className="text-xs text-gray-600 mt-0.5">{hotel.type}</div>}
                      </div>
                      {hotel.rating != null && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" strokeWidth={2} />
                          <span className="text-sm font-semibold text-gray-700">{hotel.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <div className="text-lg font-bold text-blue-600">{formatAccommodationPrice(hotel.price_per_night)}</div>
                        <div className="text-xs text-gray-500">1박 기준</div>
                      </div>
                      {hotel.phone && (
                        <a href={`tel:${hotel.phone}`} className="text-xs font-medium text-blue-600">
                          📞 {hotel.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 이 섬과 함께 가면 좋은 곳 (관광공사 연관관광지정보) — 데이터 없는 섬은 섹션째로 숨김 */}
      {relatedAttractions.length > 0 && (
        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-bold text-gray-900">이 섬과 함께 가면 좋은 곳</h3>
            <TourApiBadge />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {relatedAttractions.slice(0, 8).map((r) => (
              <div key={r.rlatContentId || r.rlatAtsNm} className="w-36 shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="h-24 bg-gray-100">
                  {r.rlatImage ? (
                    <img src={r.rlatImage} alt={r.rlatAtsNm} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <MapPin className="w-6 h-6" strokeWidth={2} />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">{r.rlatAtsNm}</p>
                  {r.rlatDist > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.rlatDist >= 1000 ? `${(r.rlatDist / 1000).toFixed(1)}km` : `${Math.round(r.rlatDist)}m`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 py-4 bg-white border-t border-gray-200">
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
