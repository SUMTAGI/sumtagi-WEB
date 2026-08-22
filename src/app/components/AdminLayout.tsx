import { NavLink, Outlet } from "react-router";
import {
  LayoutDashboard, Users, Building2, Map, Megaphone, MessageSquare, History,
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

// /admin 하위 모든 화면이 공유하는 섹션 이동 탭. 각 페이지 자체의 헤더(뒤로가기,
// 제목, 액션 버튼)는 그대로 유지하고, 그 위에 이 탭만 얹어 다른 관리 화면으로
// 바로 이동할 수 있게 한다.
export function AdminLayout() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <nav className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-[1200px] mx-auto flex gap-1 px-3 lg:px-8 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`
              }
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
