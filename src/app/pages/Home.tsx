import { Link } from "react-router";
import {
  Ship, MapPin, Calendar, Sparkles, Shield, Heart,
  Bell, Camera, Users, DollarSign, Cloud, Waves, ArrowRight, MessageCircle, ThumbsUp, Eye,
} from "lucide-react";
import { useState, useEffect } from "react";
import { WeatherWidget, WeeklyForecast } from "../components/WeatherWidget";
import { fetchIncheonWeather, type WeatherResult } from "../../lib/weatherService";
import { tripService } from "../../lib/tripService";
import { useAuth } from "../../lib/useAuth";
import { getHomeFerryStatus, type FerryRouteStatus } from "../../lib/api/ferry";
import { getAllIslandsDemand } from "../../lib/api/demandIntensity";
import { getPopularIslands, getIslands, type Island } from "../../lib/api/islands";
import { getRecommendedIslands, getTravelStyleMessage } from "../utils/islandRecommendations";
import { communityService } from "../../lib/communityService";
import { recentlyViewedService, type RecentIsland } from "../../lib/recentlyViewed";
import { IslandImage } from "../components/IslandImage";
import { OceanScene } from "../components/OceanScene";

// 계절에 맞춰 "오늘의 AI 추천" 스타일을 결정 — 실제 취향 데이터가 쌓이기 전까지의 합리적 기본값
function seasonalTravelStyle(): string {
  const month = new Date().getMonth() + 1;
  if (month <= 2 || month === 12) return "힐링";
  if (month <= 5) return "자연관광";
  if (month <= 8) return "액티비티";
  return "맛집탐방";
}

