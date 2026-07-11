import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  Calendar, ChevronRight, Bell, HelpCircle, LogOut,
  CreditCard, Heart, Users, AlertCircle, Clock, Sparkles,
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

const TRAVEL_CARDS = [
  { icon: Calendar, label: "내 여행 일정", desc: "예정·완료 일정 관리", path: "/travel", featured: true },
  { icon: Users, label: "그룹 여행", desc: "친구·가족과 일정 공유", path: "/group-trip" },
  { icon: CreditCard, label: "경비 관리", desc: "예산과 지출 기록", path: "/budget" },
  { icon: Heart, label: "찜한 여행지", desc: "저장한 섬과 코스", path: "/favorites" },
];

export function MyPage() {
  const navigate = useNavigate();
  const { user, displayName } = useAuth();

  const [loading, setLoading] = useState(true);
  const [upcomingTrip, setUpcomingTrip] = useState<any>(null);
  const [visitedCount, setVisitedCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      tripService.getUpcomingTrip(),
      tripService.getVisitedTrips(),
      favoritesService.getFavorites(),
      groupTripService.getMyGroups(),
    ]).then(([trip, visited, favorites, groups]) => {
      setUpcomingTrip(trip);
      setVisitedCount(visited.length);
      setFavoriteCount(favorites.length);
      setGroupCount(groups.length);
      setLoading(false);
    });
  }, [user]);

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
    { label: "완료한 여행", value: visitedCount, path: "/travel" },
    { label: "찜한 여행지", value: favoriteCount, path: "/favorites" },
    { label: "그룹 여행", value: groupCount, path: "/group-trip" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-6">

        {/* 페이지 헤더 */}
        <div className="mb-4">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">마이페이지</h1>
          <p className="text-sm lg:text-base text-gray-500">계정 정보와 여행 활동을 한눈에 확인하세요</p>
        </div>

        {/* 상단 대시보드: 프로필(좌) + 예정 여행(우) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-3 lg:gap-4 mb-4">

          {/* 프로필 + 통계 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-5 flex flex-col">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg lg:text-xl font-bold text-white">{initial}</span>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h2 className="text-sm lg:text-base font-bold text-gray-900 truncate">{displayName}</h2>
                <p className="text-xs lg:text-sm text-gray-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => go("/profile-edit")}
                className="shrink-0 text-xs font-medium text-gray-400 hover:text-blue-600 transition-colors mt-0.5"
              >
                프로필 수정
              </button>
            </div>

            {loading ? (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="h-10 bg-gray-50 rounded-lg animate-pulse" />
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
                {STAT_ITEMS.map(({ label, value, path }) => (
                  <button
                    key={label}
                    onClick={() => go(path)}
                    className="flex flex-col items-center justify-center px-1 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-base font-bold text-gray-900">{value}</span>
                    <span className="text-[11px] text-gray-500 mt-0.5 text-center leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 예정된 여행 */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ) : upcomingTrip ? (
            <button
              onClick={() => go(`/itinerary/${upcomingTrip.id}`)}
              className="w-full h-full text-left bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 lg:p-5 text-white relative overflow-hidden hover:from-blue-700 hover:to-blue-800 transition-colors flex flex-col justify-center"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-12 -mt-12 pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-blue-200 text-xs font-medium mb-0.5">예정된 여행</p>
                  <h4 className="text-lg font-bold truncate">{upcomingTrip.title ?? "여행"}</h4>
                  <p className="text-blue-200 text-sm mt-0.5 truncate">
                    {(upcomingTrip.islands ?? []).join(", ") || "섬 정보 없음"}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  {(() => {
                    const dday = getDDay(upcomingTrip.start_date);
                    return dday >= 0 ? (
                      <span className="bg-white/20 px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap">
                        {dday === 0 ? "오늘 출발" : `D-${dday}`}
                      </span>
                    ) : null;
                  })()}
                  <ChevronRight className="w-5 h-5" strokeWidth={2} />
                </div>
              </div>
            </button>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 h-full flex flex-col items-center justify-center text-center gap-2 px-6 py-5">
              <div className="w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-500" strokeWidth={1.75} />
              </div>
              <div>
                <h4 className="text-sm lg:text-base font-bold text-gray-900">아직 예정된 여행이 없어요</h4>
                <p className="text-xs lg:text-sm text-gray-500 mt-0.5">AI가 취향에 맞는 섬 여행 일정을 만들어드려요</p>
              </div>
              <button
                onClick={() => go("/create-trip")}
                className="mt-1 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
              >
                <Calendar className="w-4 h-4" strokeWidth={2} />
                여행 계획 만들기
              </button>
            </div>
          )}
        </div>

        {/* 여행 관리 */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">여행 관리</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {TRAVEL_CARDS.map(({ icon: Icon, label, desc, path, featured }) => (
              <button
                key={path}
                onClick={() => go(path)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors text-left border ${
                  featured
                    ? "bg-blue-600 border-blue-600 hover:bg-blue-700"
                    : "bg-white border-gray-100 hover:border-blue-200 hover:bg-blue-50/30"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${featured ? "bg-white/15" : "bg-blue-50"}`}>
                  <Icon className={`w-4 h-4 ${featured ? "text-white" : "text-blue-600"}`} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold text-sm ${featured ? "text-white" : "text-gray-900"}`}>{label}</p>
                  <p className={`text-xs mt-0.5 truncate ${featured ? "text-blue-100" : "text-gray-500"}`}>{desc}</p>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 ${featured ? "text-white/70" : "text-gray-300"}`} strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>

        {/* 편의 기능 + 계정 설정 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500">편의 기능</h3>
            </div>
            {UTILITY_MENU.map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => go(path)}
                className="w-full flex items-center gap-3 px-5 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left"
              >
                <Icon className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={2} />
                <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" strokeWidth={2} />
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500">계정 설정</h3>
            </div>
            {SETTINGS_MENU.map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => go(path)}
                className="w-full flex items-center gap-3 px-5 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left"
              >
                <Icon className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={2} />
                <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" strokeWidth={2} />
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-2 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-red-500 shrink-0" strokeWidth={2} />
              <span className="flex-1 text-sm font-medium text-red-600">로그아웃</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">버전 1.0.0</p>
      </div>
    </div>
  );
}
