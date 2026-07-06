import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { User, Calendar, ChevronRight, Settings, Bell, HelpCircle, LogOut, CreditCard, Heart, Users, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/useAuth";
import { supabase } from "../lib/supabase";
import { tripService } from "../../lib/tripService";

export function MyPage() {
  const navigate = useNavigate();
  const { user, displayName } = useAuth();
  const [tripCount, setTripCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    tripService.getTripCount().then(setTripCount);
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("로그아웃됐어요. 다음에 또 만나요!");
    navigate("/login");
  };

  const go = (path: string) => navigate(path);

  if (!user) return null;

  const daysSinceJoin = Math.floor(
    (new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const avatarUrl: string | undefined = user.user_metadata?.avatar_url;

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ================================================================
          데스크탑 레이아웃 (lg 이상)
          ================================================================ */}
      <div className="hidden lg:block">
        <div className="max-w-[1280px] mx-auto px-8 py-10">

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">마이페이지</h1>
            <p className="text-gray-500">계정 정보와 여행 기록을 관리하세요</p>
          </div>

          <div className="flex gap-6 items-start">

            {/* ── 왼쪽: 프로필 패널 ─────────────────────────────────── */}
            <div className="w-[300px] shrink-0 space-y-4">

              {/* 프로필 카드 */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-12 -mt-12 pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden mb-4 mx-auto ring-4 ring-white/20">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="프로필" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-blue-600" strokeWidth={2} />
                    )}
                  </div>
                  <div className="text-center mb-5">
                    <h2 className="text-xl font-bold mb-1">{displayName}</h2>
                    <p className="text-blue-200 text-sm truncate">{user.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    {[
                      { label: "가입", value: `${daysSinceJoin}일` },
                      { label: "여행", value: `${tripCount}건` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/10 rounded-xl py-3">
                        <p className="text-[10px] text-blue-200 mb-0.5 uppercase tracking-wide">{label}</p>
                        <p className="text-base font-bold">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 계정 정보 */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">계정 정보</h3>
                </div>
                {[
                  { icon: User, label: "프로필 수정", path: "/profile-edit", sub: user.email },
                ].map(({ icon: Icon, label, path, sub }) => (
                  <button
                    key={label}
                    onClick={() => go(path)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left"
                  >
                    <Icon className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={2} />
                    <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
                    {sub ? (
                      <span className="text-xs text-gray-400 truncate max-w-[100px]">{sub}</span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" strokeWidth={2} />
                    )}
                  </button>
                ))}
              </div>

              {/* 로그아웃 */}
              <button
                onClick={handleLogout}
                className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 flex items-center justify-center gap-2 text-red-600 font-medium hover:bg-red-50 hover:border-red-200 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" strokeWidth={2} />
                로그아웃
              </button>

              <p className="text-center text-xs text-gray-400">버전 1.0.0</p>
            </div>

            {/* ── 오른쪽: 메뉴 그리드 ──────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* 여행 관리 */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">여행 관리</h3>
                </div>
                <div className="grid grid-cols-2">
                  {[
                    { icon: Calendar,   label: "내 여행 일정",   desc: "예정·완료 일정 관리",   path: "/travel"          },
                    { icon: Users,      label: "그룹 여행",       desc: "친구·가족 일정 공유",   path: "/group-trip"      },
                    { icon: CreditCard, label: "경비 관리",       desc: "예산·지출 기록",        path: "/budget"          },
                    { icon: Heart,      label: "찜한 여행지",     desc: "저장한 섬·코스",        path: "/favorites"       },
                  ].map(({ icon: Icon, label, desc, path }) => (
                    <button
                      key={path}
                      onClick={() => go(path)}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors border-b border-r border-gray-50 text-left odd:last:col-span-2"
                    >
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-blue-600" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 편의 기능 + 설정 */}
              <div className="grid grid-cols-2 gap-5">

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">편의 기능</h3>
                  </div>
                  {[
                    { icon: Clock,       label: "교통 시간표",    path: "/schedule"  },
                    { icon: AlertCircle, label: "긴급 연락처",    path: "/emergency" },
                  ].map(({ icon: Icon, label, path }) => (
                    <button
                      key={path}
                      onClick={() => go(path)}
                      className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left"
                    >
                      <Icon className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={2} />
                      <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" strokeWidth={2} />
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">설정</h3>
                  </div>
                  {[
                    { icon: Bell,        label: "알림 설정",   path: "/notification-settings" },
                    { icon: Settings,    label: "앱 설정",     path: "/app-settings"          },
                    { icon: HelpCircle,  label: "고객센터",    path: "/support"               },
                  ].map(({ icon: Icon, label, path }) => (
                    <button
                      key={path}
                      onClick={() => go(path)}
                      className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left"
                    >
                      <Icon className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={2} />
                      <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          모바일 레이아웃 (lg 미만) — 기존 코드 완전 보존
          ================================================================ */}
      <div className="lg:hidden">
        {/* Header with Background */}
        <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-8 overflow-hidden">
          <div
            className="absolute inset-0 opacity-20 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1691422066850-de273fe9008d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-blue-700/80"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-blue-600" strokeWidth={2} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-white mb-1">{displayName}</h2>
                <p className="text-sm text-blue-100">{user.email}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="가입일" value={`${daysSinceJoin}일전`} />
              <StatCard label="예약" value={`${tripCount}건`} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Account Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2">계정 정보</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <MenuItem icon={<User className="w-5 h-5" strokeWidth={2} />} label="프로필 수정" value={user.email ?? ''} onClick={() => go("/profile-edit")} showDivider={false} />
            </div>
          </div>

          {/* Travel Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2">여행 관리</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <MenuItem icon={<Calendar className="w-5 h-5" strokeWidth={2} />} label="내 여행 일정" onClick={() => go("/travel")} />
              <MenuItem icon={<Users className="w-5 h-5" strokeWidth={2} />} label="그룹 여행" onClick={() => go("/group-trip")} />
              <MenuItem icon={<CreditCard className="w-5 h-5" strokeWidth={2} />} label="경비 관리" onClick={() => go("/budget")} />
              <MenuItem icon={<Heart className="w-5 h-5" strokeWidth={2} />} label="찜한 여행지" onClick={() => go("/favorites")} showDivider={false} />
            </div>
          </div>

          {/* Utilities Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2">편의 기능</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <MenuItem icon={<Clock className="w-5 h-5" strokeWidth={2} />} label="교통 시간표" onClick={() => go("/schedule")} />
              <MenuItem icon={<AlertCircle className="w-5 h-5" strokeWidth={2} />} label="긴급 연락처" onClick={() => go("/emergency")} showDivider={false} />
            </div>
          </div>

          {/* Settings Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2">설정</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <MenuItem icon={<Bell className="w-5 h-5" strokeWidth={2} />} label="알림 설정" onClick={() => go("/notification-settings")} />
              <MenuItem icon={<Settings className="w-5 h-5" strokeWidth={2} />} label="앱 설정" onClick={() => go("/app-settings")} />
              <MenuItem icon={<HelpCircle className="w-5 h-5" strokeWidth={2} />} label="고객센터" onClick={() => go("/support")} showDivider={false} />
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-4 flex items-center justify-center gap-2 text-red-700 font-medium active:scale-95 transition-transform"
          >
            <LogOut className="w-5 h-5" strokeWidth={2} />
            로그아웃
          </button>

          <div className="text-center mt-6 mb-4">
            <p className="text-xs text-gray-500">버전 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
      <p className="text-xs text-blue-100 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  value,
  onClick,
  showDivider = true,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
  showDivider?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-4 flex items-center gap-3 text-left active:bg-gray-50 transition-colors ${
        showDivider ? "border-b border-gray-100" : ""
      }`}
    >
      <div className="text-gray-500">{icon}</div>
      <span className="flex-1 font-medium text-gray-900">{label}</span>
      {value ? (
        <span className="text-sm text-gray-500">{value}</span>
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-400" strokeWidth={2} />
      )}
    </button>
  );
}