// 실제 파고(m)를 장식용 파도의 시각적 높이(px)에 반영 — 바다가 거칠수록 파도가 커 보이도록.
// 데이터가 없으면 잔잔한 기본값(0.5m)으로 폴백하고, 과하게 커지지 않도록 base의 1.9배로 clamp.
function oceanWaveHeight(base: number, realWaveHeight?: number) {
  const seaState = realWaveHeight ?? 0.5;
  return Math.round(Math.min(base * 1.9, base + seaState * 18));
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function Home() {
  const { displayName } = useAuth();

  const [confirmedItinerary, setConfirmedItinerary] = useState<any>(null);
  const [confirmedTripId,    setConfirmedTripId]    = useState<string | null>(null);
  const [weather,            setWeather]            = useState<WeatherResult | null>(null);
  const [ferryStatus,        setFerryStatus]        = useState<FerryRouteStatus[]>([]);
  const [ferryError,         setFerryError]          = useState(false);
  const [showFerryModal,     setShowFerryModal]     = useState(false);
  const [unreadNotifications] = useState(0);
  const [demandLevels,       setDemandLevels]       = useState<Record<string, 'low' | 'medium' | 'high'>>({});
  const [popularIslands,     setPopularIslands]     = useState<Island[]>([]);
  const [popularPosts,       setPopularPosts]       = useState<any[]>([]);
  const [recentIslands,      setRecentIslands]      = useState<RecentIsland[]>([]);
  const [allIslands,         setAllIslands]         = useState<Island[]>([]);

  useEffect(() => {
    tripService.getLatestConfirmedTrip().then((trip) => {
      if (trip) {
        setConfirmedItinerary({
          ...trip,
          startDate: trip.start_date,
          islands:   trip.islands ?? [],
          days:      trip.plan?.days ?? trip.days ?? [],
        });
        setConfirmedTripId(trip.id);
      }
    });

    fetchIncheonWeather().then(setWeather);
    getHomeFerryStatus().then(setFerryStatus).catch(() => setFerryError(true));
    getAllIslandsDemand().then(setDemandLevels).catch(() => {});
    getPopularIslands(4).then(setPopularIslands).catch(() => {});
    getIslands().then(setAllIslands).catch(() => {});
    communityService.getPosts("feed")
      .then((posts) => setPopularPosts(
        [...posts].sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0)).slice(0, 3)
      ))
      .catch(() => {});
    setRecentIslands(recentlyViewedService.getRecent(4));
  }, []);

  const getDDay = (startDate: string) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(startDate + "T00:00:00");
    return Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDDayMessage = (dday: number) => {
    if (dday === 0) return "오늘 출발이에요! 🎉";
    if (dday === 1) return "내일 떠나요! 설레네요 ✨";
    if (dday <= 3)  return "곧 출발이에요! 준비 다 되셨나요? 🌊";
    if (dday <= 7)  return "설레는 여행이 다가와요 ⛴️";
    return "여행 준비 잘 하고 계신가요? 🏝️";
  };

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════════════════════════════════
          데스크탑 레이아웃 (lg 이상)
          ══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        <DesktopDashboard
          displayName={displayName}
          weather={weather}
          ferryStatus={ferryStatus}
          ferryError={ferryError}
          confirmedItinerary={confirmedItinerary}
          getDDay={getDDay}
          demandLevels={demandLevels}
          popularIslands={popularIslands}
          popularPosts={popularPosts}
          recentIslands={recentIslands}
          allIslands={allIslands}
        />
      </div>
      {/* ── 데스크탑 레이아웃 끝 ──────────────────────────────────────── */}


      {/* ══════════════════════════════════════════════════════════════
          모바일 레이아웃 (lg 미만) — 로그인 상태별 화면 분리
          ══════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        <section className="relative bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 pt-10 pb-14 overflow-hidden">
          <div
            className="absolute inset-0 opacity-30 bg-cover bg-center"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1700621497504-d241a3803bbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-blue-700/80" />
          <OceanScene waveColor="#ffffff" waveHeight={oceanWaveHeight(28, weather?.current.waveHeight)} />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">인천 섬 여행</h1>
              <Link to="/notifications" className="relative active:scale-95 transition-transform">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Bell className="w-5 h-5 text-blue-600" strokeWidth={2} />
                </div>
                {unreadNotifications > 0 && (
                  <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
              </Link>
            </div>

            {confirmedItinerary ? (
              <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Ship className="w-5 h-5 text-white" strokeWidth={2} />
                    <h3 className="font-bold text-white">오늘의 여행</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const dday = getDDay(confirmedItinerary.startDate);
                      return dday >= 0 ? (
                        <div className="bg-white/20 px-3 py-1 rounded-full">
                          <span className="text-sm font-bold text-white">{dday === 0 ? "D-Day" : `D-${dday}`}</span>
                        </div>
                      ) : null;
                    })()}
                    <Link to={`/itinerary/${confirmedTripId}`} className="text-xs text-blue-100 underline">전체보기</Link>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-white mb-1">{confirmedItinerary.title}</h4>
                <p className="text-sm text-blue-100 mb-3">{getDDayMessage(getDDay(confirmedItinerary.startDate))}</p>
                <div className="space-y-1.5">
                  {confirmedItinerary.days[0]?.activities?.slice(0, 3).map((activity: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-blue-50">
                      <span className="text-blue-200">{activity.time}</span>
                      <span className="flex-1">{activity.title}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/20">
                  <Ship className="w-4 h-4 text-blue-200" strokeWidth={2} />
                  <span className="text-sm text-blue-100">{confirmedItinerary.departurePort || "인천항"}</span>
                  <span className="text-blue-200">→</span>
                  <MapPin className="w-4 h-4 text-blue-200" strokeWidth={2} />
                  <span className="text-sm text-blue-100">{confirmedItinerary.islands.join(", ")}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl p-4 text-center">
                  <Sparkles className="w-12 h-12 text-white mx-auto mb-2" strokeWidth={2} />
                  <p className="text-white font-semibold mb-1">아직 계획이 없으신가요?</p>
                  <p className="text-sm text-blue-100 mb-3">여객선 정보 기반으로 자동 일정을 생성해드려요</p>
                </div>
                <Link
                  to="/create-trip"
                  className="flex items-center justify-center gap-2 bg-white text-blue-600 px-6 py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform hover:shadow-xl"
                >
                  <Calendar className="w-5 h-5" strokeWidth={2} />
                  여행 계획 시작하기
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="px-6 py-4 bg-white">
          <div className="grid grid-cols-4 gap-2">
            <Link to="/experiences"><FeatureCardMobile icon={<Camera className="w-5 h-5 text-blue-600" strokeWidth={2} />} title="체험" /></Link>
            <Link to="/community"><FeatureCardMobile icon={<Users className="w-5 h-5 text-blue-600" strokeWidth={2} />} title="리뷰" /></Link>
            <Link to="/checklist"><FeatureCardMobile icon={<Shield className="w-5 h-5 text-blue-600" strokeWidth={2} />} title="체크리스트" /></Link>
            <Link to="/budget"><FeatureCardMobile icon={<DollarSign className="w-5 h-5 text-blue-600" strokeWidth={2} />} title="경비관리" /></Link>
          </div>
        </section>

        <section className="px-6 py-4 bg-gray-50 space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">실시간 운항 현황</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <button onClick={() => setShowFerryModal(true)} className="text-xs text-blue-600 font-medium">전체보기</button>
              </div>
            </div>
            <div className="space-y-2">
              {(ferryStatus.length > 0
                ? ferryStatus.slice(0, 3)
                : ["백령도", "덕적도", "영흥도"].map((name) => ({ islandName: name, status: "확인중" }))
              ).map((s) => (
                <MobileStatusItem key={s.islandName} island={s.islandName} status={s.status} />
              ))}
            </div>
          </div>

          <WeatherWidget
            data={{
              island:      "인천 앞바다",
              temp:        weather?.current.temp        ?? 22,
              condition:   weather?.current.condition   ?? "맑음",
              waveHeight:  weather?.current.waveHeight  ?? 0.5,
              windSpeed:   weather?.current.windSpeed   ?? 3,
              ferryStatus: weather?.current.ferryStatus ?? "정상",
            }}
          />
          <WeeklyForecast forecast={weather?.forecast ?? []} />
        </section>

        {showFerryModal && (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowFerryModal(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative w-full bg-white rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">전체 운항 현황</h3>
                <button onClick={() => setShowFerryModal(false)} className="text-gray-400 text-2xl leading-none">&times;</button>
              </div>
              <div className="space-y-3">
                {ferryStatus.map((s) => (
                  <div key={s.islandName} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-800 font-medium">{s.islandName}</span>
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                      s.status === "결항" ? "bg-red-100 text-red-700" :
                      s.status === "운항없음" ? "bg-gray-100 text-gray-400" :
                      "bg-green-100 text-green-700"}`}>
                      {s.status === "정상" ? "정상 운항" : s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* ── 모바일 레이아웃 끝 ──────────────────────────────────────────── */}
    </div>
  );
}

