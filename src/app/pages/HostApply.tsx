import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Building2, FileText, ClipboardCheck, CheckCircle2, Rocket,
  Info, Loader2, XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/useAuth";
import { hostService, type HostApplication, type HostStatus } from "../../lib/hostService";

const STEPS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "write", label: "신청서 작성", icon: FileText },
  { key: "review", label: "관리자 검토", icon: ClipboardCheck },
  { key: "approved", label: "승인", icon: CheckCircle2 },
  { key: "listing", label: "숙소 등록 가능", icon: Rocket },
];

function currentStepIndex(status: HostStatus | null): number {
  if (status === "approved") return 2;
  if (status === "pending" || status === "rejected") return 1;
  return 0;
}

const STATUS_META: Record<HostStatus, { label: string; badgeClass: string; icon: LucideIcon }> = {
  pending: { label: "검토 중", badgeClass: "bg-amber-50 text-amber-700 border-amber-200", icon: ClipboardCheck },
  approved: { label: "승인 완료", badgeClass: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  rejected: { label: "반려됨", badgeClass: "bg-red-50 text-red-600 border-red-200", icon: XCircle },
};

export function HostApply() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [application, setApplication] = useState<HostApplication | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState("");
  const [errors, setErrors] = useState<{ businessName?: string; phone?: string }>({});

  useEffect(() => {
    if (!user) { setFetching(false); return; }
    hostService.getMyHostApplication().then((app) => {
      setApplication(app);
      if (app) {
        setBusinessName(app.business_name);
        setRepresentativeName(app.representative_name ?? "");
        setPhone(app.phone);
        setBusinessRegistrationNumber(app.business_registration_number ?? "");
      }
      setFetching(false);
    });
  }, [user]);

  const validate = () => {
    const next: typeof errors = {};
    if (!businessName.trim()) next.businessName = "상호명을 입력해주세요";
    if (!phone.trim()) next.phone = "연락처를 입력해주세요";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (saving || resubmitting) return;
    if (!validate()) { toast.error("필수 항목을 확인해주세요"); return; }

    setSaving(true);
    const input = { businessName, representativeName, phone, businessRegistrationNumber };
    const result = application
      ? await hostService.updateHostApplication(input)
      : await hostService.createHostApplication(input);
    setSaving(false);

    if (!result) {
      toast.error(application ? "저장에 실패했어요. 다시 시도해주세요" : "신청에 실패했어요. 다시 시도해주세요");
      return;
    }
    setApplication(result);
    toast.success(application ? "신청 정보가 저장됐어요" : "숙소 운영자 신청이 접수됐어요");
  };

  const handleResubmit = async () => {
    if (saving || resubmitting) return;
    if (!validate()) { toast.error("필수 항목을 확인해주세요"); return; }

    setResubmitting(true);
    const updated = await hostService.updateHostApplication({
      businessName, representativeName, phone, businessRegistrationNumber,
    });
    if (!updated) {
      setResubmitting(false);
      toast.error("저장에 실패했어요. 다시 시도해주세요");
      return;
    }
    const ok = await hostService.resubmitHostApplication();
    setResubmitting(false);
    if (!ok) {
      toast.error("재신청에 실패했어요. 다시 시도해주세요");
      return;
    }
    setApplication({ ...updated, status: "pending", rejection_reason: null });
    toast.success("재신청이 접수됐어요");
  };

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const status = application?.status ?? null;
  const isApproved = status === "approved";
  const isEditable = !application || status === "pending" || status === "rejected";
  const stepIdx = currentStepIndex(status);
  const StatusIcon = status ? STATUS_META[status].icon : null;

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
        <button onClick={() => navigate("/my")} className="active:scale-95 transition-transform shrink-0">
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
          <Building2 className="w-4.5 h-4.5 text-blue-600" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">숙소 운영자 신청</h1>
          <p className="text-xs text-gray-500">섬타기에 숙소를 등록하고 게스트를 맞이해보세요</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 py-6 lg:py-10">

        {/* 입점 절차 안내 (진행 상태) */}
        <div className="mb-6 bg-gray-50 rounded-2xl p-5">
          <div className="flex items-start">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isRejectedFork = status === "rejected" && i === 1;
              const done = i < stepIdx || (i === stepIdx && isApproved);
              const current = i === stepIdx && !isApproved;
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center relative">
                  {i > 0 && (
                    <div
                      className={`absolute top-4 right-1/2 w-full h-0.5 ${i <= stepIdx ? "bg-blue-600" : "bg-gray-200"}`}
                    />
                  )}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                      isRejectedFork
                        ? "bg-red-50 border-red-300 text-red-500"
                        : done
                        ? "bg-blue-600 border-blue-600 text-white"
                        : current
                        ? "bg-white border-blue-600 text-blue-600"
                        : "bg-white border-gray-200 text-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <span
                    className={`mt-1.5 text-[11px] text-center leading-tight font-medium ${
                      isRejectedFork ? "text-red-500" : done || current ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 상태 배지 + 안내 문구 */}
        {status && StatusIcon ? (
          <div className={`mb-5 rounded-2xl border p-4 ${STATUS_META[status].badgeClass}`}>
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon className="w-4 h-4" strokeWidth={2} />
              <span className="font-semibold text-sm">{STATUS_META[status].label}</span>
            </div>
            <p className="text-sm leading-relaxed">
              {status === "pending" && "입점 신청을 검토 중입니다. 검토는 영업일 기준 1~3일 정도 소요돼요."}
              {status === "approved" && "호스트 승인이 완료되었습니다. 숙소 등록 기능은 곧 열릴 예정이에요."}
              {status === "rejected" && (application?.rejection_reason || "제출하신 정보를 다시 확인한 뒤 재신청해주세요.")}
            </p>
          </div>
        ) : (
          <div className="mb-5 flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-sm text-blue-700 leading-relaxed">
              신청서 제출 후 관리자 검토를 거쳐 승인되면 숙소를 등록할 수 있어요.
            </p>
          </div>
        )}

        {/* 신청 폼 */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              상호명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={!isEditable}
              placeholder="예: 섬타기 게스트하우스"
              className={`w-full px-4 py-3 border-2 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500 ${
                errors.businessName ? "border-red-300" : "border-gray-200 focus:border-blue-500"
              }`}
            />
            {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">대표자명</label>
            <input
              type="text"
              value={representativeName}
              onChange={(e) => setRepresentativeName(e.target.value)}
              disabled={!isEditable}
              placeholder="선택 입력"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              연락처 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!isEditable}
              placeholder="010-0000-0000"
              className={`w-full px-4 py-3 border-2 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500 ${
                errors.phone ? "border-red-300" : "border-gray-200 focus:border-blue-500"
              }`}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">사업자등록번호</label>
            <input
              type="text"
              value={businessRegistrationNumber}
              onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
              disabled={!isEditable}
              placeholder="선택 입력"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-6">
          {isApproved ? (
            <button
              disabled
              className="w-full bg-gray-100 text-gray-400 py-4 rounded-xl font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Rocket className="w-4 h-4" strokeWidth={2} />
              호스트 대시보드 (준비 중)
            </button>
          ) : status === "rejected" ? (
            <button
              onClick={handleResubmit}
              disabled={saving || resubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {resubmitting && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
              {resubmitting ? "재신청 처리 중..." : "재신청하기"}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving || resubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
              {saving ? "처리 중..." : application ? "저장하기" : "숙소 운영자 신청"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
