import { Link, useNavigate } from "react-router";
import {
  Ship, MapPin, Calendar, Sparkles, Shield, ChevronRight, Star, Heart,
  Bell, Camera, Users, DollarSign, Search, Cloud, Waves, ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { WeatherWidget, WeeklyForecast } from "../components/WeatherWidget";
import { fetchIncheonWeather, type WeatherResult } from "../../lib/weatherService";
import { tripService } from "../../lib/tripService";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/useAuth";
import { getHomeFerryStatus, type FerryRouteStatus } from "../../lib/api/ferry";
import { getAllIslandsDemand } from "../../lib/api/demandIntensity";

// ─── Landing 전용 정적 데이터 ──────────────────────────────────────────────────

const DEPARTURE_PORTS = [
  { value: "incheon-yenan",    label: "인천 연안부두" },
  { value: "incheon-terminal", label: "인천항 국제여객터미널" },
  { value: "daebudo",          label: "대부도 방아머리" },
  { value: "yeonghung-port",   label: "영흥도 진두항" },
  { value: "jamjin",           label: "잠진도 선착장" },
];

const DESTINATIONS = [
  { value: "baengnyeong", label: "백령도" },
  { value: "deokjeok",    label: "덕적도" },
  { value: "jawol",       label: "자월도" },
  { value: "muui",        label: "무의도" },
  { value: "yeonghung",   label: "영흥도" },
  { value: "yeonpyeong",  label: "연평도" },
  { value: "daecheong",   label: "대청도" },
  { value: "guleop",      label: "굴업도" },
  { value: "seungbong",   label: "승봉도" },
  { value: "pungdo",      label: "풍도" },
];

const FEATURE_ITEMS = [
  {
    Icon: Ship, iconColor: "#1664F5", bgColor: "#EEF4FF",
    title: "실시간 운항 정보",
    desc:  "출항 시간, 운항 여부, 잔여 좌석 현황을 실시간으로 확인하세요",
    cta:   "운항 조회하기", to: "/schedule", badge: null,
  },
  {
    Icon: Cloud, iconColor: "#F97316", bgColor: "#FFF1E6",
    title: "날씨 & 기상 정보",
    desc:  "출발 전 기상 상황을 미리 파악하고 안전한 여행을 준비하세요",
    cta:   "날씨 확인하기", to: "/", badge: null,
  },
  {
    Icon: Waves, iconColor: "#0B9488", bgColor: "#CCFBF1",
    title: "조석 예보",
    desc:  "낚시·갯벌 체험을 위한 물때 정보를 미리 확인하세요",
    cta:   "물때 보기", to: "/", badge: null,
  },
  {
    Icon: Sparkles, iconColor: "#7C3AED", bgColor: "#F5F3FF",
    title: "AI 여행 플래너",
    desc:  "취향 맞춤 일정을 AI가 자동으로 생성해드립니다",
    cta:   "AI 플래너 시작", to: "/create-trip", badge: "AI",
  },
] as const;

// ─── 공유 데이터 ───────────────────────────────────────────────────────────────

const POPULAR_ISLANDS = [
  {
    id: "deokjeok", name: "덕적도", subtitle: "서해 최고의 비경",
    route: "인천 연안부두 출발", travelTime: "약 2시간 20분",
    rating: 4.8, reviews: 234, tags: ["해수욕", "낚시", "캠핑"],
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    to: "/island/deokjeok",
  },
  {
    id: "jawol", name: "자월도", subtitle: "달빛처럼 고요한 섬",
    route: "인천 연안부두 출발", travelTime: "약 1시간 50분",
    rating: 4.6, reviews: 128, tags: ["캠핑", "일몰", "산책"],
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
    to: "/island/jawol",
  },
  {
    id: "muui", name: "무의도", subtitle: "수도권 가장 가까운 해수욕장",
    route: "잠진도 선착장 출발", travelTime: "약 5분",
    rating: 4.9, reviews: 412, tags: ["해수욕", "갯벌", "등산"],
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80",
    to: "/island/muui",
  },
  {
    id: "yeonghung", name: "영흥도", subtitle: "드라이브와 해산물의 섬",
    route: "대부도 방아머리 출발", travelTime: "약 15분",
    rating: 4.7, reviews: 318, tags: ["드라이브", "해산물", "펜션"],
    image: "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=800&q=80",
    to: "/island/yeonghung",
  },
];

// ─── Dashboard Mock 데이터 (TODO: API/Supabase 데이터로 교체) ─────────────────

const AI_RECOMMENDATION = {
  island: "덕적도",
  reason: "이번 주말 파고 0.5m 이하, 맑음 예보로 해수욕하기 완벽한 날씨예요",
  tags:   ["해수욕", "낚시", "캠핑"],
  image:  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  to:     "/island/deokjeok",
} as const;

const QUICK_SERVICES = [
  { label: "배편 조회", Icon: Ship,     to: "/schedule",    iconColor: "#1664F5", bg: "#EEF4FF" },
  { label: "AI 플래너", Icon: Sparkles, to: "/create-trip", iconColor: "#7C3AED", bg: "#F5F3FF" },
  { label: "지도",      Icon: MapPin,   to: "/map",         iconColor: "#0B9488", bg: "#CCFBF1" },
  { label: "커뮤니티",  Icon: Users,    to: "/community",   iconColor: "#F97316", bg: "#FFF1E6" },
  { label: "날씨·물때", Icon: Cloud,    to: "/",            iconColor: "#0284C7", bg: "#E0F2FE" },
  { label: "여행 계획", Icon: Calendar, to: "/travel",      iconColor: "#DB2777", bg: "#FCE7F3" },
] as const;

// ─── 타입 ─────────────────────────────────────────────────────────────────────

interface ReviewData {
  id: string; author: string; location: string;
  rating: number; preview: string; image: string; likes: number;
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function Home() {
  const { user, displayName } = useAuth();
  const navigate = useNavigate();

  const [confirmedItinerary, setConfirmedItinerary] = useState<any>(null);
  const [confirmedTripId,    setConfirmedTripId]    = useState<string | null>(null);
  const [weather,            setWeather]            = useState<WeatherResult | null>(null);
  const [popularReviews,     setPopularReviews]     = useState<ReviewData[]>([]);
  const [ferryStatus,        setFerryStatus]        = useState<FerryRouteStatus[]>([]);
  const [showFerryModal,     setShowFerryModal]     = useState(false);
  const [unreadNotifications] = useState(0);
  const [demandLevels,       setDemandLevels]       = useState<Record<string, 'low' | 'medium' | 'high'>>({});

  // Landing 전용 상태
  const [searchForm,   setSearchForm]   = useState({ departurePort: "", destination: "", date: "" });
  const [savedIslands, setSavedIslands] = useState<Set<string>>(new Set());
  const [openField,    setOpenField]    = useState<"departure" | "destination" | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node))
        setOpenField(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    getHomeFerryStatus().then(setFerryStatus).catch(() => {});
    getAllIslandsDemand().then(setDemandLevels).catch(() => {});

    supabase
      .from("reviews")
      .select("id, rating, content, images, likes_count, profiles(nickname), islands(name, image)")
      .order("likes_count", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) {
          setPopularReviews(
            data.map((r: any) => ({
              id:       r.id,
              author:   r.profiles?.nickname ?? "여행자",
              location: r.islands?.name      ?? "",
              rating:   r.rating,
              preview:  r.content            ?? "",
              image:    r.images?.[0] ?? r.islands?.image ?? "",
              likes:    r.likes_count,
            }))
          );
        }
      });
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

  const handleSearch    = () => navigate("/schedule",    { state: searchForm });
  const handleAIPlanner = () => navigate("/create-trip", { state: searchForm });

  const toggleSave = (id: string) =>
    setSavedIslands((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const normalCount    = ferryStatus.filter((s) => s.status === "정상").length;
  const ferryStripText =
    ferryStatus.length === 0          ? "운항 정보 로딩 중" :
    normalCount === ferryStatus.length ? "전 노선 정상 운항" :
                                         `${normalCount}/${ferryStatus.length}개 노선 정상`;

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════════════════════════════════
          데스크탑 레이아웃 (lg 이상)
          ══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        {user ? (
          /* ── 로그인 후: Dashboard ─────────────────────────────────── */
          <DesktopDashboard
            displayName={displayName}
            weather={weather}
            ferryStatus={ferryStatus}
            confirmedItinerary={confirmedItinerary}
            confirmedTripId={confirmedTripId}
            getDDay={getDDay}
            getDDayMessage={getDDayMessage}
            demandLevels={demandLevels}
          />
        ) : (
          /* ── 로그인 전: Landing (기존 코드 완전 유지) ─────────────── */
          <>
            {/* 히어로 섹션 */}
            <section className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1700621497504-d241a3803bbd?auto=format&fit=crop&w=1920&q=80')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black/60" />

              <div className="relative z-10 max-w-[1280px] mx-auto w-full px-8 pb-20 pt-16">
                <div className="mb-10">
                  <p className="text-sm font-medium text-white/55 mb-4 tracking-widest uppercase">
                    서해 인천 섬 여행 플랫폼
                  </p>
                  <h1
                    className="text-[68px] font-bold text-white leading-[1.05] tracking-tight mb-5"
                    style={{ textShadow: "0 2px 24px rgba(0,0,0,0.45)" }}
                  >
                    인천의 섬으로<br />떠나는 여행
                  </h1>
                  <p className="text-[17px] text-white/70 font-normal leading-relaxed">
                    배편 예약부터 AI 일정까지 — 섬 여행의 모든 것
                  </p>
                </div>

                <div ref={searchBarRef} className="relative max-w-[840px]">
                  <div className="flex items-stretch bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl divide-x divide-gray-200">
                    {/* 출발 항구 */}
                    <div className="relative flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setOpenField(openField === "departure" ? null : "departure")}
                        className={`w-full h-full text-left px-6 py-5 rounded-l-2xl transition-colors ${openField === "departure" ? "bg-gray-50" : "hover:bg-gray-50"}`}
                      >
                        <div className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">출발 항구</div>
                        <div className={`text-[15px] font-medium truncate ${searchForm.departurePort ? "text-gray-900" : "text-gray-400"}`}>
                          {DEPARTURE_PORTS.find(p => p.value === searchForm.departurePort)?.label ?? "항구 선택"}
                        </div>
                      </button>
                      {openField === "departure" && (
                        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100] w-64">
                          {DEPARTURE_PORTS.map(p => (
                            <button
                              key={p.value} type="button"
                              onClick={() => { setSearchForm(f => ({ ...f, departurePort: p.value })); setOpenField(null); }}
                              className={`w-full text-left px-5 py-3 text-sm hover:bg-gray-50 transition-colors ${searchForm.departurePort === p.value ? "text-blue-600 font-semibold bg-blue-50" : "text-gray-700"}`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 목적지 섬 */}
                    <div className="relative flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setOpenField(openField === "destination" ? null : "destination")}
                        className={`w-full h-full text-left px-6 py-5 transition-colors ${openField === "destination" ? "bg-gray-50" : "hover:bg-gray-50"}`}
                      >
                        <div className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">목적지 섬</div>
                        <div className={`text-[15px] font-medium truncate ${searchForm.destination ? "text-gray-900" : "text-gray-400"}`}>
                          {DESTINATIONS.find(d => d.value === searchForm.destination)?.label ?? "섬 선택"}
                        </div>
                      </button>
                      {openField === "destination" && (
                        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100] w-64 max-h-72 overflow-y-auto">
                          {DESTINATIONS.map(d => (
                            <button
                              key={d.value} type="button"
                              onClick={() => { setSearchForm(f => ({ ...f, destination: d.value })); setOpenField(null); }}
                              className={`w-full text-left px-5 py-3 text-sm hover:bg-gray-50 transition-colors ${searchForm.destination === d.value ? "text-blue-600 font-semibold bg-blue-50" : "text-gray-700"}`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 여행 날짜 */}
                    <div className="flex-1 min-w-0 px-6 py-5 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wide">여행 날짜</div>
                      <input
                        type="date" value={searchForm.date}
                        onChange={(e) => setSearchForm(f => ({ ...f, date: e.target.value }))}
                        min={new Date().toISOString().split("T")[0]}
                        className="bg-transparent text-[15px] font-medium text-gray-900 focus:outline-none cursor-pointer w-full"
                        onClick={() => setOpenField(null)}
                      />
                    </div>

                    {/* 검색 버튼 */}
                    <div className="flex items-center px-3">
                      <button
                        type="button" onClick={handleSearch}
                        disabled={!searchForm.departurePort || !searchForm.destination}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold px-7 py-4 rounded-xl transition-colors whitespace-nowrap"
                      >
                        <Search className="w-4 h-4" strokeWidth={2.5} />
                        검색
                      </button>
                    </div>
                  </div>

                  <button
                    type="button" onClick={handleAIPlanner}
                    className="mt-4 flex items-center gap-2 text-white/60 hover:text-white/90 text-sm font-medium transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-purple-300" strokeWidth={2} />
                    AI가 나에게 맞는 일정을 자동으로 만들어드려요
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90" strokeWidth={2} />
                  </button>
                </div>
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
                <ChevronDown className="w-6 h-6 text-white/60" strokeWidth={2} />
              </div>
            </section>

            {/* 실시간 데이터 스트립 */}
            <section className="bg-white border-b border-gray-200">
              <div className="max-w-[1280px] mx-auto px-8 py-3">
                <div className="flex items-center gap-10 flex-wrap">
                  <StripItem Icon={Ship}     iconColor="text-blue-600"   label={ferryStripText} sub="오늘 운항 현황"
                    dot={ferryStatus.length === 0 ? "gray" : normalCount === ferryStatus.length ? "green" : "orange"} />
                  <StripItem Icon={Cloud}    iconColor="text-orange-500" sub="인천 앞바다 기상" dot="green"
                    label={weather ? `${weather.current.condition} ${weather.current.temp}°C · 파고 ${weather.current.waveHeight}m` : "날씨 정보 확인 가능"} />
                  <StripItem Icon={Waves}    iconColor="text-teal-600"   label="물때 정보 업데이트" sub="갯벌·낚시 물때 확인"   dot="green" />
                  <StripItem Icon={Sparkles} iconColor="text-purple-600" label="AI 일정 생성 가능"   sub="취향 맞춤 여행 계획"   dot="green" />
                </div>
              </div>
            </section>

            {/* 핵심 기능 하이라이트 */}
            <section className="bg-white py-20">
              <div className="max-w-[1280px] mx-auto px-8">
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">지금 바로 확인하세요</h2>
                  <p className="text-gray-500 text-base">출발 전에 필요한 모든 정보를 한 곳에서</p>
                </div>
                <div className="grid grid-cols-4 gap-6">
                  {FEATURE_ITEMS.map(({ Icon, iconColor, bgColor, title, desc, cta, to, badge }) => (
                    <Link key={title} to={to}
                      className="group bg-white border border-gray-100 rounded-2xl p-8 flex flex-col hover:shadow-md transition-all duration-200 hover:-translate-y-1 relative"
                    >
                      {badge && (
                        <span className="absolute top-5 right-5 text-[10px] font-bold text-white bg-purple-600 px-2 py-0.5 rounded-full tracking-wide">
                          {badge}
                        </span>
                      )}
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: bgColor }}>
                        <Icon className="w-8 h-8" style={{ color: iconColor }} strokeWidth={1.75} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed flex-1">{desc}</p>
                      <div className="flex items-center gap-1 mt-6 text-sm font-semibold transition-colors" style={{ color: iconColor }}>
                        {cta}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            {/* 인기 섬 여행지 */}
            <section className="bg-gray-50 py-20">
              <div className="max-w-[1280px] mx-auto px-8">
                <div className="flex items-end justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">인기 섬 여행지</h2>
                    <p className="text-gray-500 text-base">이번 주말 떠나기 좋은 섬을 골라보세요</p>
                  </div>
                  <Link to="/islands" className="flex items-center gap-1 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors">
                    전체 섬 보기 <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-6">
                  {POPULAR_ISLANDS.map((island) => (
                    <div key={island.id} className="group relative">
                      <button
                        onClick={() => toggleSave(island.id)}
                        className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/85 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-all duration-150"
                      >
                        <Heart
                          className={`w-[18px] h-[18px] transition-colors ${savedIslands.has(island.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                          strokeWidth={2}
                        />
                      </button>
                      {demandLevels[island.id] === 'high' && (
                        <span className="absolute top-3 left-3 z-10 text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                          🔥 인기
                        </span>
                      )}
                      {demandLevels[island.id] === 'low' && (
                        <span className="absolute top-3 left-3 z-10 text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">
                          💤 한산
                        </span>
                      )}
                      <Link to={island.to} className="block">
                        <div className="aspect-[3/2] rounded-xl overflow-hidden mb-3 relative">
                          <img src={island.image} alt={island.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div>
                          <div className="flex items-start justify-between mb-0.5">
                            <h3 className="text-base font-semibold text-gray-900">{island.name}</h3>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" strokeWidth={0} />
                              <span className="text-sm font-medium text-gray-900">{island.rating}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mb-1">{island.route}</p>
                          <p className="text-sm text-gray-400 mb-2">{island.travelTime}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {island.tags.map((tag) => (
                              <span key={tag} className="text-xs text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
      {/* ── 데스크탑 레이아웃 끝 ──────────────────────────────────────── */}


      {/* ══════════════════════════════════════════════════════════════
          모바일 레이아웃 (lg 미만) — 로그인 상태별 화면 분리
          ══════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        {user ? (
          <>
        <section className="relative bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-8 overflow-hidden">
          <div
            className="absolute inset-0 opacity-30 bg-cover bg-center"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1700621497504-d241a3803bbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-blue-700/80" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">인천 섬 여행</h1>
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
          <div className="grid grid-cols-5 gap-2">
            <Link to="/packages"><FeatureCardMobile icon={<Sparkles className="w-5 h-5 text-blue-600" strokeWidth={2} />} title="패키지" /></Link>
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

        <section className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">인기 리뷰</h2>
            <Link to="/community" className="flex items-center gap-1 text-sm text-blue-600 font-medium">
              전체보기 <ChevronRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory">
            {popularReviews.length > 0
              ? popularReviews.map((review) => <MobileReviewCard key={review.id} {...review} />)
              : <p className="text-sm text-gray-400 py-4">아직 리뷰가 없어요.</p>}
          </div>
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
          </>
        ) : (
          <MobileLanding />
        )}
      </div>
      {/* ── 모바일 레이아웃 끝 ──────────────────────────────────────────── */}
    </div>
  );
}

function MobileLanding() {
  return (
    <div className="bg-white min-h-full">
      <section className="relative min-h-[520px] flex items-end overflow-hidden px-6 pb-12 pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1700621497504-d241a3803bbd?auto=format&fit=crop&w=1080&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/35 to-black/75" />
        <div className="relative z-10 text-white">
          <p className="text-xs font-semibold tracking-[0.18em] text-white/70 mb-3">
            서해 인천 섬 여행 플랫폼
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight mb-4">
            인천의 섬으로
            <br />
            떠나는 여행
          </h1>
          <p className="text-sm text-white/80 leading-relaxed mb-7">
            배편 조회부터 AI 일정까지,
            <br />
            섬 여행 준비를 한곳에서 시작하세요.
          </p>
          <div className="flex gap-3">
            <Link
              to="/islands"
              className="flex-1 bg-white text-gray-900 text-center py-3.5 rounded-xl font-bold"
            >
              섬 둘러보기
            </Link>
            <Link
              to="/login"
              className="flex-1 bg-blue-600 text-white text-center py-3.5 rounded-xl font-bold border border-blue-500"
            >
              로그인
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-7">
        <div className="grid grid-cols-3 gap-3">
          {[
            { to: "/schedule", Icon: Ship, label: "배편 조회" },
            { to: "/islands", Icon: MapPin, label: "섬 탐색" },
            { to: "/community", Icon: Users, label: "여행 후기" },
          ].map(({ to, Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2 rounded-2xl bg-blue-50 px-2 py-4 text-blue-700"
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="text-xs font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">인기 섬</h2>
          <Link to="/islands" className="text-sm font-medium text-blue-600">
            전체보기
          </Link>
        </div>
        <div className="space-y-3">
          {POPULAR_ISLANDS.slice(0, 3).map((island) => (
            <Link
              key={island.id}
              to={island.to}
              className="flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <img
                src={island.image}
                alt={island.name}
                className="w-28 h-24 object-cover shrink-0"
              />
              <div className="min-w-0 flex-1 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{island.name}</h3>
                  <span className="text-xs font-semibold text-gray-700">
                    ★ {island.rating}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{island.subtitle}</p>
                <p className="text-xs text-blue-600 mt-2">{island.travelTime}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Desktop Dashboard (로그인 후) ────────────────────────────────────────────

interface DashboardProps {
  displayName: string;
  weather: WeatherResult | null;
  ferryStatus: FerryRouteStatus[];
  confirmedItinerary: any;
  confirmedTripId: string | null;
  getDDay: (startDate: string) => number;
  getDDayMessage: (dday: number) => string;
  demandLevels?: Record<string, 'low' | 'medium' | 'high'>;
}

function DesktopDashboard({
  displayName, weather, ferryStatus, confirmedItinerary, confirmedTripId, getDDay, getDDayMessage, demandLevels = {},
}: DashboardProps) {
  const [savedIslands, setSavedIslands] = useState<Set<string>>(new Set());

  const normalCount = ferryStatus.filter((s) => s.status === "정상").length;
  const ferryText =
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
        {/* 섬 이미지 은은하게 */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80')",
            opacity: 0.11,
          }}
        />
        {/* 장식 원형 */}
        <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/[0.05] rounded-full" />
        <div className="absolute top-6 right-40 w-28 h-28 bg-white/[0.05] rounded-full" />
        {/* 하단 물결 */}
        <svg className="absolute bottom-0 left-0 right-0 w-full" viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none">
          <path d="M0,20 C360,40 720,0 1080,20 C1260,32 1380,8 1440,20 L1440,40 L0,40 Z" fill="#f5f6f8" fillOpacity="1" />
        </svg>

        <div className="relative z-10 max-w-[1280px] mx-auto px-8 pt-9 pb-14 flex items-center justify-between">
          {/* 좌: 인사말 */}
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1.5">{dateStr}</p>
            <h1 className="text-[30px] font-bold text-white tracking-tight leading-tight mb-2">
              안녕하세요, {displayName}님
            </h1>
            <p className="text-blue-200 text-sm">오늘도 좋은 섬 여행 되세요 🏝️</p>
          </div>

          {/* 우: 날씨 브리핑 글라스 카드 */}
          {weather && (
            <div className="bg-white/[0.12] backdrop-blur-sm border border-white/[0.22] rounded-2xl px-6 py-4 min-w-[220px]">
              <p className="text-blue-200 text-xs font-medium mb-2.5 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5" strokeWidth={2} />
                인천 앞바다 현재 날씨
              </p>
              <div className="flex items-end gap-2 mb-2.5">
                <span className="text-[36px] font-bold text-white leading-none">{weather.current.temp}°</span>
                <span className="text-blue-100 text-sm font-medium mb-1">{weather.current.condition}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-blue-200 pt-2.5 border-t border-white/[0.18]">
                <span>파고 {weather.current.waveHeight}m</span>
                <span className="text-white/20">·</span>
                <span>바람 {weather.current.windSpeed}m/s</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-8">

        {/* Status Cards — 배너에서 이어지도록 -mt-10 */}
        <div className="grid grid-cols-4 gap-4 -mt-10 mb-6 relative z-10">

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

          {/* 배편 검색 CTA */}
          <Link to="/schedule"
            className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 shadow-[0_4px_24px_rgba(37,99,235,0.32)] hover:shadow-[0_8px_32px_rgba(37,99,235,0.44)] transition-all duration-200 hover:-translate-y-0.5 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
            </div>
            <p className="text-[11px] text-blue-200 font-semibold mb-1.5 uppercase tracking-wide">지금 바로</p>
            <p className="text-[19px] font-bold text-white leading-tight">배편 검색</p>
            <p className="text-xs text-blue-200 mt-2 flex items-center gap-1">
              빠르게 조회하기
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </p>
          </Link>
        </div>

        {/* ── 빠른 서비스 ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl px-5 pt-5 pb-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-gray-100/60 mb-6">
          <h2 className="text-[15px] font-bold text-gray-900 mb-4">빠른 서비스</h2>
          <div className="grid grid-cols-6 gap-1">
            {QUICK_SERVICES.map(({ label, Icon, to, iconColor, bg }) => (
              <Link key={label} to={to}
                className="flex flex-col items-center gap-2.5 py-3 rounded-2xl hover:bg-gray-50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                  <Icon className="w-[22px] h-[22px]" style={{ color: iconColor }} strokeWidth={2} />
                </div>
                <span className="text-[12px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── 2단: 여행 일정 + 인기 섬 (Airbnb 스타일) ────────────── */}
        <div className="grid grid-cols-[5fr_7fr] gap-5 mb-6">

          {/* 좌: 내 여행 일정 */}
          <div>
            <h2 className="text-[15px] font-bold text-gray-900 mb-3">내 여행 일정</h2>
            {confirmedItinerary ? (
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-gray-100/60">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 text-blue-600" strokeWidth={2} />
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">확정 일정</span>
                  </div>
                  {dday !== null && dday >= 0 && (
                    <span className="text-xs font-bold text-white bg-blue-600 px-3 py-1 rounded-full">
                      {dday === 0 ? "D-Day" : `D-${dday}`}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{confirmedItinerary.title}</h3>
                <p className="text-sm text-gray-500 mb-1">{confirmedItinerary.startDate}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 pb-3 mb-3 border-b border-gray-100">
                  <Ship className="w-3.5 h-3.5 text-gray-400 shrink-0" strokeWidth={2} />
                  <span>{confirmedItinerary.departurePort || "인천항"}</span>
                  <span className="text-gray-300">→</span>
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" strokeWidth={2} />
                  <span>{confirmedItinerary.islands?.join(", ")}</span>
                </div>
                <p className="text-sm font-medium text-blue-600 mb-4">{getDDayMessage(dday ?? 0)}</p>
                <div className="space-y-2.5 mb-5">
                  {confirmedItinerary.days[0]?.activities?.slice(0, 3).map((activity: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      <span className="text-gray-400 shrink-0 w-12 font-medium">{activity.time}</span>
                      <span className="text-gray-700">{activity.title}</span>
                    </div>
                  ))}
                </div>
                <Link to={`/itinerary/${confirmedTripId}`}
                  className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  전체 일정 보기 <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] border-2 border-dashed border-gray-200 flex flex-col items-center text-center min-h-[280px] justify-center">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-purple-500" strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">아직 여행 계획이 없어요</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  AI가 취향에 맞는 섬 여행 일정을<br />자동으로 만들어드려요
                </p>
                <Link to="/create-trip"
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
                >
                  AI 플래너 시작하기
                </Link>
              </div>
            )}
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
              {POPULAR_ISLANDS.slice(0, 3).map((island) => (
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
                  <Link to={island.to} className="block">
                    {/* 이미지 */}
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 relative bg-gray-100">
                      <img src={island.image} alt={island.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* 텍스트 */}
                    <div className="flex items-start justify-between mb-0.5">
                      <h3 className="text-[15px] font-semibold text-gray-900">{island.name}</h3>
                      <div className="flex items-center gap-0.5 shrink-0 ml-1">
                        <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" strokeWidth={0} />
                        <span className="text-sm font-semibold text-gray-900">{island.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{island.route}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 flex-wrap">
                        {island.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 ml-1">{island.travelTime}</span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── AI 이번 주 추천 — 가로형 카드 ───────────────────────── */}
        <div className="mb-10">
          <h2 className="text-[15px] font-bold text-gray-900 mb-3">AI 이번 주 추천</h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-gray-100/60 flex">
            <div className="relative w-56 shrink-0 overflow-hidden">
              <img src={AI_RECOMMENDATION.image} alt={AI_RECOMMENDATION.island}
                className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 p-6 flex flex-col justify-center">
              <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full inline-block mb-3 self-start uppercase tracking-wide">AI 추천</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{AI_RECOMMENDATION.island}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                {weather
                  ? `현재 파고 ${weather.current.waveHeight}m, ${weather.current.condition} — ${AI_RECOMMENDATION.reason}`
                  : AI_RECOMMENDATION.reason}
              </p>
              <div className="flex items-center gap-2 mb-4">
                {AI_RECOMMENDATION.tags.map((tag) => (
                  <span key={tag} className="text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
              <Link to={AI_RECOMMENDATION.to}
                className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 self-start transition-colors"
              >
                섬 정보 보기 <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Landing 전용 보조 컴포넌트 ──────────────────────────────────────────────

function StripItem({ Icon, iconColor, label, sub, dot }: {
  Icon: React.ElementType; iconColor: string; label: string; sub: string; dot: "green" | "orange" | "gray";
}) {
  const dotColor = dot === "green" ? "bg-green-500" : dot === "orange" ? "bg-orange-400" : "bg-gray-300";
  return (
    <div className="flex items-center gap-3 py-1">
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
      <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} strokeWidth={2} />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <span className="text-xs text-gray-400">{sub}</span>
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

function MobileReviewCard({ id, author, location, rating, preview, image, likes }: ReviewData) {
  return (
    <div className="w-64 snap-start">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="relative h-32">
          <img src={image} alt={location} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-white/40"}`} strokeWidth={2} />
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/90">
              <MapPin className="w-3 h-3" strokeWidth={2} /><span>{location}</span>
            </div>
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">{author}</span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Heart className="w-3 h-3" strokeWidth={2} /><span>{likes}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{preview}</p>
        </div>
      </div>
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
