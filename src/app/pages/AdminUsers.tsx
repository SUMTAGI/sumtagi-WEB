import { useState, useEffect, useMemo } from "react";
import { Search, X, AlertCircle, Inbox, RefreshCw, Loader2, ShieldCheck, Building2, User as UserIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/useAuth";
import { adminUserService, type AdminUserRow } from "../../lib/adminUserService";
import type { UserRole } from "../../lib/hostService";
import { ListSkeleton } from "../components/SkeletonLoader";

const ROLE_FILTERS: { key: "all" | UserRole; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "user", label: "user" },
  { key: "host", label: "host" },
  { key: "admin", label: "admin" },
];

const ROLE_META: Record<UserRole, { label: string; badgeClass: string; icon: LucideIcon }> = {
  user: { label: "user", badgeClass: "bg-gray-100 text-gray-600 border-gray-200", icon: UserIcon },
  host: { label: "host", badgeClass: "bg-amber-50 text-amber-700 border-amber-200", icon: Building2 },
  admin: { label: "admin", badgeClass: "bg-blue-50 text-blue-700 border-blue-200", icon: ShieldCheck },
};

const HOST_STATUS_LABEL: Record<string, string> = {
  pending: "호스트 신청 검토 중",
  approved: "호스트 승인됨",
  rejected: "호스트 신청 반려됨",
};

function RoleBadge({ role }: { role: UserRole }) {
  const meta = ROLE_META[role];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${meta.badgeClass}`}>
      <Icon className="w-3 h-3" strokeWidth={2} /> {meta.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export function AdminUsers() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ user: AdminUserRow; newRole: UserRole } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const result = await adminUserService.getAllUsers();
    if (!result.success) {
      setError(result.error || "사용자 목록을 불러오지 못했어요");
      setLoading(false);
      return;
    }
    setUsers(result.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const roleMatch = roleFilter === "all" || u.role === roleFilter;
      const searchMatch = q === "" ||
        (u.email?.toLowerCase().includes(q) ?? false) ||
        (u.nickname?.toLowerCase().includes(q) ?? false);
      return roleMatch && searchMatch;
    });
  }, [users, roleFilter, search]);

  const counts = {
    all: users.length,
    user: users.filter((u) => u.role === "user").length,
    host: users.filter((u) => u.role === "host").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  // 관리자→관리자 아님(user/host)으로의 변경, 그리고 자기 자신의 role 변경은
  // 실수하면 되돌리기 번거로우므로 항상 확인 모달을 거친다. 그 외(user↔host,
  // user/host→admin)는 바로 적용한다.
  const requestRoleChange = (targetUser: AdminUserRow, newRole: UserRole) => {
    if (targetUser.id === currentUser?.id) {
      toast.error("자기 자신의 role은 이 화면에서 바꿀 수 없어요");
      return;
    }
    if (targetUser.role === "admin" && newRole !== "admin") {
      setConfirmTarget({ user: targetUser, newRole });
      return;
    }
    applyRoleChange(targetUser, newRole);
  };

  const applyRoleChange = async (targetUser: AdminUserRow, newRole: UserRole) => {
    setProcessingId(targetUser.id);
    const result = await adminUserService.updateUserRole(targetUser.id, newRole);
    setProcessingId(null);
    setConfirmTarget(null);
    if (!result.success) {
      toast.error(result.error || "role 변경에 실패했어요");
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u)));
    toast.success(`${targetUser.nickname ?? targetUser.email}님의 role을 ${newRole}(으)로 변경했어요`);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-5 lg:py-8">
      <div className="mb-5 lg:mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">사용자 관리</h1>
        <p className="text-sm text-gray-500 mt-0.5">가입한 사용자를 검색하고 role을 변경해요</p>
      </div>

      {/* 검색 */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이메일 또는 닉네임 검색"
          className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* 필터 */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {ROLE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setRoleFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              roleFilter === key ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-blue-200"
            }`}
          >
            {label} <span className={roleFilter === key ? "text-blue-100" : "text-gray-400"}>{counts[key]}</span>
          </button>
        ))}
      </div>

      {error ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" strokeWidth={2} />
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button onClick={load} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
            <RefreshCw className="w-4 h-4" strokeWidth={2} /> 다시 시도
          </button>
        </div>
      ) : loading ? (
        <ListSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-gray-500">{search ? "검색 결과가 없어요" : "해당하는 사용자가 없어요"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                  <th className="px-4 py-3 font-medium">사용자</th>
                  <th className="px-4 py-3 font-medium">role</th>
                  <th className="px-4 py-3 font-medium">가입일</th>
                  <th className="px-4 py-3 font-medium">최근 수정일</th>
                  <th className="px-4 py-3 font-medium">role 변경</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{u.nickname ?? "닉네임 없음"} {isSelf && <span className="text-xs text-blue-500">(나)</span>}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                        {u.host_status && (
                          <p className="text-[11px] text-amber-600 mt-0.5">{HOST_STATUS_LABEL[u.host_status] ?? u.host_status}</p>
                        )}
                      </td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(u.updated_at)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          disabled={isSelf || processingId === u.id}
                          onChange={(e) => requestRoleChange(u, e.target.value as UserRole)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="user">user</option>
                          <option value="host">host</option>
                          <option value="admin">admin</option>
                        </select>
                        {processingId === u.id && <Loader2 className="inline-block w-3.5 h-3.5 ml-2 animate-spin text-gray-400" strokeWidth={2} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* admin → user/host 위험 변경 확인 모달 */}
      {confirmTarget && (
        <div role="dialog" aria-modal="true" aria-label="권한 변경 확인" className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={() => setConfirmTarget(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">관리자 권한을 해제할까요?</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              {`'${confirmTarget.user.nickname ?? confirmTarget.user.email}'님의 role을 admin에서 ${confirmTarget.newRole}(으)로 바꾸면 관리자 화면에 더 이상 접근할 수 없어요.`}
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmTarget(null)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => applyRoleChange(confirmTarget.user, confirmTarget.newRole)}
                disabled={processingId === confirmTarget.user.id}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingId === confirmTarget.user.id && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                권한 해제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
