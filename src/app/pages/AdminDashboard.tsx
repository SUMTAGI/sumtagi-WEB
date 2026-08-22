import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Users, UserCog, Building2, ShieldCheck, ClipboardCheck, Map, MapPinOff,
  AlertCircle, RefreshCw, ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { adminUserService, type AdminUserRow } from "../../lib/adminUserService";
import { adminHostService, type HostApplicationWithProfile } from "../../lib/adminHostService";
import { adminIslandService } from "../../lib/adminIslandService";
import { CardGridSkeleton } from "../components/SkeletonLoader";
import { useAuth } from "../../lib/useAuth";

interface Stats {
  totalUsers: number;
  userCount: number;
  hostCount: number;
  adminCount: number;
  pendingHosts: number;
  activeIslands: number;
  inactiveIslands: number;
}

function StatCard({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${tone}`}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export function AdminDashboard() {
  const { displayName } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [hosts, setHosts] = useState<HostApplicationWithProfile[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const [usersResult, hostsResult, islandsResult] = await Promise.all([
      adminUserService.getAllUsers(),
      adminHostService.getHostApplications(),
      adminIslandService.getAllIslands(),
    ]);

    if (!usersResult.success || !hostsResult.success || !islandsResult.success) {
      setError(usersResult.error || hostsResult.error || islandsResult.error || "대시보드 데이터를 불러오지 못했어요");
      setLoading(false);
      return;
    }

    const u = usersResult.data ?? [];
    const h = hostsResult.data ?? [];
    const islands = islandsResult.data ?? [];
    setUsers(u);
    setHosts(h);
    setStats({
      totalUsers: u.length,
      userCount: u.filter((x) => x.role === "user").length,
      hostCount: u.filter((x) => x.role === "host").length,
      adminCount: u.filter((x) => x.role === "admin").length,
      pendingHosts: h.filter((x) => x.status === "pending").length,
      activeIslands: islands.filter((x) => x.status === "active").length,
      inactiveIslands: islands.filter((x) => x.status === "inactive").length,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const recentUsers = users.slice(0, 5);
  const recentHosts = [...hosts].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-5 lg:py-8">
      <div className="mb-5 lg:mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{displayName}님 환영합니다</h1>
        <p className="text-sm text-gray-500 mt-0.5">섬타기 운영 현황을 확인하고 콘텐츠를 관리하세요</p>
      </div>

      {error ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" strokeWidth={2} />
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button onClick={load} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
            <RefreshCw className="w-4 h-4" strokeWidth={2} /> 다시 시도
          </button>
        </div>
      ) : loading || !stats ? (
        <CardGridSkeleton count={7} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <StatCard icon={Users} label="전체 사용자" value={stats.totalUsers} tone="bg-blue-50 text-blue-600" />
            <StatCard icon={UserCog} label="일반 사용자" value={stats.userCount} tone="bg-gray-100 text-gray-600" />
            <StatCard icon={Building2} label="호스트" value={stats.hostCount} tone="bg-amber-50 text-amber-600" />
            <StatCard icon={ShieldCheck} label="관리자" value={stats.adminCount} tone="bg-blue-50 text-blue-600" />
            <StatCard icon={ClipboardCheck} label="숙박 신청 대기" value={stats.pendingHosts} tone="bg-red-50 text-red-500" />
            <StatCard icon={Map} label="활성 섬" value={stats.activeIslands} tone="bg-blue-50 text-blue-600" />
            <StatCard icon={MapPinOff} label="비활성 섬" value={stats.inactiveIslands} tone="bg-gray-100 text-gray-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">최근 가입자</h2>
                <Link to="/admin/users" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                  전체 보기 <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
                </Link>
              </div>
              {recentUsers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">가입한 사용자가 없어요</p>
              ) : (
                <ul className="space-y-3">
                  {recentUsers.map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.nickname ?? "닉네임 없음"}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{formatDate(u.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">최근 숙박 신청</h2>
                <Link to="/admin/hosts" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                  전체 보기 <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
                </Link>
              </div>
              {recentHosts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">신청 내역이 없어요</p>
              ) : (
                <ul className="space-y-3">
                  {recentHosts.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{h.business_name}</p>
                        <p className="text-xs text-gray-400 truncate">{h.representative_name || "대표자 미입력"}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{formatDate(h.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
