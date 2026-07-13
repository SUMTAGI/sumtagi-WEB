import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import {
  Ship, Car, MapPin, Hotel, UtensilsCrossed, Users, DollarSign,
  Download, Share2, ChevronLeft, Trash2, Pencil, Check, X, Plus, Phone, ExternalLink, ClipboardList,
  AlertTriangle, RefreshCw,
} from "lucide-react";
import type { GeneratedItinerary, Activity } from "../utils/itineraryGenerator";
import { toast } from "sonner";
import { RouteMap } from "../components/RouteMap";
import { tripService } from "../../lib/tripService";
import { tripBookingService, type TripBooking } from "../../lib/tripBookingService";
import { checkTripRisks, type TripRisk } from "../../lib/tripRiskService";
import { generateItinerary as generateAiItinerary } from "../../lib/api/aiItinerary";
import { notificationService } from "../../lib/notificationService";

const TYPE_OPTIONS: Activity["type"][] = ["ferry", "attraction", "accommodation", "meal"];
const TYPE_LABEL: Record<Activity["type"], string> = {
  ferry: "여객선", attraction: "관광", accommodation: "숙박", meal: "식사",
};

export function Itinerary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(searchParams.get("edit") === "true");
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newAct, setNewAct] = useState<Partial<Activity>>({ type: "attraction", time: "", title: "", location: "", description: "", price: undefined });
  const [bookings, setBookings] = useState<TripBooking[]>([]);
  const [tripRow, setTripRow] = useState<any>(null);
  const [risks, setRisks] = useState<TripRisk[]>([]);
  const [reconstructing, setReconstructing] = useState(false);

  useEffect(() => {
    if (!id) return;
    tripService.getTripById(id).then(data => {
      if (data) {
        setTripRow(data);
        const plan = data.plan ?? JSON.parse(localStorage.getItem(`plan_${id}`) ?? localStorage.getItem(`itinerary_${id}`) ?? 'null');
        if (plan) {
          setItinerary(plan);
          setIsConfirmed(plan.confirmed || data.confirmed || false);
        } else {
          // plan(JSON) 없이 앱(Flutter)에서 만든 여행은 days/total_cost 컬럼에 직접 저장되므로 그걸 사용
          setItinerary({ ...data, startDate: data.start_date, islands: data.islands ?? [], days: data.days ?? [], totalCost: data.total_cost ?? 0 });
          setIsConfirmed(data.confirmed || false);
        }
      } else {
        navigate("/travel");
      }
    }).catch(() => {
      toast.error("일정을 불러오지 못했어요. 다시 시도해주세요");
      navigate("/travel");
    });
  }, [id, navigate]);

  useEffect(() => {
    if (!id || !itinerary) return;
    tripBookingService.getChecklist(id, itinerary.islands, itinerary.departurePort || "인천항", itinerary.days).then(setBookings);
  }, [id, itinerary?.islands?.join(","), itinerary?.departurePort]);

  useEffect(() => {
    if (!itinerary || !isConfirmed) return;
    checkTripRisks(itinerary.islands, itinerary.startDate, itinerary.endDate).then(setRisks);
  }, [itinerary?.islands?.join(","), itinerary?.startDate, itinerary?.endDate, isConfirmed]);

  const handleToggleBooking = (booking: TripBooking) => {
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, is_done: !b.is_done } : b));
    tripBookingService.toggle(booking.id, booking.is_done);
  };

  const handleReconstruct = async () => {
    if (!itinerary || !tripRow || !id || risks.length === 0) return;
    setReconstructing(true);
    try {
      const riskNote = risks.map(r => r.message).join(" / ");
      const result = await generateAiItinerary({
        departurePort: itinerary.departurePort || "인천항",
        islands: itinerary.islands,
        startDate: itinerary.startDate,
        endDate: itinerary.endDate,
        travelers: itinerary.travelers,
        travelStyle: tripRow.travel_type || "관광",
        budget: tripRow.budget || "보통",
        specialRequests: `기상 악화·여객선 결항 위험이 감지됐어요: ${riskNote}. 이 위험을 피하거나 완화할 수 있도록 일정을 조정해줘(실내 활동으로 대체, 일정 순서 조정 등).`,
      });
      const updated = persistItinerary({ ...result, confirmed: isConfirmed });
      setItinerary(updated);
      await notificationService.add(
        "일정이 재구성됐어요",
        `${riskNote} — 위험을 피하도록 일정을 다시 만들었어요.`,
      );
      toast.success("일정을 재구성했어요");
      setRisks([]);
    } catch (err: any) {
      toast.error(`일정 재구성 실패: ${err?.message ?? "알 수 없는 오류"}`);
    } finally {
      setReconstructing(false);
    }
  };

  const persistItinerary = (updated: GeneratedItinerary) => {
    const totalCost = updated.days.reduce((sum, day) =>
      sum + day.activities.reduce((s, a) => s + (a.price ?? 0), 0), 0
    );
    const final = { ...updated, totalCost };
    setItinerary(final);
    localStorage.setItem(`plan_${id}`, JSON.stringify(final));
    if (id) tripService.updateTripPlan(id, final);
    return final;
  };

  const handleSaveEdit = () => {
    if (!itinerary) return;
    persistItinerary(itinerary);
    setIsEditMode(false);
    toast.success("일정이 저장됐어요");
  };

  const handleUpdateActivity = (activityId: string, updates: Partial<Activity>) => {
    setItinerary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((day, di) =>
          di !== selectedDay ? day : {
            ...day,
            activities: day.activities.map(a => a.id === activityId ? { ...a, ...updates } : a),
          }
        ),
      };
    });
  };

  const handleDeleteActivity = (activityId: string) => {
    setItinerary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((day, di) =>
          di !== selectedDay ? day : {
            ...day,
            activities: day.activities.filter(a => a.id !== activityId),
          }
        ),
      };
    });
  };

  const handleAddActivity = () => {
    if (!newAct.title || !newAct.time) { toast.error("시간과 이름을 입력해주세요"); return; }
    const activity: Activity = {
      id: `act_${Date.now()}`,
      type: newAct.type ?? "attraction",
      time: newAct.time!,
      title: newAct.title!,
      location: newAct.location ?? "",
      description: newAct.description ?? "",
      duration: 60,
      price: newAct.price ? Number(newAct.price) : undefined,
    };
    setItinerary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map((day, di) =>
          di !== selectedDay ? day : {
            ...day,
            activities: [...day.activities, activity].sort((a, b) => a.time.localeCompare(b.time)),
          }
        ),
      };
    });
    setNewAct({ type: "attraction", time: "", title: "", location: "", description: "", price: undefined });
    setShowAddSheet(false);
    toast.success("활동이 추가됐어요");
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("일정을 삭제하면 복구할 수 없어요. 삭제할까요?")) return;
    await tripService.deleteTrip(id);
    localStorage.removeItem(`plan_${id}`);
    localStorage.removeItem(`itinerary_${id}`);
    toast.success("일정이 삭제됐어요");
    navigate("/travel");
  };

  const handleConfirm = async () => {
    if (!itinerary || !id) return;
    await tripService.confirmTrip(id);
    const updated = persistItinerary({ ...itinerary, confirmed: true });
    setIsConfirmed(true);
    toast.success("일정이 확정됐어요!");
    navigate("/travel");
  };

  const handleBookActivity = (activity: Activity) => {
    if (activity.bookingStatus === "booked") { toast.info("이미 예약된 항목입니다"); return; }
    if (itinerary) {
      const updated = { ...itinerary };
      updated.days.forEach(day => {
        day.activities.forEach(act => { if (act.id === activity.id) act.bookingStatus = "booked"; });
      });
      persistItinerary(updated);
    }
    toast.success(`${activity.title} 예약 완료`);
  };

  if (!itinerary) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-600">일정을 불러오는 중...</p>
      </div>
    );
  }

  const currentDay = itinerary.days[selectedDay];

  if (!currentDay) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center px-6">
          <p className="text-gray-600 mb-4">아직 생성된 일정이 없어요</p>
          <button
            onClick={() => navigate("/travel")}
            className="text-blue-600 font-semibold"
          >
            여행 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-4 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1633775362313-fed93ef8e824?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-blue-700/80"></div>
        <div className="relative z-10">
          <button
            onClick={() => { if (isEditMode) { handleSaveEdit(); } else { navigate("/travel"); } }}
            className="flex items-center gap-2 mb-3 text-blue-100 active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            <span className="text-sm">{isEditMode ? "저장 후 나가기" : "여행으로"}</span>
          </button>
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-xl font-bold flex-1">{itinerary.title}</h1>
            <button
              onClick={isEditMode ? handleSaveEdit : () => setIsEditMode(true)}
              className={`ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold active:scale-95 transition-all ${
                isEditMode ? "bg-green-400/90 text-white" : "bg-white/20 backdrop-blur-sm text-white"
              }`}
            >
              {isEditMode ? <Check className="w-4 h-4" strokeWidth={2.5} /> : <Pencil className="w-4 h-4" strokeWidth={2} />}
              {isEditMode ? "저장" : "편집"}
            </button>
          </div>
          {/* 개발 검증용 배지 — 배포 시 제거 가능 */}
          {(itinerary as any).generatedBy === "llm" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-100 bg-purple-600/70 px-2.5 py-0.5 rounded-full mb-2 self-start">
              ✨ AI 생성 일정
            </span>
          )}
          {(itinerary as any).generatedBy === "fallback" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-100 bg-gray-600/70 px-2.5 py-0.5 rounded-full mb-2 self-start">
              ⚡ 기본 일정으로 대체됨
            </span>
          )}
          {(itinerary as any).generatedBy === "quick" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-100 bg-gray-600/70 px-2.5 py-0.5 rounded-full mb-2 self-start">
              ⚡ 빠른 일정
            </span>
          )}

          <div className="flex flex-wrap gap-3 text-sm text-blue-100">
            <div className="flex items-center gap-1">
              {itinerary.departurePort === "육로 이동" ? (
                <Car className="w-4 h-4" strokeWidth={2} />
              ) : (
                <Ship className="w-4 h-4" strokeWidth={2} />
              )}
              <span>{itinerary.departurePort || "인천항"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" strokeWidth={2} />
              <span>{itinerary.travelers}명</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" strokeWidth={2} />
              <span>{(itinerary.totalCost ?? 0).toLocaleString()}원</span>
            </div>
          </div>
          {!isEditMode && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => toast.success("일정표 다운로드 시작")}
                className="flex-1 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" strokeWidth={2} />
                다운로드
              </button>
              <button
                onClick={() => toast.success("링크 복사됨")}
                className="flex-1 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" strokeWidth={2} />
                공유
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2} />
                삭제
              </button>
            </div>
          )}
          {isEditMode && (
            <p className="mt-3 text-xs text-blue-200">활동을 탭해서 수정하거나 아래 + 버튼으로 추가하세요</p>
          )}
        </div>
      </div>

      {/* AI 일정 데이터 근거 — 관광공사 API 데이터를 실제로 반영했을 때만 표시 */}
      {!isEditMode && ((itinerary as any).dataBasis?.length > 0) && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">관광공사 데이터 근거</span>
          </div>
          <ul className="space-y-1">
            {(itinerary as any).dataBasis.map((line: string, i: number) => (
              <li key={i} className="text-sm text-blue-900 flex items-start gap-1.5">
                <span className="text-blue-400 mt-0.5">·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weather/Ferry Risk Banner */}
      {risks.length > 0 && !isEditMode && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" strokeWidth={2} />
            <div className="flex-1">
              <p className="font-semibold text-amber-900 text-sm mb-1">
                {risks.some(r => r.level === "cancelled") ? "여객선 결항이 확인됐어요" : "결항 가능성이 있어요"}
              </p>
              {risks.map((r, i) => (
                <p key={i} className="text-xs text-amber-800">{r.message}</p>
              ))}
            </div>
          </div>
          <button
            onClick={handleReconstruct}
            disabled={reconstructing}
            className="w-full mt-1 flex items-center justify-center gap-2 bg-amber-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60 active:scale-95 transition-transform"
          >
            <RefreshCw className={`w-4 h-4 ${reconstructing ? "animate-spin" : ""}`} strokeWidth={2} />
            {reconstructing ? "재구성 중..." : "대체 일정 만들기"}
          </button>
        </div>
      )}

      {/* Day Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 overflow-x-auto">
        <div className="flex gap-2">
          {itinerary.days.map((day, index) => (
            <button
              key={day.date}
              onClick={() => setSelectedDay(index)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${
                selectedDay === index ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 active:scale-95"
              }`}
            >
              Day {day.dayNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="">
        {/* Day Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Day {currentDay.dayNumber}</h2>
          <p className="text-sm text-gray-600">
            {new Date(currentDay.date).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
          </p>
        </div>

        {/* Activities */}
        <div className="px-6 py-4 space-y-4">
          {currentDay.activities.map((activity, index) => (
            <ActivityCardMobile
              key={activity.id}
              activity={activity}
              isLast={index === currentDay.activities.length - 1}
              editMode={isEditMode}
              onBook={handleBookActivity}
              onUpdate={(updates) => handleUpdateActivity(activity.id, updates)}
              onDelete={() => handleDeleteActivity(activity.id)}
            />
          ))}

          {isEditMode && (
            <button
              onClick={() => setShowAddSheet(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl font-medium active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" strokeWidth={2} />
              활동 추가
            </button>
          )}
        </div>

        {!isEditMode && (
          <>
            {/* Map */}
            <div className="px-6 py-6 bg-white mt-4">
              <h3 className="font-semibold text-gray-900 mb-3">여행 경로</h3>
              <RouteMap islands={itinerary.islands} departurePort={itinerary.departurePort} />
              <p className="text-xs text-gray-600 mt-2 text-center">
                {itinerary.departurePort === "육로 이동"
                  ? itinerary.islands.join(" → ")
                  : [itinerary.departurePort || "인천항", ...itinerary.islands, itinerary.departurePort || "인천항"].join(" → ")}
              </p>
            </div>

            {/* Budget */}
            <div className="px-6 py-6 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">예산 요약</h3>
              <div className="bg-white rounded-xl p-4 space-y-2">
                {(["ferry", "accommodation", "meal"] as Activity["type"][]).map(type => (
                  <BudgetItemMobile
                    key={type}
                    label={TYPE_LABEL[type]}
                    amount={itinerary.days.reduce((sum, day) =>
                      sum + day.activities.filter(a => a.type === type).reduce((s, a) => s + (a.price ?? 0), 0), 0
                    )}
                  />
                ))}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <BudgetItemMobile label="총 예산" amount={itinerary.totalCost ?? 0} isTotal />
                </div>
              </div>
            </div>

            {/* Booking Checklist */}
            {bookings.length > 0 && (
              <div className="px-6 py-6 bg-gray-50">
                <BookingChecklistSection bookings={bookings} onToggle={handleToggleBooking} />
              </div>
            )}

            {!isConfirmed && (
              <div className="px-6 py-6">
                <button
                  onClick={handleConfirm}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform"
                >
                  일정 확정하기
                </button>
                <p className="text-xs text-gray-600 text-center mt-2">확정하면 여행 탭에서 일정을 바로 확인할 수 있어요</p>
              </div>
            )}

            {isConfirmed && (
              <div className="px-6 py-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <Ship className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900 mb-1">일정이 확정됐어요</p>
                    <p className="text-xs text-green-700">여행 탭에서 일정을 확인하세요</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Activity Sheet */}
      {showAddSheet && (
        <div className="absolute inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowAddSheet(false)}>
          <div className="bg-white rounded-t-2xl w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">활동 추가</h3>
              <button onClick={() => setShowAddSheet(false)} className="p-1 text-gray-400">
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">유형</label>
                <div className="flex gap-2">
                  {TYPE_OPTIONS.map(t => (
                    <button
                      key={t}
                      onClick={() => setNewAct(p => ({ ...p, type: t }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        newAct.type === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">시간 *</label>
                  <input
                    type="text"
                    value={newAct.time ?? ""}
                    onChange={e => setNewAct(p => ({ ...p, time: e.target.value }))}
                    placeholder="09:00"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">가격 (원)</label>
                  <input
                    type="number"
                    value={newAct.price ?? ""}
                    onChange={e => setNewAct(p => ({ ...p, price: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">이름 *</label>
                <input
                  type="text"
                  value={newAct.title ?? ""}
                  onChange={e => setNewAct(p => ({ ...p, title: e.target.value }))}
                  placeholder="예: 백령도 두무진 트레킹"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">장소</label>
                <input
                  type="text"
                  value={newAct.location ?? ""}
                  onChange={e => setNewAct(p => ({ ...p, location: e.target.value }))}
                  placeholder="예: 백령도 두무진"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">설명</label>
                <textarea
                  value={newAct.description ?? ""}
                  onChange={e => setNewAct(p => ({ ...p, description: e.target.value }))}
                  placeholder="간단한 메모를 남겨보세요"
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleAddActivity}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              추가하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityCardMobile({
  activity,
  isLast,
  editMode,
  onBook,
  onUpdate,
  onDelete,
}: {
  activity: Activity;
  isLast: boolean;
  editMode: boolean;
  onBook: (activity: Activity) => void;
  onUpdate: (updates: Partial<Activity>) => void;
  onDelete: () => void;
}) {
  const typeColor = {
    ferry: "bg-blue-100 text-blue-600",
    accommodation: "bg-purple-100 text-purple-600",
    meal: "bg-orange-100 text-orange-600",
    attraction: "bg-green-100 text-green-600",
  }[activity.type] ?? "bg-gray-100 text-gray-600";

  const typeIcon = {
    ferry: <Ship className="w-5 h-5" strokeWidth={2} />,
    accommodation: <Hotel className="w-5 h-5" strokeWidth={2} />,
    meal: <UtensilsCrossed className="w-5 h-5" strokeWidth={2} />,
    attraction: <MapPin className="w-5 h-5" strokeWidth={2} />,
  }[activity.type];

  const canBook = activity.type === "ferry" || activity.type === "accommodation";

  return (
    <div className="relative">
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full ${typeColor} flex items-center justify-center`}>
            {typeIcon}
          </div>
          {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
        </div>

        <div className="flex-1 pb-6">
          {editMode ? (
            <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-blue-200 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-blue-500">{TYPE_LABEL[activity.type]}</span>
                <button
                  onClick={onDelete}
                  className="p-1 text-red-400 hover:text-red-600 active:scale-95 transition-all"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={activity.time}
                  onChange={e => onUpdate({ time: e.target.value })}
                  placeholder="시간"
                  className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="number"
                  value={activity.price ?? ""}
                  onChange={e => onUpdate({ price: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="가격 (원)"
                  className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <input
                type="text"
                value={activity.title}
                onChange={e => onUpdate({ title: e.target.value })}
                placeholder="이름"
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="text"
                value={activity.location}
                onChange={e => onUpdate({ location: e.target.value })}
                placeholder="장소"
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <textarea
                value={activity.description}
                onChange={e => onUpdate({ description: e.target.value })}
                placeholder="설명"
                rows={2}
                className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm font-semibold text-blue-600">{activity.time}</div>
                {activity.congestionLevel && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    activity.congestionLevel === "low" ? "bg-green-100 text-green-700" :
                    activity.congestionLevel === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {activity.congestionLevel === "low" ? "여유" : activity.congestionLevel === "medium" ? "보통" : "혼잡"}
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{activity.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" strokeWidth={2} />
                  <span>{activity.location}</span>
                </div>
                {activity.price && (
                  <span className="text-sm font-semibold text-gray-900">{activity.price.toLocaleString()}원</span>
                )}
              </div>
              {canBook && (
                <button
                  onClick={() => onBook(activity)}
                  disabled={activity.bookingStatus === "booked"}
                  className={`w-full mt-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activity.bookingStatus === "booked" ? "bg-gray-100 text-gray-500" : "bg-blue-600 text-white active:scale-95"
                  }`}
                >
                  {activity.bookingStatus === "booked" ? "예약완료" : "예약하기"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BudgetItemMobile({ label, amount, isTotal = false }: { label: string; amount: number; isTotal?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${isTotal ? "font-bold text-base" : "text-sm"}`}>
      <span className="text-gray-700">{label}</span>
      <span className={isTotal ? "text-blue-600" : "text-gray-900"}>{amount.toLocaleString()}원</span>
    </div>
  );
}

const BOOKING_CATEGORY_LABEL: Record<TripBooking["category"], string> = {
  ferry: "여객선", accommodation: "숙박", restaurant: "식당", experience: "체험",
};

function BookingChecklistSection({ bookings, onToggle }: { bookings: TripBooking[]; onToggle: (booking: TripBooking) => void }) {
  const doneCount = bookings.filter(b => b.is_done).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gray-700" strokeWidth={2} />
          <h3 className="font-semibold text-gray-900">예약 준비 체크리스트</h3>
        </div>
        <span className="text-xs text-gray-500">{doneCount}/{bookings.length}</span>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        여객선·숙박·식당 예약은 sumtagi가 대신 해주지 않아요. 연락처로 직접 예약한 뒤 완료로 체크하세요.
      </p>
      <div className="bg-white rounded-xl divide-y divide-gray-100">
        {bookings.map(booking => (
          <div key={booking.id} className="flex items-center gap-3 p-3">
            <button
              onClick={() => onToggle(booking)}
              className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                booking.is_done ? "bg-blue-600 border-blue-600" : "border-gray-300"
              }`}
            >
              {booking.is_done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                  {BOOKING_CATEGORY_LABEL[booking.category]}
                </span>
                <span className={`text-sm font-medium truncate ${booking.is_done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                  {booking.name}
                </span>
              </div>
            </div>
            {booking.phone && (
              <a
                href={`tel:${booking.phone}`}
                className="shrink-0 w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              >
                <Phone className="w-3.5 h-3.5" strokeWidth={2} />
              </a>
            )}
            {booking.external_url && (
              <a
                href={booking.external_url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
