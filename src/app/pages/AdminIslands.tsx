import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Plus, Pencil, Trash2, Eye, EyeOff, X, Loader2,
  AlertCircle, Inbox, RefreshCw, ImageOff, ChevronUp, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { IslandImage } from "../components/IslandImage";
import { CardGridSkeleton } from "../components/SkeletonLoader";
import type { Island } from "../../lib/api/islands";
import {
  adminIslandService, validateIslandId, validateIslandInput, type IslandInput,
} from "../../lib/adminIslandService";
import { logAdminAction } from "../../lib/adminAuditLogService";

const PORT_OPTIONS = ["인천항", "대부도", "삼목선착장"];

const CONGESTION_OPTIONS: { value: Island["congestion"]; label: string }[] = [
  { value: "low", label: "여유" },
  { value: "medium", label: "보통" },
  { value: "high", label: "혼잡" },
];

const TREND_OPTIONS: { value: Island["popularity_trend"]; label: string }[] = [
  { value: "up", label: "상승" },
  { value: "stable", label: "보통" },
  { value: "down", label: "하락" },
];

const EMPTY_FORM: IslandInput = {
  name: "",
  description: "",
  features: [],
  ferry_time: "",
  ferry_price: null,
  popularity_trend: "stable",
  congestion: "low",
  best_season: "",
  image: null,
  ports: [],
  lat: null,
  lng: null,
  status: "active",
  order_index: 0,
};

function toInput(island: Island): IslandInput {
  return {
    name: island.name,
    description: island.description,
    features: island.features ?? [],
    ferry_time: island.ferry_time ?? "",
    ferry_price: island.ferry_price,
    popularity_trend: island.popularity_trend,
    congestion: island.congestion,
    best_season: island.best_season ?? "",
    image: island.image,
    ports: island.ports ?? [],
    lat: island.lat ?? null,
    lng: island.lng ?? null,
    status: island.status,
    order_index: island.order_index,
  };
}

type ConfirmAction =
  | { type: "deactivate"; island: Island }
  | { type: "delete"; island: Island };

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

// 이름에서 slug를 자동 제안한다. 로마자 이름은 그대로 슬러그화되고,
// 한글 이름은 별도 음역 로직 없이 짧은 랜덤 접미사로 대체한다 — 완전
// 자동 생성은 아니지만 관리자가 빈 칸을 채우지 않고 바로 수정만 하면
// 되게끔 최소한의 제안을 준다("자동 제안" 요구사항).
function suggestSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(DIACRITICS_RE, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug) return slug.slice(0, 40);
  return `island-${Math.random().toString(36).slice(2, 8)}`;
}

