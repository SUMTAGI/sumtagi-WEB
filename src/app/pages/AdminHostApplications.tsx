import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, User, Phone, Hash, Calendar, Clock, CheckCircle2, XCircle,
  ClipboardCheck, X, Loader2, AlertCircle, Inbox, RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { adminHostService, type HostApplicationWithProfile } from "../../lib/adminHostService";
import type { HostStatus } from "../../lib/hostService";
import { ListItemSkeleton } from "../components/SkeletonLoader";

const FILTERS: { key: "all" | HostStatus; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "검토 중" },
  { key: "approved", label: "승인" },
  { key: "rejected", label: "반려" },
];

const STATUS_META: Record<HostStatus, { label: string; badgeClass: string; icon: LucideIcon }> = {
  pending: { label: "검토 중", badgeClass: "bg-amber-50 text-amber-700 border-amber-200", icon: ClipboardCheck },
  approved: { label: "승인", badgeClass: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  rejected: { label: "반려", badgeClass: "bg-red-50 text-red-600 border-red-200", icon: XCircle },
};

function StatusBadge({ status }: { status: HostStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${meta.badgeClass}`}>
      <Icon className="w-3 h-3" strokeWidth={2} />
      {meta.label}
    </span>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export function AdminHostApplications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<HostApplicationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | HostStatus>("pending");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const rejectTextareaRef = useRef<HTMLTextAreaElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const result = await adminHostService.getHostApplications();
    if (!result.success) {
      setError(result.error || "목록을 불러오지 못했어요");
      setLoading(false);
      return;
    }
    setApplications(result.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Esc로 모달 닫기
  useEffect(() => {
    if (!confirmApprove && !rejectModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setConfirmApprove(false); setRejectModalOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmApprove, rejectModalOpen]);

  useEffect(() => {
    if (confirmApprove) cancelBtnRef.current?.focus();
  }, [confirmApprove]);

  useEffect(() => {
    if (rejectModalOpen) rejectTextareaRef.current?.focus();
  }, [rejectModalOpen]);

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };
  const filtered = filter === "all" ? applications : applications.filter((a) => a.status === filter);
  const selected = applications.find((a) => a.id === selectedId) ?? null;

  const handleApprove = async () => {
    if (!selected) return;
    setProcessingId(selected.id);
    const result = await adminHostService.approveHostApplication(selected.id);
    setProcessingId(null);
    if (!result.success) {
      toast.error(result.error || "승인에 실패했어요. 다시 시도해주세요");
      return;
    }
    setApplications((prev) => prev.map((a) => (a.id === selected.id ? { ...a, status: "approved", rejection_reason: null } : a)));
    setConfirmApprove(false);
    toast.success("호스트로 승인됐어요");
  };

  const handleReject = async () => {
    if (!selected) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length < 5) {
      setRejectError("반려 사유를 5자 이상 입력해주세요");
      return;
    }
    setProcessingId(selected.id);
    const result = await adminHostService.rejectHostApplication(selected.id, trimmed);
    setProcessingId(null);
    if (!result.success) {
      toast.error(result.error || "반려 처리에 실패했어요. 다시 시도해주세요");
      return;
    }
    setApplications((prev) => prev.map((a) => (a.id === selected.id ? { ...a, status: "rejected", rejection_reason: trimmed } : a)));
    setRejectModalOpen(false);
    toast.success("신청을 반려했어요");
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3">
        <button onClick={() => navigate("/my")} className="active:scale-95 transition-transform shrink-0" aria-label="마이페이지로 돌아가기">
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <div>
          <h1 className="text-lg lg:text-xl font-bold text-gray-900">숙소 운영자 신청 관리</h1>
          <p className="text-xs lg:text-sm text-gray-500">신청서를 검토하고 승인 또는 반려해요</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-5 lg:py-8">

        {/* 필터 */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {FILTERS.map(({ key, label }) => (
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* 목록 (40%) */}
          <div className="lg:col-span-2 space-y-2.5">
            {error ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" strokeWidth={2} />
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                <button onClick={load} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                  <RefreshCw className="w-4 h-4" strokeWidth={2} /> 다시 시도
                </button>
              </div>
            ) : loading ? (
              <div className="space-y-2.5">
                {[...Array(4)].map((_, i) => <ListItemSkeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-sm text-gray-500">
                  {filter === "pending" ? "검토 대기 중인 신청이 없어요" : "해당하는 신청이 없어요"}
                </p>
              </div>
            ) : (
              filtered.map((app) => (
                <button
                  key={app.id}
                  onClick={() => setSelectedId(app.id)}
                  aria-label={`${app.business_name} 신청서 상세 보기`}
                  className={`w-full text-left bg-white rounded-2xl border p-4 transition-colors ${
                    selectedId === app.id ? "border-blue-300 bg-blue-50/40" : "border-gray-100 hover:border-blue-200 hover:bg-blue-50/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="font-semibold text-sm text-gray-900 truncate">{app.business_name}</p>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {app.representative_name || "대표자 미입력"} · {app.phone}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1.5">{formatDateTime(app.created_at)} 신청</p>
                </button>
              ))
            )}
          </div>

          {/* 상세 (60%) — 모바일에서는 selectedId가 있을 때만 전체화면 오버레이 */}
          <div
            className={`${selectedId ? "fixed inset-0 z-40 bg-white overflow-y-auto px-4 py-4" : "hidden"} lg:static lg:z-auto lg:block lg:bg-transparent lg:overflow-visible lg:px-0 lg:py-0 lg:col-span-3`}
          >
            {selected ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 lg:sticky lg:top-6">
                <button
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden mb-4 inline-flex items-center gap-1 text-sm text-gray-500"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={2} /> 목록으로
                </button>

                <div className="flex items-start justify-between gap-3 mb-5">
                  <h2 className="text-lg font-bold text-gray-900">{selected.business_name}</h2>
                  <StatusBadge status={selected.status} />
                </div>

                <div className="mb-6">
                  <DetailRow icon={User} label="신청자" value={selected.profiles?.nickname ?? "알 수 없음"} />
                  <DetailRow icon={User} label="대표자명" value={selected.representative_name ?? "-"} />
                  <DetailRow icon={Phone} label="연락처" value={selected.phone} />
                  <DetailRow icon={Hash} label="사업자등록번호" value={selected.business_registration_number ?? "-"} />
                  <DetailRow icon={Calendar} label="신청일" value={formatDateTime(selected.created_at)} />
                  <DetailRow icon={Clock} label="최근 수정일" value={formatDateTime(selected.updated_at)} />
                </div>

                {selected.status === "rejected" && selected.rejection_reason && (
                  <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-red-600 mb-1">반려 사유</p>
                    <p className="text-sm text-red-700 leading-relaxed">{selected.rejection_reason}</p>
                  </div>
                )}

                {selected.status === "pending" ? (
                  <div className="flex gap-2.5">
                    <button
                      aria-label="신청 승인"
                      onClick={() => setConfirmApprove(true)}
                      disabled={processingId === selected.id}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      승인
                    </button>
                    <button
                      aria-label="신청 반려"
                      onClick={() => { setRejectReason(""); setRejectError(""); setRejectModalOpen(true); }}
                      disabled={processingId === selected.id}
                      className="flex-1 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      반려
                    </button>
                  </div>
                ) : selected.status === "approved" ? (
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-xl px-4 py-3 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} /> 승인 완료된 신청이에요
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-gray-50 text-gray-500 rounded-xl px-4 py-3 text-sm font-medium">
                    <XCircle className="w-4 h-4 shrink-0" strokeWidth={2} /> 반려된 신청이에요. 재신청하면 다시 검토 목록에 나타나요.
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex bg-white rounded-2xl border border-gray-100 p-10 text-center items-center justify-center min-h-[280px]">
                <p className="text-sm text-gray-400">왼쪽 목록에서 신청서를 선택해주세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 승인 확인 모달 */}
      {confirmApprove && selected && (
        <div role="dialog" aria-modal="true" aria-label="승인 확인" className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={() => setConfirmApprove(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">신청을 승인할까요?</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              이 신청을 승인하면 해당 사용자가 호스트 권한을 갖게 됩니다.
            </p>
            <div className="flex gap-2.5">
              <button
                ref={cancelBtnRef}
                onClick={() => setConfirmApprove(false)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleApprove}
                disabled={processingId === selected.id}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingId === selected.id && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                승인하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 반려 모달 */}
      {rejectModalOpen && selected && (
        <div role="dialog" aria-modal="true" aria-label="반려 사유 입력" className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={() => setRejectModalOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-gray-900">신청 반려</h3>
              <button onClick={() => setRejectModalOpen(false)} aria-label="닫기" className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              반려 사유는 신청자에게 그대로 전달돼요. 구체적으로 작성해주세요.
            </p>
            <textarea
              ref={rejectTextareaRef}
              value={rejectReason}
              onChange={(e) => { setRejectReason(e.target.value); if (rejectError) setRejectError(""); }}
              rows={4}
              placeholder="예: 제출하신 사업자등록번호를 확인할 수 없습니다. 정확한 번호로 다시 신청해주세요."
              className={`w-full px-4 py-3 border-2 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                rejectError ? "border-red-300" : "border-gray-200 focus:border-blue-500"
              }`}
            />
            {rejectError && <p className="text-xs text-red-500 mt-1.5">{rejectError}</p>}
            <div className="flex gap-2.5 mt-5">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === selected.id}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingId === selected.id && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                반려하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