// ─── Desktop Dashboard (로그인 후) ────────────────────────────────────────────

interface DashboardProps {
  displayName: string;
  weather: WeatherResult | null;
  ferryStatus: FerryRouteStatus[];
  ferryError?: boolean;
  confirmedItinerary: any;
  getDDay: (startDate: string) => number;
  demandLevels?: Record<string, 'low' | 'medium' | 'high'>;
  popularIslands: Island[];
  popularPosts: any[];
  recentIslands: RecentIsland[];
  allIslands: Island[];
}

function DesktopDashboard({
  displayName, weather, ferryStatus, ferryError = false, confirmedItinerary, getDDay, demandLevels = {}, popularIslands, popularPosts, recentIslands, allIslands,
}: DashboardProps) {
  const [savedIslands, setSavedIslands] = useState<Set<string>>(new Set());
  const aiStyle = seasonalTravelStyle();
  const aiRecommendedIslands = getRecommendedIslands(aiStyle);
  const islandByName = new Map(allIslands.map((i) => [i.name, i]));

  const normalCount = ferryStatus.filter((s) => s.status === "정상").length;
  const ferryText =
    ferryError                        ? "확인 불가" :
    ferryStatus.length === 0          ? "로딩 중..." :
    normalCount === ferryStatus.length ? "전 노선 정상 운항" :
                                         `${normalCount}/${ferryStatus.length}개 노선 정상`;

  const today = new Date();
  const dateStr = today.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
  const dday = confirmedItinerary ? getDDay(confirmedItinerary.startDate) : null;

  const toggleSave = (id: string) =>
    setSavedIslands((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  return (
    <div className="bg-[#f5f6f8] min-h-screen">

      {/* ── Welcome Banner ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* 배경 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a56e8] via-blue-600 to-blue-500" />
        {/* 섬 이미지 은은하게 — 배경을 뷰포트에 고정해 스크롤 시 콘텐츠보다 느리게 움직이는 패럴랙스 효과 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80')",
            backgroundAttachment: "fixed",
            opacity: 0.11,
          }}
        />
        {/* 장식 원형 */}
        <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/[0.05] rounded-full" />
        <div className="absolute top-6 right-40 w-28 h-28 bg-white/[0.05] rounded-full" />
        {/* 배/물고기/물방울 + 하단 물결 애니메이션 */}
        <OceanScene waveColor="#f5f6f8" waveHeight={oceanWaveHeight(56, weather?.current.waveHeight)} />

        <div className="relative z-10 max-w-[1360px] mx-auto px-8 pt-14 pb-20 flex items-center justify-between">
          {/* 좌: 인사말 */}
          <div>
            <p className="text-blue-200 text-base font-medium mb-2">{dateStr}</p>
            <h1 className="text-[40px] font-bold text-white tracking-tight leading-tight mb-3">
              안녕하세요, {displayName}님
            </h1>
            <p className="text-blue-200 text-base">오늘도 좋은 섬 여행 되세요 🏝️</p>
          </div>

          {/* 우: 날씨 브리핑 글라스 카드 */}
          {weather && (
            <div className="bg-white/[0.12] backdrop-blur-sm border border-white/[0.22] rounded-2xl px-7 py-6 min-w-[260px]">
              <p className="text-blue-200 text-xs font-medium mb-3 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5" strokeWidth={2} />
                인천 앞바다 현재 날씨
              </p>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-[44px] font-bold text-white leading-none">{weather.current.temp}°</span>
                <span className="text-blue-100 text-base font-medium mb-1">{weather.current.condition}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-blue-200 pt-3 border-t border-white/[0.18]">
                <span>파고 {weather.current.waveHeight}m</span>
                <span className="text-white/20">·</span>
                <span>바람 {weather.current.windSpeed}m/s</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div className="max-w-[1360px] mx-auto px-8">

        {/* Status Cards — 배너 애니메이션을 너무 가리지 않도록 -mt-6만 겹침 */}
        <div className="grid grid-cols-4 gap-4 -mt-6 mb-6 relative z-10">

          {/* 운항 현황 */}
          <Link to="/schedule"
            className="bg-white rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.09)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.13)] transition-all duration-200 hover:-translate-y-0.5 group border border-gray-100/60"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                <Ship className="w-5 h-5 text-blue-600" strokeWidth={2} />
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  ferryError ? "bg-gray-300" :
                  ferryStatus.length === 0 ? "bg-gray-300" :
                  normalCount === ferryStatus.length ? "bg-green-500 animate-pulse" : "bg-orange-400"
                }`} />
                <span className="text-[11px] text-gray-400 font-medium">실시간</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 font-semibold mb-1.5 uppercase tracking-wide">운항 현황</p>
            <p className="text-[19px] font-bold text-gray-900 leading-tight">{ferryText}</p>
            <p className="text-xs text-gray-400 mt-2">오늘 전체 노선 기준</p>
          </Link>

          {/* 날씨 */}
          <div className="bg-white rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.09)] border border-gray-100/60">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center">
                <Cloud className="w-5 h-5 text-orange-500" strokeWidth={2} />
              </div>
            </div>
            <p className="text-[11px] text-gray-400 font-semibold mb-1.5 uppercase tracking-wide">인천 앞바다</p>
            <p className="text-[19px] font-bold text-gray-900 leading-tight">
              {weather ? `${weather.current.temp}°C` : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {weather ? `${weather.current.condition} · 파고 ${weather.current.waveHeight}m` : "날씨 정보 로딩 중"}
            </p>
          </div>

          {/* 다음 여행 */}
          <div className="bg-white rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.09)] border border-gray-100/60">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" strokeWidth={2} />
              </div>
              {dday !== null && dday >= 0 && (
                <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full">
                  {dday === 0 ? "D-Day" : `D-${dday}`}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 font-semibold mb-1.5 uppercase tracking-wide">다음 여행</p>
            <p className="text-[19px] font-bold text-gray-900 leading-tight">
              {confirmedItinerary ? (confirmedItinerary.islands?.join(", ") || "일정 확인") : "계획 없음"}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {confirmedItinerary ? confirmedItinerary.startDate : "AI 플래너로 시작해보세요"}
            </p>
          </div>

          {/* 지도 바로가기 CTA */}
          <Link to="/islands?view=map"
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 shadow-[0_4px_24px_rgba(37,99,235,0.32)] hover:shadow-[0_8px_32px_rgba(37,99,235,0.44)] transition-all duration-200 hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
            </div>
            <p className="text-[11px] text-blue-200 font-semibold mb-1.5 uppercase tracking-wide">지금 바로</p>
            <p className="text-[19px] font-bold text-white leading-tight">지도 보기</p>
            <p className="text-xs text-blue-200 mt-2 flex items-center gap-1">
              섬 위치 한눈에 보기
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </p>
          </Link>
        </div>

        {/* ── 1단(추천): AI 추천 섬 + 인기 섬 ────────────── */}
        <div className="grid grid-cols-2 gap-5 mb-6">

          {/* 좌: 오늘의 AI 추천 */}
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" strokeWidth={2} />
              오늘의 AI 추천
            </h2>
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-gray-100/60 h-[calc(100%-2rem)]">
              <p className="text-sm text-gray-500 mb-4">
                {getTravelStyleMessage(aiStyle)} · <span className="font-medium text-blue-600">{aiStyle}</span> 스타일 섬을 모아봤어요
              </p>
              <div className="space-y-3">
                {aiRecommendedIslands.map((rec, i) => {
                  const real = islandByName.get(rec.name);
                  const content = (
                    <>
                      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-blue-600">
                        {i + 1}
                      </div>
                      <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                        <IslandImage src={real?.image ?? rec.image} alt={rec.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{rec.name}</p>
                        <p className="text-xs text-gray-500 truncate">{rec.reason}</p>
                      </div>
                    </>
                  );
                  return real ? (
                    <Link key={rec.id} to={`/island/${real.id}`} className="flex items-center gap-3 group">
                      {content}
                    </Link>
                  ) : (
                    <div key={rec.id} className="flex items-center gap-3 opacity-80">
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 우: 인기 섬 추천 — Airbnb 스타일 3열 이미지 카드 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-gray-900">인기 섬 추천</h2>
              <Link to="/islands"
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                전체 보기 <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {popularIslands.slice(0, 3).map((island) => (
                <div key={island.id} className="group relative">
                  {/* 찜 버튼 */}
                  <button
                    onClick={() => toggleSave(island.id)}
                    className="absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-all"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${savedIslands.has(island.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                      strokeWidth={2}
                    />
                  </button>
                  {/* 수요강도 배지 */}
                  {demandLevels[island.id] === 'high' && (
                    <span className="absolute top-2.5 left-2.5 z-10 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      🔥 인기
                    </span>
                  )}
                  {demandLevels[island.id] === 'low' && (
                    <span className="absolute top-2.5 left-2.5 z-10 text-[9px] font-bold bg-sky-500 text-white px-1.5 py-0.5 rounded-full">
                      💤 한산
                    </span>
                  )}
                  <Link to={`/island/${island.id}`} className="block">
                    {/* 이미지 */}
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 relative bg-gray-100">
                      <IslandImage src={island.image} alt={island.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* 텍스트 */}
                    <h3 className="text-[15px] font-semibold text-gray-900 mb-0.5">{island.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{island.ports.join(", ")} 출발</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 flex-wrap">
                        {island.features.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 ml-1">{island.ferry_time}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 2단(실시간 관광정보): 운항 현황 + 주간 날씨 ────────────── */}
        <div className="grid grid-cols-2 gap-5 mb-6">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 mb-3">실시간 운항 현황</h2>
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-gray-100/60">
              {ferryStatus.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">{ferryError ? "운항 정보를 불러올 수 없어요" : "불러오는 중..."}</p>
              ) : (
                <div className="space-y-3">
                  {ferryStatus.slice(0, 4).map((s) => (
                    <div key={s.islandName} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">{s.islandName}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        s.status === "결항" ? "bg-red-50 text-red-600" :
                        s.status === "운항없음" ? "bg-gray-100 text-gray-400" :
                        "bg-green-50 text-green-700"}`}>
                        {s.status === "정상" ? "정상 운항" : s.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 mb-3">주간 날씨</h2>
            <WeeklyForecast forecast={weather?.forecast ?? []} />
          </div>
        </div>

        {/* ── 3단(탐색): 최근 본 섬 + 커뮤니티 인기글 ────────────── */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 mb-3 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-gray-500" strokeWidth={2} />
              최근 본 섬
            </h2>
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-gray-100/60">
              {recentIslands.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">최근 둘러본 섬이 여기에 표시돼요</p>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {recentIslands.map((ri) => (
                    <Link key={ri.id} to={`/island/${ri.id}`} className="group text-center">
                      <div className="aspect-square rounded-xl overflow-hidden mb-1.5 bg-gray-100">
                        <IslandImage src={ri.image} alt={ri.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <p className="text-xs font-medium text-gray-700 truncate">{ri.name}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-gray-900 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-gray-500" strokeWidth={2} />
                커뮤니티 인기글
              </h2>
              <Link to="/community"
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                전체 보기 <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </Link>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-gray-100/60">
              {popularPosts.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">아직 커뮤니티 글이 없어요</p>
              ) : (
                <div className="space-y-3 divide-y divide-gray-50">
                  {popularPosts.map((post) => (
                    <Link key={post.id} to="/community" className="flex items-center justify-between gap-3 pt-3 first:pt-0 group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {post.title && post.title !== post.content ? post.title : post.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{post.author_name ?? "여행자"}{post.island_name ? ` · ${post.island_name}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-xs text-gray-400">
                        <span className="flex items-center gap-0.5"><ThumbsUp className="w-3 h-3" strokeWidth={2} />{post.likes_count ?? 0}</span>
                        <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" strokeWidth={2} />{post.comments_count ?? 0}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── 모바일 전용 보조 컴포넌트 ───────────────────────────────────────────────

function MobileStatusItem({ island, status }: { island: string; status: string }) {
  const color =
    status === "결항"    ? "text-red-600"   :
    status === "운항없음" ? "text-gray-400"  :
    status === "확인중"  ? "text-gray-400"  : "text-green-600";
  const label =
    status === "정상"    ? "정상 운항" :
    status === "결항"    ? "결항"      :
    status === "운항없음" ? "운항없음"  : "확인중...";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-700">{island}</span>
      <span className={`font-medium ${color}`}>{label}</span>
    </div>
  );
}

function FeatureCardMobile({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shadow-sm border border-gray-100">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-700 text-center leading-tight">{title}</span>
    </div>
  );
}