export function AdminIslands() {
  const navigate = useNavigate();

  const [islands, setIslands] = useState<Island[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IslandInput>(EMPTY_FORM);
  const [slugId, setSlugId] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const result = await adminIslandService.getAllIslands();
    if (!result.success) {
      setError(result.error || "목록을 불러오지 못했어요");
      setLoading(false);
      return;
    }
    setIslands(result.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!formOpen && !confirmAction) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setFormOpen(false); setConfirmAction(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [formOpen, confirmAction]);

  useEffect(() => {
    if (formOpen) nameInputRef.current?.focus();
  }, [formOpen]);

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSlugId("");
    setSlugTouched(false);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (island: Island) => {
    setFormMode("edit");
    setEditingId(island.id);
    setForm(toInput(island));
    setSlugId(island.id);
    setSlugTouched(true); // 수정 모드에서는 이름이 바뀌어도 기존 slug를 절대 자동으로 덮어쓰지 않는다
    setFormError(null);
    setFormOpen(true);
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name }));
    if (formMode === "create" && !slugTouched) setSlugId(suggestSlug(name));
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlugId(value);
  };

  const togglePort = (port: string) => {
    setForm((f) => ({
      ...f,
      ports: f.ports.includes(port) ? f.ports.filter((p) => p !== port) : [...f.ports, port],
    }));
  };

  const handleSubmit = async () => {
    if (formMode === "create") {
      const idError = validateIslandId(slugId);
      if (idError) { setFormError(idError); return; }
    }
    const inputError = validateIslandInput(form);
    if (inputError) { setFormError(inputError); return; }

    setSaving(true);
    const result = formMode === "create"
      ? await adminIslandService.createIsland(slugId, form)
      : await adminIslandService.updateIsland(editingId as string, form);
    setSaving(false);

    if (!result.success) {
      setFormError(result.error || "저장에 실패했어요. 다시 시도해주세요");
      return;
    }

    toast.success(formMode === "create" ? "섬을 추가했어요" : "섬 정보를 수정했어요");
    setFormOpen(false);
    load();
  };

  const handleToggleStatus = async (island: Island) => {
    setProcessingId(island.id);
    const nextStatus = island.status === "active" ? "inactive" : "active";
    const result = await adminIslandService.setIslandStatus(island.id, nextStatus, island.name);
    setProcessingId(null);
    setConfirmAction(null);
    if (!result.success) {
      toast.error(result.error || "상태 변경에 실패했어요");
      return;
    }
    setIslands((prev) => prev.map((i) => (i.id === island.id ? { ...i, status: nextStatus } : i)));
    toast.success(nextStatus === "active" ? "섬을 다시 노출했어요" : "섬을 사용자 화면에서 숨겼어요");
  };

  const handleDelete = async (island: Island) => {
    setProcessingId(island.id);
    const result = await adminIslandService.deleteIsland(island.id, island.name);
    setProcessingId(null);
    setConfirmAction(null);
    if (!result.success) {
      toast.error(result.error || "삭제에 실패했어요");
      return;
    }
    setIslands((prev) => prev.filter((i) => i.id !== island.id));
    toast.success("섬을 완전히 삭제했어요");
  };

  // 현재 정렬 순서상 바로 앞/뒤 섬과 order_index를 맞바꾼다. 목록은 이미
  // order_index → 이름 순으로 정렬돼 오므로, 화면에 보이는 순서 그대로
  // 이웃을 찾으면 된다.
  const handleMove = async (island: Island, direction: "up" | "down") => {
    const index = islands.findIndex((i) => i.id === island.id);
    const neighborIndex = direction === "up" ? index - 1 : index + 1;
    if (neighborIndex < 0 || neighborIndex >= islands.length) return;
    const neighbor = islands[neighborIndex];

    setProcessingId(island.id);
    const [r1, r2] = await Promise.all([
      adminIslandService.setIslandOrder(island.id, neighbor.order_index),
      adminIslandService.setIslandOrder(neighbor.id, island.order_index),
    ]);
    setProcessingId(null);

    if (!r1.success || !r2.success) {
      toast.error(r1.error || r2.error || "순서 변경에 실패했어요");
      return;
    }
    setIslands((prev) => {
      const next = [...prev];
      next[index] = { ...island, order_index: neighbor.order_index };
      next[neighborIndex] = { ...neighbor, order_index: island.order_index };
      return next.sort((a, b) => a.order_index - b.order_index || a.name.localeCompare(b.name));
    });
    void logAdminAction({
      action: "island_reorder", targetTable: "islands", targetId: island.id,
      summary: `노출 순서 변경: ${island.name} ↔ ${neighbor.name}`,
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3">
        <button onClick={() => navigate("/admin")} className="active:scale-95 transition-transform shrink-0" aria-label="관리자 홈으로 돌아가기">
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg lg:text-xl font-bold text-gray-900">섬 종류 관리</h1>
          <p className="text-xs lg:text-sm text-gray-500">섬을 추가·수정하고 노출 여부를 관리해요</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3.5 py-2 rounded-xl transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span className="hidden sm:inline">새 섬 추가</span>
        </button>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-5 lg:py-8">
        {error ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" strokeWidth={2} />
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button onClick={load} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
              <RefreshCw className="w-4 h-4" strokeWidth={2} /> 다시 시도
            </button>
          </div>
        ) : loading ? (
          <CardGridSkeleton count={6} />
        ) : islands.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-gray-500 mb-4">등록된 섬이 없어요</p>
            <button onClick={openCreate} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
              <Plus className="w-4 h-4" strokeWidth={2} /> 첫 섬 추가하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {islands.map((island, idx) => (
              <div
                key={island.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-opacity ${
                  island.status === "inactive" ? "border-gray-100 opacity-60" : "border-gray-100"
                }`}
              >
                <div className="relative aspect-[16/9]">
                  <IslandImage src={island.image} alt={island.name} className="w-full h-full object-cover" />
                  <span
                    className={`absolute top-2.5 left-2.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      island.status === "active"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {island.status === "active" ? "활성" : "비활성"}
                  </span>
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/40 rounded-full px-1 py-1">
                    <button
                      onClick={() => handleMove(island, "up")}
                      disabled={idx === 0 || processingId === island.id}
                      aria-label={`${island.name} 순서 위로`}
                      className="w-5 h-5 flex items-center justify-center text-white disabled:opacity-30"
                    >
                      <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                    <span className="text-xs font-medium text-white px-0.5">{island.order_index}</span>
                    <button
                      onClick={() => handleMove(island, "down")}
                      disabled={idx === islands.length - 1 || processingId === island.id}
                      aria-label={`${island.name} 순서 아래로`}
                      className="w-5 h-5 flex items-center justify-center text-white disabled:opacity-30"
                    >
                      <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">{island.name}</h3>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2rem]">{island.description || "설명이 없어요"}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {island.ports.length === 0 && island.features.length === 0 && (
                      <span className="text-[11px] text-gray-300">등록된 특징/항구 없음</span>
                    )}
                    {island.ports.slice(0, 2).map((p) => (
                      <span key={p} className="text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{p}</span>
                    ))}
                    {island.features.slice(0, 2).map((f) => (
                      <span key={f} className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(island)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2} /> 수정
                    </button>
                    <button
                      onClick={() => {
                        if (island.status === "active") setConfirmAction({ type: "deactivate", island });
                        else handleToggleStatus(island);
                      }}
                      disabled={processingId === island.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors disabled:opacity-60"
                    >
                      {island.status === "active"
                        ? <><EyeOff className="w-3.5 h-3.5" strokeWidth={2} /> 비활성화</>
                        : <><Eye className="w-3.5 h-3.5" strokeWidth={2} /> 활성화</>}
                    </button>
                    <button
                      onClick={() => setConfirmAction({ type: "delete", island })}
                      disabled={processingId === island.id}
                      aria-label={`${island.name} 완전 삭제`}
                      title="연결된 데이터가 있으면 삭제할 수 없어요 — 비활성화를 권장해요"
                      className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-60"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 추가/수정 폼 */}
      {formOpen && (
        <div role="dialog" aria-modal="true" aria-label={formMode === "create" ? "섬 추가" : "섬 수정"} className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" onClick={() => setFormOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">{formMode === "create" ? "새 섬 추가" : "섬 정보 수정"}</h3>
              <button onClick={() => setFormOpen(false)} aria-label="닫기" className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="이름">
                <input
                  ref={nameInputRef}
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="백령도"
                  className={inputClass}
                />
              </Field>

              {formMode === "create" && (
                <Field label="고유 ID" hint="영문 소문자·숫자·하이픈만, 생성 후 변경 불가 (이름을 입력하면 자동 제안돼요)">
                  <input
                    value={slugId}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="baengnyeong"
                    className={inputClass}
                  />
                </Field>
              )}

              <Field label="설명">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="섬에 대한 간단한 소개"
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <Field label="이미지 URL" hint="비워두면 기본 이미지가 표시돼요">
                <input
                  value={form.image ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value || null }))}
                  placeholder="https://..."
                  className={inputClass}
                />
                <div className="mt-2 h-24 w-full rounded-lg overflow-hidden border border-gray-100">
                  {form.image ? (
                    <IslandImage src={form.image} alt="미리보기" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                      <ImageOff className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              </Field>

              <Field label="특징" hint="쉼표로 구분해서 입력해요 (예: 트레킹, 백사장)">
                <input
                  value={form.features.join(", ")}
                  onChange={(e) => setForm((f) => ({ ...f, features: splitTags(e.target.value) }))}
                  placeholder="트레킹, 백사장, 일몰 명소"
                  className={inputClass}
                />
              </Field>

              <Field label="출발 항구">
                <div className="flex flex-wrap gap-2">
                  {PORT_OPTIONS.map((port) => (
                    <button
                      key={port}
                      type="button"
                      onClick={() => togglePort(port)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.ports.includes(port)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-200"
                      }`}
                    >
                      {port}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="여객선 소요시간">
                  <input
                    value={form.ferry_time}
                    onChange={(e) => setForm((f) => ({ ...f, ferry_time: e.target.value }))}
                    placeholder="4시간"
                    className={inputClass}
                  />
                </Field>
                <Field label="여객선 요금" hint="비우면 '요금 확인 필요'로 표시">
                  <input
                    type="number"
                    min={0}
                    value={form.ferry_price ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, ferry_price: e.target.value === "" ? null : Number(e.target.value) }))}
                    placeholder="71700"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="최적 시즌">
                <input
                  value={form.best_season}
                  onChange={(e) => setForm((f) => ({ ...f, best_season: e.target.value }))}
                  placeholder="봄~가을"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="혼잡도(기본값)">
                  <select
                    value={form.congestion}
                    onChange={(e) => setForm((f) => ({ ...f, congestion: e.target.value as Island["congestion"] }))}
                    className={inputClass}
                  >
                    {CONGESTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="인기 추세">
                  <select
                    value={form.popularity_trend}
                    onChange={(e) => setForm((f) => ({ ...f, popularity_trend: e.target.value as Island["popularity_trend"] }))}
                    className={inputClass}
                  >
                    {TREND_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="위도" hint="지도 표시용, 선택">
                  <input
                    type="number"
                    step="any"
                    value={form.lat ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value === "" ? null : Number(e.target.value) }))}
                    placeholder="37.9"
                    className={inputClass}
                  />
                </Field>
                <Field label="경도" hint="지도 표시용, 선택">
                  <input
                    type="number"
                    step="any"
                    value={form.lng ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value === "" ? null : Number(e.target.value) }))}
                    placeholder="124.7"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="상태">
                  <div className="flex gap-2">
                    {(["active", "inactive"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, status: s }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                          form.status === s
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-200"
                        }`}
                      >
                        {s === "active" ? "활성" : "비활성"}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="노출 순서" hint="작을수록 먼저 노출">
                  <input
                    type="number"
                    min={0}
                    value={form.order_index}
                    onChange={(e) => setForm((f) => ({ ...f, order_index: e.target.value === "" ? 0 : Number(e.target.value) }))}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>

            {formError && (
              <p className="text-xs text-red-500 mt-4 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} /> {formError}
              </p>
            )}

            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setFormOpen(false)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                {formMode === "create" ? "추가하기" : "저장하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 비활성화/삭제 확인 모달 */}
      {confirmAction && (
        <div role="dialog" aria-modal="true" aria-label="작업 확인" className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={() => setConfirmAction(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-sm bg-white rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              {confirmAction.type === "deactivate" ? "섬을 비활성화할까요?" : "섬을 완전히 삭제할까요?"}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              {confirmAction.type === "deactivate"
                ? `'${confirmAction.island.name}'을(를) 비활성화하면 사용자 화면에서 즉시 사라져요. 언제든 다시 활성화할 수 있어요.`
                : `'${confirmAction.island.name}'을(를) 완전히 삭제하면 되돌릴 수 없어요. 연결된 데이터가 있으면 삭제 대신 비활성화를 권장해요.`}
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => confirmAction.type === "deactivate"
                  ? handleToggleStatus(confirmAction.island)
                  : handleDelete(confirmAction.island)}
                disabled={processingId === confirmAction.island.id}
                className={`flex-1 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  confirmAction.type === "deactivate" ? "bg-gray-700 hover:bg-gray-800" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processingId === confirmAction.island.id && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                {confirmAction.type === "deactivate" ? "비활성화" : "완전 삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500";

function splitTags(raw: string): string[] {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
