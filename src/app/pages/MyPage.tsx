import { useNavigate, Link } from "react-router";
import { useState, useEffect } from "react";
import {
  Calendar, ChevronRight, Bell, HelpCircle, LogOut,
  CreditCard, Heart, Users, AlertCircle, Clock, Sparkles, MapPinned, Compass,
  Building2, ClipboardCheck, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/useAuth";
import { supabase } from "../lib/supabase";
import { tripService } from "../../lib/tripService";
import { favoritesService } from "../../lib/favoritesService";
import { groupTripService } from "../../lib/groupTripService";

const UTILITY_MENU = [
  { icon: Clock, label: "교통 시간표", path: "/schedule" },
  { icon: AlertCircle, label: "긴급 연락처", path: "/emergency" },
];

const SETTINGS_MENU = [
  { icon: Bell, label: "알림 설정", path: "/notification-settings" },
  { icon: HelpCircle, label: "고객센터", path: "/support" },
];

const TOOL_CARDS = [
  { icon: Users, label: "그룹 여행", desc: "친구·가족과 일정 공유", path: "/group-trip" },
  { icon: CreditCard, label: "경비 관리", desc: "예산과 지출 기록", path: "/budget" },
  { icon: Heart, label: "찜한 여행지", desc: "저장한 섬과 코스", path: "/favorites" },
];

export function MyPage() {
  const navigate = useNavigate();
  const { user, displayName, hostApplication, isHost } = useAuth();

  const [loading, setLoading] = useState(true);
  const [upcomingTrip, setUpcomingTrip] = useState<any>(null);
  const [visitedTrips, setVisitedTrips] = useState<any[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [tripCount, setTripCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      tripService.getUpcomingTrip(),
      tripService.getVisitedTrips(),
      favoritesService.getFavorites(),
      groupTripService.getMyGroups(),
      tripService.getTripCount(),
    ]).then(([trip, visited, favorites, groups, count]) => {
      setUpcomingTrip(trip);
      setVisitedTrips(visited);
      setFavoriteCount(favorites.length);
      setGroupCount(groups.length);
      setTripCount(count);
      setLoading(false);
    });
  }, [user]);

  const visitedCount = visitedTrips.length;
  const visitedIslandCount = new Set(visitedTrips.flatMap((t) => t.islands ?? [])).size;
  const travelStyleLabel = visitedCount === 0 ? "아직 없음" : "다양한 스타일";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("로그아웃됐어요. 다음에 또 만나요!");
    navigate("/login");
  };

  const go = (path: string) => navigate(path);

  if (!user) return null;

  const avatarUrl: string | undefined = user.user_metadata?.avatar_url;
  const initial = displayName?.[0]?.toUpperCase() ?? "?";

  const getDDay = (startDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate + "T00:00:00");
    return Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const STAT_ITEMS = [
    { label: "총 여행 횟수", value: tripCount, path: "/travel", icon: Calendar },
    { label: "방문한 섬 수", value: visitedIslandCount, path: "/travel", icon: MapPinned },
    { label: "즐겨찾기", value: favoriteCount, path: "/favorites", icon: Heart },
  ];

  const hostMenu = isHost
    ? { icon: CheckCircle2, iconBg: "bg-blue-50", iconColor: "text-blue-600", label: "호스트 대시보드", desc: "승인 완료 · 기능 준비 중이에요" }
    : hostApplication?.status === "pending"
    ? { icon: ClipboardCheck, iconBg: "bg-amber-50", iconColor: "text-amber-600", label: "호스트 신청 검토 중", desc: "제출한 신청서를 검토하고 있어요" }
    : hostApplication?.status === "rejected"
    ? { icon: XCircle, iconBg: "bg-red-50", iconColor: "text-red-500", label: "호스트 신청 수정 / 재신청", desc: "반려됨 · 정보를 수정하고 재신청하세요" }
    : { icon: Building2, iconBg: "bg-blue-50", iconColor: "text-blue-600", label: "숙소 운영자 신청", desc: "섬타기에 숙소를 등록해보세요" };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1280px] lg:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-5 lg:py-8">

        {/* 페이지 헤더 */}
        <div className="mb-4 lg:mb-6">
          <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-1 lg:mb-2">마이페이지</h1>
          <p className="text-sm lg:text-lg text-gray-500">계정 정보와 여행 활동을 한눈에 확인하세요</p>
        </div>

        {/* 상단 대시보드: 프로필(좌) + 여행 통계(우) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-3 lg:gap-6 mb-4 lg:mb-6">

          {/* 프로필 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-7 flex flex-col">
            <div className="flex items-start gap-3 lg:gap-4">
              <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg lg:text-2xl font-bold text-white">{initial}</span>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5 lg:pt-1">
                <h2 className="text-sm lg:text-lg font-bold text-gray-900 truncate">{displayName}</h2>
                <p className="text-xs lg:text-base text-gray-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => go("/profile-edit")}
                className="shrink-0 text-xs lg:text-sm font-medium text-gray-400 hover:text-blue-600 transition-colors mt-0.5 lg:mt-1"
              >
                프로필 수정
              </button>
            </div>

            {!loading && (
              upcomingTrip ? (
                <Link
                  to={`/itinerary/${upcomingTrip.id}`}
                  className="mt-4 lg:mt-6 flex items-center justify-between gap-2 bg-blue-50 rounded-xl px-3 py-2.5 lg:px-4 lg:py-3 hover:bg-blue-100/70 transition-colors"
                >
                  <span className="text-xs lg:text-sm text-blue-700 font-medium truncate">
                    다음 여행 · {upcomingTrip.title ?? "여행"}
                  </span>
                  {(() => {
                    const dday = getDDay(upcomingTrip.start_date);
                    return dday >= 0 ? (
                      <span className="text-xs lg:text-sm font-bold text-blue-600 shrink-0">
                        {dday === 0 ? "오늘" : `D-${dday}`}
                      </span>
                    ) : null;
                  })()}
                </Link>
              ) : (
                <button
                  onClick={() => go("/create-trip")}
                  className="mt-4 lg:mt-6 flex items-center justify-between gap-2 bg-gray-50 rounded-xl px-3 py-2.5 lg:px-4 lg:py-3 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="text-xs lg:text-sm text-gray-500 font-medium">예정된 여행이 없어요</span>
                  <span className="text-xs lg:text-sm font-semibold text-blue-600 shrink-0">여행 계획 →</span>
                </button>
              )
            )}
          </div>

          {/* 여행 통계 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-7">
            <h3 className="text-sm lg:text-base font-semibold text-gray-500 mb-3 lg:mb-4">여행 통계</h3>
            {loading ? (
              <div className="h-16 lg:h-20 bg-gray-50 rounded-lg animate-pulse" />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4">
                {STAT_ITEMS.map(({ label, value, path, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => go(path)}
                    className="flex flex-col items-center justify-center gap-1.5 lg:gap-2 py-3 lg:py-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors"
                  >
                    <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" strokeWidth={2} />
                    <span className="text-lg lg:text-2xl font-bold text-gray-900">{value}</span>
                    <span className="text-[11px] lg:text-sm text-gray-500 text-center leading-tight">{label}</span>
                  </button>
                ))}
                <div className="flex flex-col items-center justify-center gap-1.5 lg:gap-2 py-3 lg:py-4 rounded-xl bg-gray-50">
                  <Compass className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" strokeWidth={2} />
                  <span className="text-sm lg:text-lg font-bold text-gray-900 text-center leading-tight">{travelStyleLabel}</span>
                  <span className="text-[11px] lg:text-sm text-gray-500 text-center leading-tight">여행 스타일</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 최근 여행 */}
        {!loading && visitedTrips.length > 0 && (
          <div className="mb-4 lg:mb-6">
            <div className="flex items-center justify-between mb-3 lg:mb-4 px-1">
              <h3 className="text-sm lg:text-base font-semibold text-gray-500">최근 여행</h3>
              <button onClick={() => go("/travel")} className="text-xs lg:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                전체 보기
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:gap-4">
              {visitedTrips.slice(0, 3).map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => go(`/itinerary/${trip.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 px-4 py-3 lg:px-5 lg:py-4 text-left hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                >
                  <p className="font-semibold text-sm lg:text-base text-gray-900 truncate">{trip.title ?? "여행"}</p>
                  <p className="text-xs lg:text-sm text-gray-500 mt-0.5 truncate">{(trip.islands ?? []).join(", ") || "섬 정보 없음"}</p>
                  <p className="text-xs lg:text-sm text-gray-400 mt-1.5">{trip.start_date}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 여행 도구 */}
        <div className="mb-4 lg:mb-6">
          <h3 className="text-sm lg:text-base font-semibold text-gray-500 mb-3 lg:mb-4 px-1">여행 도구</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 lg:gap-4">
            {TOOL_CARDS.map(({ icon: Icon, label, desc, path }) => (
              <button
                key={path}
                onClick={() => go(path)}
                className="flex items-center gap-3 lg:gap-4 rounded-2xl px-4 py-3 lg:px-5 lg:py-4 transition-colors text-left border bg-white border-gray-100 hover:border-blue-200 hover:bg-blue-50/30"
              >
                <div className="w-9 h-9 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 bg-blue-50">
                  <Icon className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm lg:text-base text-gray-900">{label}</p>
                  <p className="text-xs lg:text-sm mt-0.5 truncate text-gray-500">
                    {desc}{path === "/group-trip" && groupCount > 0 ? ` · ${groupCount}개` : ""}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 shrink-0 text-gray-300" strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>

        {/* 숙소 운영 */}
        <div className="mb-4 lg:mb-6">
          <h3 className="text-sm lg:text-base font-semibold text-gray-500 mb-3 lg:mb-4 px-1">숙소 운영</h3>
          <div className="space-y-2.5 lg:space-y-3">
            <button
              onClick={() => go("/host/apply")}
              className="w-full flex items-center gap-3 lg:gap-4 rounded-2xl px-4 py-3 lg:px-5 lg:py-4 transition-colors text-left border bg-white border-gray-100 hover:border-blue-200 hover:bg-blue-50/30"
            >
              <div className={`w-9 h-9 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 ${hostMenu.iconBg}`}>
                <hostMenu.icon className={`w-4 h-4 lg:w-6 lg:h-6 ${hostMenu.iconColor}`} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm lg:text-base text-gray-900">{hostMenu.label}</p>
                <p className="text-xs lg:text-sm mt-0.5 truncate text-gray-500">{hostMenu.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 shrink-0 text-gray-300" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* 편의 기능 + 계정 설정 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 items-start">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-2 lg:px-6 lg:py-3 border-b border-gray-100">
              <h3 className="text-sm lg:text-base font-semibold text-gray-500">편의 기능</h3>
            </div>
            {UTILITY_MENU.map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => go(path)}
                className="w-full flex items-center gap-3 lg:gap-4 px-5 py-2 lg:px-6 lg:py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left"
              >
                <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 shrink-0" strokeWidth={2} />
                <span className="flex-1 text-sm lg:text-base font-medium text-gray-700">{label}</span>
                <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-gray-300 shrink-0" strokeWidth={2} />
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-2 lg:px-6 lg:py-3 border-b border-gray-100">
              <h3 className="text-sm lg:text-base font-semibold text-gray-500">계정 설정</h3>
            </div>
            {SETTINGS_MENU.map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => go(path)}
                className="w-full flex items-center gap-3 lg:gap-4 px-5 py-2 lg:px-6 lg:py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left"
              >
                <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 shrink-0" strokeWidth={2} />
                <span className="flex-1 text-sm lg:text-base font-medium text-gray-700">{label}</span>
                <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-gray-300 shrink-0" strokeWidth={2} />
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 lg:gap-4 px-5 py-2 lg:px-6 lg:py-3 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 lg:w-5 lg:h-5 text-red-500 shrink-0" strokeWidth={2} />
              <span className="flex-1 text-sm lg:text-base font-medium text-red-600">로그아웃</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 lg:mt-6">버전 1.0.0</p>
      </div>
    </div>
  );
}
