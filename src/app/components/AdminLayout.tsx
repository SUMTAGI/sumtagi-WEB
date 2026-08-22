import { NavLink, Link, Outlet } from "react-router";
import { Toaster } from "sonner";
import {
  Ship, ArrowLeft, LayoutDashboard, Users, Building2, Map, Megaphone, MessageSquare, History,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/admin", label: "대시보드", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "사용자", icon: Users },
  { to: "/admin/hosts", label: "숙박 신청", icon: Building2 },
  { to: "/admin/islands", label: "섬 관리", icon: Map },
  { to: "/admin/notices", label: "공지사항", icon: Megaphone },
  { to: "/admin/community", label: "커뮤니티", icon: MessageSquare },
  { to: "/admin/logs", label: "작업 로그", icon: History },
];

const TOASTER_STYLE = {
  background: "white",
  color: "#111827",
  border: "none",
  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
};

// 일반 사용자 Layout(상단 홈/섬탐색/여행계획/커뮤니티 네비 + 하단 탭바)과는
// 완전히 분리된, /admin 전용 최상위 레이아웃. routes.tsx에서 Layout이 아니라
// 이 컴포넌트를 루트로 써서 일반 화면 네비게이션이 관리자 화면에 전혀
// 섞이지 않게 한다(요구사항: "관리자 전용 콘솔로 분리").
export function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" toastOptions={{ style: TOASTER_STYLE }} />

      <header className="bg-gray-900 text-white">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Ship className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight">섬타기</span>
            <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded-full">ADMIN</span>
          </div>
          <Link
            to="/my"
            className="flex items-center gap-1.5 text-xs lg:text-sm text-gray-300 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">일반 화면으로 돌아가기</span>
            <span className="sm:hidden">일반 화면</span>
          </Link>
        </div>

        <nav className="border-t border-white/10 overflow-x-auto">
          <div className="max-w-[1200px] mx-auto flex gap-1 px-3 lg:px-8 py-2">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  }`
                }
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <Outlet />
    </div>
  );
}
