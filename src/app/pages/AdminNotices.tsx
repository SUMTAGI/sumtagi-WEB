import { useState, useEffect, useRef } from "react";
import {
  Plus, Pencil, Pin, PinOff, Archive, Eye, EyeOff, X, Loader2,
  AlertCircle, Inbox, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminNoticeService, validateNoticeInput, type Notice, type NoticeInput, type NoticeStatus,
} from "../../lib/adminNoticeService";
import { ListSkeleton } from "../components/SkeletonLoader";

const STATUS_META: Record<NoticeStatus, { label: string; badgeClass: string }> = {
  draft: { label: "비공개", badgeClass: "bg-gray-100 text-gray-500 border-gray-200" },
  published: { label: "게시 중", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  archived: { label: "보관됨", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
};

const EMPTY_FORM: NoticeInput = { title: "", content: "", status: "draft", pinned: false };

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NoticeInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const result = await adminNoticeService.getAllNotices();
    if (!result.success) {
      setError(result.error || "공지 목록을 불러오지 못했어요");
      setLoading(false);
      return;
    }
    setNotices(result.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (formOpen) titleRef.current?.focus(); }, [formOpen]);
  useEffect(() => {
    if (!formOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFormOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [formOpen]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setForm({ title: notice.title, content: notice.content, status: notice.status, pinned: notice.pinned });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const inputError = validateNoticeInput(form);
    if (inputError) { setFormError(inputError); return; }

    setSaving(true);
    const result = editingId
      ? await adminNoticeService.updateNotice(editingId, form)
      : await adminNoticeService.createNotice(form);
    setSaving(false);

    if (!result.success) {
      setFormError(result.error || "저장에 실패했어요. 다시 시도해주세요");
      return;
    }
    toast.success(editingId ? "공지를 수정했어요" : "공지를 작성했어요");
    setFormOpen(false);
    load();
  };

  const handleToggleStatus = async (notice: Notice, next: NoticeStatus) => {
    setProcessingId(notice.id);
    const result = await adminNoticeService.setNoticeStatus(notice.id, next, notice.title);
    setProcessingId(null);
    if (!result.success) {
      toast.error(result.error || "상태 변경에 실패했어요");
      return;
    }
    setNotices((prev) => prev.map((n) => (n.id === notice.id ? { ...n, status: next } : n)));
    toast.success(next === "published" ? "공지를 게시했어요" : next === "archived" ? "공지를 보관했어요" : "공지를 비공개로 바꿨어요");
  };

  const handleTogglePin = async (notice: Notice) => {
    setProcessingId(notice.id);
    const result = await adminNoticeService.setNoticePinned(notice.id, !notice.pinned, notice.title);
    setProcessingId(null);
    if (!result.success) {
      toast.error(result.error || "고정 설정에 실패했어요");
      return;
    }
    setNotices((prev) =>
      prev.map((n) => (n.id === notice.id ? { ...n, pinned: !n.pinned } : n))
        .sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1))
    );
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-5 lg:py-8">
      <div className="flex items-center justify-between mb-5 lg:mb-6 gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">공지사항 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">공지를 작성하고 게시 여부를 관리해요</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">새 공지 작성</span>
        </button>
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
        <ListSkeleton count={4} />
      ) : notices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-gray-500 mb-4">작성된 공지가 없어요</p>
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
            <Plus className="w-4 h-4" strokeWidth={2} /> 첫 공지 작성하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-5">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  {n.pinned && <Pin className="w-3.5 h-3.5 text-blue-500 shrink-0" strokeWidth={2.5} />}
                  <h3 className="font-semibold text-gray-900 truncate">{n.title}</h3>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${STATUS_META[n.status].badgeClass}`}>
                  {STATUS_META[n.status].label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{n.content}</p>
              <p className="text-[11px] text-gray-400 mb-3">
                {n.published_at ? `게시일 ${formatDateTime(n.published_at)}` : `작성일 ${formatDateTime(n.created_at)}`}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openEdit(n)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={2} /> 수정
                </button>
                {n.status === "published" ? (
                  <button
                    onClick={() => handleToggleStatus(n, "draft")}
                    disabled={processingId === n.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors disabled:opacity-60"
                  >
                    <EyeOff className="w-3.5 h-3.5" strokeWidth={2} /> 비공개로
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(n, "published")}
                    disabled={processingId === n.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors disabled:opacity-60"
                  >
                    <Eye className="w-3.5 h-3.5" strokeWidth={2} /> 게시하기
                  </button>
                )}
                <button
                  onClick={() => handleTogglePin(n)}
                  disabled={processingId === n.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors disabled:opacity-60"
                >
                  {n.pinned ? <><PinOff className="w-3.5 h-3.5" strokeWidth={2} /> 고정 해제</> : <><Pin className="w-3.5 h-3.5" strokeWidth={2} /> 상단 고정</>}
                </button>
                {n.status !== "archived" && (
                  <button
                    onClick={() => handleToggleStatus(n, "archived")}
                    disabled={processingId === n.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    <Archive className="w-3.5 h-3.5" strokeWidth={2} /> 보관
                  </button>
                )}
                {processingId === n.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" strokeWidth={2} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div role="dialog" aria-modal="true" aria-label={editingId ? "공지 수정" : "공지 작성"} className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" onClick={() => setFormOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">{editingId ? "공지 수정" : "새 공지 작성"}</h3>
              <button onClick={() => setFormOpen(false)} aria-label="닫기" className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">제목</label>
                <input
                  ref={titleRef}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="예: 추석 연휴 여객선 운항 안내"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">내용</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  rows={6}
                  placeholder="공지 내용을 입력해주세요"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">상태</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as NoticeStatus }))}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="draft">비공개</option>
                    <option value="published">게시</option>
                    <option value="archived">보관</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">상단 고정</label>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, pinned: !f.pinned }))}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                      form.pinned ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    {form.pinned ? "고정함" : "고정 안 함"}
                  </button>
                </div>
              </div>
            </div>

            {formError && (
              <p className="text-xs text-red-500 mt-4 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} /> {formError}
              </p>
            )}

            <div className="flex gap-2.5 mt-6">
              <button onClick={() => setFormOpen(false)} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors">
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                {editingId ? "저장하기" : "작성하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
