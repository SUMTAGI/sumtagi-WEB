import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Calendar, Ship, Sparkles, MapPin, Trash2, Pencil, ListChecks, Info, ChevronRight, Clock, DollarSign, Plus, Heart, Sun, Check } from "lucide-react";
import { toast } from "sonner";
import { ListSkeleton } from "../components/SkeletonLoader";
import { IslandImage } from "../components/IslandImage";
import { tripService } from "../../lib/tripService";
import { favoritesService } from "../../lib/favoritesService";

export function Travel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"plan" | "bookings">("plan");
  const [currentItinerary, setCurrentItinerary] = useState<any>(null);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [confirmedTrips, setConfirmedTrips] = useState<any[]>([]);
  const [checklistProgress, setChecklistProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tripCount, setTripCount] = useState(0);
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [trip, trips, count, favorites] = await Promise.all([
        tripService.getUpcomingTrip(),
        tripService.getVisitedTrips(),
        tripService.getTripCount(),
        favoritesService.getFavorites(),
      ]);
      if (trip) {
        setCurrentItinerary({ ...trip, startDate: trip.start_date, islands: trip.islands ?? [] });
        setCurrentTripId(trip.id);
      }
      const progress = await tripService.getChecklistProgress(trip?.id ?? null);
      setChecklistProgress(progress);
      setConfirmedTrips(trips);
      setTripCount(count);
      setFavorites(favorites);
      setIsLoading(false);
    };
    load();
  }, []);

  const handleDeleteCurrentTrip = async () => {
    if (!currentTripId || !window.confirm("진행 중인 일정을 삭제할까요? 복구할 수 없어요.")) return;
    await tripService.deleteTrip(currentTripId);
    localStorage.removeItem(`plan_${currentTripId}`);
    localStorage.removeItem(`itinerary_${currentTripId}`);
    setCurrentItinerary(null);
    setCurrentTripId(null);
    toast.success("일정이 삭제됐어요");
  };

  const handleDeleteTrip = async (tripId: string) => {
    await tripService.deleteTrip(tripId);
    setConfirmedTrips(prev => prev.filter(t => t.id !== tripId));
    toast.success("여행 내역이 삭제됐어요");
  };

  const getDDay = (startDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate + "T00:00:00");
    return Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-gray-50">

      {/* ================================================================
          데스크탑 레이아웃 (lg 이상)
          ================================================================ */}
      <div className="hidden lg:block">
        <div className="max-w-[1280px] mx-auto px-8 py-8">

          {/* 페이지 헤더 */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">여행 계획</h1>
            <p className="text-gray-500">일정 관리와 지난 여행 기록</p>
          </div>

          {isLoading ? (
            <ListSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-3 gap-6">

              {/* ── 왼쪽: 현재 여행 (2/3) ──────────────────────────── */}
              <div className="col-span-2 space-y-5">

                {/* 요약 지표 */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-blue-600" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{currentItinerary ? 1 : 0}건</p>
                      <p className="text-xs text-gray-400">예정된 여행</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Ship className="w-4 h-4 text-blue-600" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{confirmedTrips.length}건</p>
                      <p className="text-xs text-gray-400">지난 여행</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-blue-600" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{tripCount}건</p>
                      <p className="text-xs text-gray-400">AI 일정 생성</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4 text-blue-600" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{favorites.length}개</p>
                      <p className="text-xs text-gray-400">즐겨찾기 섬</p>
                    </div>
                  </div>
                </div>

                {currentItinerary ? (
                  <>
                    {/* 다가오는 여행 카드 */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-7 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-blue-200 text-sm font-medium mb-1">다가오는 여행</p>
                            <h2 className="text-2xl font-bold">{currentItinerary.title}</h2>
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const dday = getDDay(currentItinerary.startDate);
                              return dday >= 0 ? (
                                <div className="bg-white/20 px-4 py-2 rounded-full">
                                  <span className="text-sm font-bold">
                                    {dday === 0 ? "오늘 출발!" : `D-${dday}`}
                                  </span>
                                </div>
                              ) : null;
                            })()}
                            <Link
                              to={`/itinerary/${currentTripId}?edit=true`}
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <Pencil className="w-4 h-4" strokeWidth={2} />
                            </Link>
                            <button
                              onClick={handleDeleteCurrentTrip}
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500/40 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-blue-200 text-sm mb-5">
                          <MapPin className="w-4 h-4" strokeWidth={2} />
                          {currentItinerary.islands.join(", ")}
                        </div>
                        <Link
                          to={`/itinerary/${currentTripId}`}
                          className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-sm"
                        >
                          일정 전체보기
                          <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                        </Link>
                      </div>
                    </div>

                    {/* 미확정 배너 */}
                    {!currentItinerary.confirmed && (
                      <Link
                        to={`/itinerary/${currentTripId}`}
                        className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4"
                      >
                        <Info className="w-5 h-5 text-amber-600 shrink-0" strokeWidth={2} />
                        <p className="flex-1 text-sm text-amber-800">
                          일정이 아직 미확정이에요. 열어서 확정하면 홈에도 표시돼요.
                        </p>
                        <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={2} />
                      </Link>
                    )}

                    {/* 준비 현황 */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                      <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-blue-600" strokeWidth={2} />
                        준비 현황
                      </h3>
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">체크리스트 완료율</span>
                          <span className="text-sm font-bold text-blue-600">{checklistProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-700"
                            style={{ width: `${checklistProgress}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "체크리스트", path: "/checklist", icon: ListChecks },
                          { label: "경비 관리",  path: "/budget",    icon: DollarSign },
                          { label: "시간표",     path: "/schedule",  icon: Clock },
                        ].map(({ label, path, icon: Icon }) => (
                          <button
                            key={path}
                            onClick={() => navigate(path)}
                            className="flex items-center gap-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium transition-colors border border-gray-100 hover:border-blue-200"
                          >
                            <Icon className="w-4 h-4" strokeWidth={2} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* 여행 없음 상태 */
                  <div className="bg-white rounded-2xl border border-gray-100 px-8 py-8 flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                      <Sparkles className="w-7 h-7 text-blue-500" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1.5">아직 예정된 여행이 없습니다</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-5">
                      AI가 여행 스타일을 분석하여<br />맞춤형 섬 여행 일정을 추천해드립니다.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate("/create-trip")}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                      >
                        <ListChecks className="w-4 h-4" strokeWidth={2} />
                        직접 일정 만들기
                      </button>
                      <button
                        onClick={() => navigate("/create-trip")}
                        className="inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm border border-gray-200"
                      >
                        <Sparkles className="w-4 h-4" strokeWidth={2} />
                        AI 일정 생성
                      </button>
                    </div>

                    {/* AI 일정 생성 시 포함되는 정보 */}
                    <div className="w-full mt-7 pt-6 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">AI가 이렇게 만들어드려요</p>
                      <div className="grid grid-cols-5 gap-x-2 gap-y-2">
                        {["여행 일정", "배편", "관광지", "맛집", "이동 시간"].map((item) => (
                          <div key={item} className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Check className="w-3 h-3 text-blue-600 shrink-0" strokeWidth={2.5} />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 여행 정보 */}
                <div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">인천 앞바다 섬 평균 정보</h3>
                    <span className="text-xs text-gray-400">AI 추천에 활용되는 일반 통계예요</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <DollarSign className="w-4 h-4 text-blue-600" strokeWidth={2} />
                        <span className="text-xs text-gray-500">평균 여행 비용</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">15~25만원</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">교통 + 숙박 기준 · 1인</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Clock className="w-4 h-4 text-blue-600" strokeWidth={2} />
                        <span className="text-xs text-gray-500">평균 이동 시간</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">약 1시간 30분</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">인천항 출발 기준</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sun className="w-4 h-4 text-blue-600" strokeWidth={2} />
                        <span className="text-xs text-gray-500">추천 계절</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">봄 · 가을</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">쾌적하게 즐기기 좋아요</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Ship className="w-4 h-4 text-blue-600" strokeWidth={2} />
                        <span className="text-xs text-gray-500">배편 운항</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">매일 운항</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">기상 상황에 따라 변동</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 오른쪽: 사이드 패널 (1/3) ──────────────────────── */}
              <div className="space-y-5">

                {/* 새 여행 만들기 (여행이 이미 있을 때만 노출 — 없을 때는 중앙 CTA가 유일한 진입점) */}
                {currentItinerary ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
                      새 여행 계획
                    </h3>
                    <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                      AI가 여행 스타일을 분석해 최적의 섬 일정을 추천해드려요.
                    </p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mb-4">
                      {["여행 일정", "배편", "관광지", "맛집", "이동 시간"].map((item) => (
                        <div key={item} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Check className="w-3 h-3 text-blue-600 shrink-0" strokeWidth={2.5} />
                          {item}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate("/create-trip")}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <ListChecks className="w-4 h-4" strokeWidth={2} />
                      직접 일정 만들기
                    </button>
                    <button
                      onClick={() => navigate("/create-trip")}
                      className="w-full mt-2 text-gray-500 hover:text-gray-700 font-medium py-2 rounded-xl transition-colors text-sm"
                    >
                      AI 일정 생성
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" strokeWidth={2} />
                      여행 팁
                    </h3>
                    <ul className="space-y-2.5 text-xs text-gray-500 leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="text-gray-300 mt-0.5">•</span>
                        주말·공휴일은 1주일 전 미리 예약하세요
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-300 mt-0.5">•</span>
                        출발 전날 운항 여부를 꼭 확인해주세요
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-300 mt-0.5">•</span>
                        자외선 차단제, 편한 신발 챙기는 거 잊지 마세요
                      </li>
                    </ul>
                  </div>
                )}

                {/* 지난 여행 */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Ship className="w-4 h-4 text-gray-500" strokeWidth={2} />
                    지난 여행
                  </h3>
                  {confirmedTrips.length === 0 ? (
                    favorites.length > 0 ? (
                      <div>
                        <p className="text-xs text-gray-400 mb-3">다녀온 여행은 아직 없지만, 찜한 섬이 있어요</p>
                        <div className="space-y-2.5">
                          {favorites.slice(0, 3).map((fav) => (
                            <Link
                              key={fav.id}
                              to={`/island/${fav.island_id}`}
                              className="flex items-center gap-3 group"
                            >
                              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                                <IslandImage src={fav.islands?.image} alt={fav.islands?.name} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors truncate">
                                {fav.islands?.name}
                              </span>
                            </Link>
                          ))}
                        </div>
                        <Link to="/favorites" className="block text-xs text-blue-600 font-medium hover:text-blue-700 mt-3">
                          찜한 섬 전체보기 →
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Ship className="w-10 h-10 text-gray-200 mx-auto mb-2" strokeWidth={1.5} />
                        <p className="text-sm text-gray-400 mb-3">아직 지난 여행이 없어요</p>
                        <Link to="/islands" className="text-xs text-blue-600 font-medium hover:text-blue-700">
                          섬 둘러보기 →
                        </Link>
                      </div>
                    )
                  ) : (
                    <div className="space-y-3">
                      {confirmedTrips.map(trip => (
                        <div key={trip.id} className="border border-gray-100 rounded-xl p-3.5">
                          <div className="flex items-start justify-between mb-1.5">
                            <h4 className="text-sm font-semibold text-gray-900 leading-snug">{trip.title ?? "여행"}</h4>
                            <button onClick={() => handleDeleteTrip(trip.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-2 shrink-0">
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                            <MapPin className="w-3 h-3" strokeWidth={2} />
                            {(trip.islands ?? []).join(", ") || "섬 정보 없음"}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">{trip.start_date}</span>
                            <Link to={`/itinerary/${trip.id}`} className="text-xs text-blue-600 font-medium hover:text-blue-700">
                              보기 →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================
          모바일 레이아웃 (lg 미만) — 기존 코드 완전 보존
          ================================================================ */}
      <div className="lg:hidden bg-white">
        {/* Header with Background */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white overflow-hidden">
          <div
            className="absolute inset-0 opacity-20 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1633775362266-2e314af7c30f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-blue-700/80"></div>
          <div className="relative z-10">
            <h1 className="text-xl font-bold mb-1">여행 계획</h1>
            <p className="text-sm text-blue-100">일정 생성과 예약 관리</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border-b border-gray-200">
          <button
            onClick={() => setActiveTab("plan")}
            className={`flex-1 py-3 font-medium transition-colors relative ${
              activeTab === "plan" ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5" strokeWidth={2} />
              <span>일정 생성</span>
            </div>
            {activeTab === "plan" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex-1 py-3 font-medium transition-colors relative ${
              activeTab === "bookings" ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Ship className="w-5 h-5" strokeWidth={2} />
              <span>지난 여행</span>
            </div>
            {activeTab === "bookings" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>

        {/* Content */}
        <div>
          {isLoading ? (
            <div className="px-6 py-4">
              <ListSkeleton count={3} />
            </div>
          ) : activeTab === "plan" ? (
            currentItinerary ? (
              <div className="px-6 py-4 space-y-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-lg">다가오는 여행</h3>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const dday = getDDay(currentItinerary.startDate);
                          return dday >= 0 ? (
                            <div className="bg-white/20 px-3 py-1 rounded-full">
                              <span className="text-sm font-bold">
                                {dday === 0 ? "오늘 출발!" : `D-${dday}`}
                              </span>
                            </div>
                          ) : null;
                        })()}
                        <Link
                          to={`/itinerary/${currentTripId}?edit=true`}
                          className="p-1 text-white/60 hover:text-white active:scale-95 transition-all"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={2} />
                        </Link>
                        <button onClick={handleDeleteCurrentTrip} className="p-1 text-white/60 hover:text-white active:scale-95 transition-all">
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    <h2 className="text-xl font-bold mb-2">{currentItinerary.title}</h2>
                    <div className="flex items-center gap-2 text-sm text-blue-100 mb-4">
                      <MapPin className="w-4 h-4" strokeWidth={2} />
                      <span>{currentItinerary.islands.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/itinerary/${currentTripId}`}
                        className="inline-block bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold active:scale-95 transition-transform"
                      >
                        일정 전체보기
                      </Link>
                      {!currentItinerary.confirmed && (
                        <span className="bg-white/20 border border-white/50 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                          미확정
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!currentItinerary.confirmed && (
                  <Link
                    to={`/itinerary/${currentTripId}`}
                    className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4"
                  >
                    <Info className="w-5 h-5 text-amber-600" strokeWidth={2} />
                    <p className="flex-1 text-sm text-amber-800">
                      일정이 아직 미확정이에요. 열어서 확정하면 홈에도 표시돼요.
                    </p>
                    <ChevronRight className="w-4 h-4 text-amber-600" strokeWidth={2} />
                  </Link>
                )}

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-blue-600" strokeWidth={2} />
                    준비 상황
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700">체크리스트</span>
                        <span className="text-sm font-semibold text-blue-600">{checklistProgress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${checklistProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button onClick={() => navigate("/checklist")} className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium active:scale-95 transition-transform">체크리스트</button>
                      <button onClick={() => navigate("/budget")} className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium active:scale-95 transition-transform">경비관리</button>
                      <button onClick={() => navigate("/schedule")} className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium active:scale-95 transition-transform">시간표</button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/create-trip")}
                  className="w-full border-2 border-dashed border-gray-300 text-gray-600 py-4 rounded-xl font-semibold active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" strokeWidth={2} />
                  새 여행 계획 만들기
                </button>
              </div>
            ) : (
              <div className="px-6 py-6 flex flex-col items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-10 h-10 text-blue-600" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">AI 맞춤 일정 생성</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    여행 날짜와 스타일을 선택하면<br />최적의 일정을 자동으로 만들어드려요
                  </p>
                  <button
                    onClick={() => navigate("/create-trip")}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" strokeWidth={2} />
                    일정 만들기 시작
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="px-6 py-4">
              {confirmedTrips.length === 0 ? (
                <div className="text-center py-12">
                  <Ship className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">지난 여행이 없어요</h3>
                  <p className="text-sm text-gray-600">여행을 다녀오면 여기에 기록돼요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {confirmedTrips.map(trip => (
                    <div key={trip.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{trip.title ?? "여행"}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" strokeWidth={2} />
                            {(trip.islands ?? []).join(", ") || "섬 정보 없음"}
                          </p>
                        </div>
                        <button onClick={() => handleDeleteTrip(trip.id)} className="p-1 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                        <span>{trip.start_date} ~ {trip.end_date}</span>
                        <Link to={`/itinerary/${trip.id}`} className="text-blue-600 font-medium">일정보기</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
