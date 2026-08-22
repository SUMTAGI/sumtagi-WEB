import { useState, useEffect } from "react";
import { EyeOff, Eye, Trash2, AlertCircle, Inbox, RefreshCw, Loader2, Flag } from "lucide-react";
import { toast } from "sonner";
import { adminCommunityService, type AdminCommunityPost } from "../../lib/adminCommunityService";
import { ListSkeleton } from "../components/SkeletonLoader";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminCommunity() {
  const [posts, setPosts] = useState<AdminCommunityPost[]>([]);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCommunityPost | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const [postsResult, counts] = await Promise.all([
      adminCommunityService.getAllPosts(),
      adminCommunityService.getReportCounts(),
    ]);
    if (!postsResult.success) {
      setError(postsResult.error || "게시글 목록을 불러오지 못했어요");
      setLoading(false);
      return;
    }
    setPosts(postsResult.data ?? []);
    setReportCounts(counts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = posts.filter((p) => {
    if (filter === "visible") return !p.hidden_at;
    if (filter === "hidden") return !!p.hidden_at;
    return true;
  });
  const counts = {
    all: posts.length,
    visible: posts.filter((p) => !p.hidden_at).length,
    hidden: posts.filter((p) => !!p.hidden_at).length,
  };

  const handleHide = async (post: AdminCommunityPost) => {
    setProcessingId(post.id);
    const result = await adminCommunityService.hidePost(post.id, post.title);
    setProcessingId(null);
    if (!result.success) { toast.error(result.error || "숨김 처리에 실패했어요"); return; }
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, hidden_at: new Date().toISOString() } : p)));
    toast.success("게시글을 숨겼어요");
  };

  const handleUnhide = async (post: AdminCommunityPost) => {
    setProcessingId(post.id);
    const result = await adminCommunityService.unhidePost(post.id, post.title);
    setProcessingId(null);
    if (!result.success) { toast.error(result.error || "숨김 해제에 실패했어요"); return; }
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, hidden_at: null } : p)));
    toast.success("게시글 숨김을 해제했어요");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setProcessingId(deleteTarget.id);
    const result = await adminCommunityService.deletePost(deleteTarget.id, deleteTarget.title);
    setProcessingId(null);
    if (!result.success) { toast.error(result.error || "삭제에 실패했어요"); setDeleteTarget(null); return; }
    setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("게시글을 삭제했어요");
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-5 lg:py-8">
      <div className="mb-5 lg:mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">커뮤니티 관리</h1>
        <p className="text-sm text-gray-500 mt-0.5">신고된 글을 확인하고 노출 여부를 관리해요</p>
      </div>

      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {([
          { key: "all", label: "전체" },
          { key: "visible", label: "공개" },
          { key: "hidden", label: "숨김" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === key ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-blue-200"
            }`}
          >
            {label} <span className={filter === key ? "text-blue-100" : "text-gray-400"}>{counts[key]}</span>
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
          <p className="text-sm text-gray-500">해당하는 게시글이 없어요</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                  <th className="px-4 py-3 font-medium">제목</th>
                  <th className="px-4 py-3 font-medium">작성자</th>
                  <th className="px-4 py-3 font-medium">작성일</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">신고</th>
                  <th className="px-4 py-3 font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const reportCount = reportCounts[p.id] ?? 0;
                  return (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                      <td className="px-4 py-3 max-w-[280px]">
                        <p className="font-medium text-gray-900 truncate">{p.title}</p>
                        {p.island_name && <p className="text-xs text-gray-400">{p.island_name}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.author_name}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateTime(p.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          p.hidden_at ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {p.hidden_at ? "숨김" : "공개"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {reportCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
                            <Flag className="w-3 h-3" strokeWidth={2.5} /> {reportCount}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {p.hidden_at ? (
                            <button
                              onClick={() => handleUnhide(p)}
                              disabled={processingId === p.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors disabled:opacity-60"
                            >
                              <Eye className="w-3.5 h-3.5" strokeWidth={2} /> 해제
                            </button>
                          ) : (
                            <button
                              onClick={() => handleHide(p)}
                              disabled={processingId === p.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors disabled:opacity-60"
                            >
                              <EyeOff className="w-3.5 h-3.5" strokeWidth={2} /> 숨김
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(p)}
                            disabled={processingId === p.id}
                            aria-label="게시글 삭제"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-60"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                          {processingId === p.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" strokeWidth={2} />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div role="dialog" aria-modal="true" aria-label="게시글 삭제 확인" className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={() => setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">게시글을 삭제할까요?</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              {`'${deleteTarget.title}' 게시글을 삭제하면 되돌릴 수 없어요. 되돌릴 수 있는 조치가 필요하면 삭제 대신 숨김을 이용해주세요.`}
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors">
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={processingId === deleteTarget.id}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingId === deleteTarget.id && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
