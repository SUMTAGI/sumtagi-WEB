import { useState, useEffect, useMemo } from "react";
import { Search, X, AlertCircle, Inbox, RefreshCw, History } from "lucide-react";
import { adminAuditLogService, type AdminAuditLog } from "../../lib/adminAuditLogService";
import { ListSkeleton } from "../components/SkeletonLoader";

const ACTION_LABEL: Record<string, string> = {
  role_change: "권한 변경",
  host_approve: "숙박 신청 승인",
  host_reject: "숙박 신청 반려",
  island_create: "섬 추가",
  island_update: "섬 수정",
  island_status_change: "섬 활성/비활성",
  island_reorder: "섬 순서 변경",
  island_delete: "섬 삭제",
  notice_create: "공지 작성",
  notice_update: "공지 수정",
  notice_status_change: "공지 상태 변경",
  notice_pin_change: "공지 고정 변경",
  post_hide: "게시글 숨김",
  post_unhide: "게시글 숨김 해제",
  post_delete: "게시글 삭제",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    const result = await adminAuditLogService.getLogs();
    if (!result.success) {
      setError(result.error || "작업 로그를 불러오지 못했어요");
      setLoading(false);
      return;
    }
    setLogs(result.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const actions = useMemo(() => Array.from(new Set(logs.map((l) => l.action))), [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      const actionMatch = actionFilter === "all" || l.action === actionFilter;
      const searchMatch = q === "" || l.summary.toLowerCase().includes(q);
      return actionMatch && searchMatch;
    });
  }, [logs, actionFilter, search]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-5 lg:py-8">
      <div className="mb-5 lg:mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">관리자 작업 로그</h1>
        <p className="text-sm text-gray-500 mt-0.5">권한 변경, 승인/반려, 콘텐츠 관리 이력을 확인해요 (최근 200건)</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="요약 내용 검색"
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">모든 작업</option>
          {actions.map((a) => <option key={a} value={a}>{ACTION_LABEL[a] ?? a}</option>)}
        </select>
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
          <p className="text-sm text-gray-500">기록된 작업 로그가 없어요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <History className="w-4 h-4 text-gray-400" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {ACTION_LABEL[log.action] ?? log.action}
                  </span>
                  <span className="text-xs text-gray-400">{log.profiles?.nickname ?? "알 수 없음"}</span>
                </div>
                <p className="text-sm text-gray-900 mt-1">{log.summary}</p>
                <p className="text-[11px] text-gray-400 mt-1">{formatDateTime(log.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
