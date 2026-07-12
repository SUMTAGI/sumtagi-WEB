import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight, Check, Search, CheckCircle, Loader2 } from "lucide-react";
import { fetchIslandData } from "../utils/itineraryGenerator";
import { generateItinerary, generateQuickItinerary } from "../../lib/api/aiItinerary";
import { getIslands, type Island } from "../../lib/api/islands";
import { toast } from "sonner";
import { Confetti } from "../components/Confetti";
import { IslandImage } from "../components/IslandImage";
import { tripService } from "../../lib/tripService";

const ALL_ISLANDS = [
  "백령도", "대청도", "소청도", "연평도",
  "덕적도", "자월도", "승봉도", "대이작도",
  "소이작도", "풍도", "육도", "신도", "장봉도",
  "영흥도", "선재도", "굴업도", "시도", "모도", "소야도",
  "문갑도", "백아도", "울도",
];

const ISLAND_PORT_MAP: Record<string, string> = {
  "백령도": "인천항", "대청도": "인천항", "소청도": "인천항", "연평도": "인천항",
  "덕적도": "인천항", "자월도": "인천항", "승봉도": "인천항", "대이작도": "인천항",
  "소이작도": "대부도", "풍도": "대부도", "육도": "대부도",
  "신도": "삼목항", "장봉도": "삼목항",
  // 다리로 연결돼 여객선이 필요 없는 섬 (자동차로 이동)
  "영흥도": "육로 이동", "선재도": "육로 이동", "시도": "육로 이동",
  "모도": "육로 이동", "소야도": "육로 이동",
  // 덕적도 경유 환승 항로 (인천항 → 덕적도 → 굴업도)
  "굴업도": "덕적도",
  // 인천-덕적 완행선 경유지 (별도 직항 없음)
  "문갑도": "인천항", "백아도": "인천항", "울도": "인천항",
};

function localDateStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return fmtDate(d);
}

function upcomingWeekend(weeksAhead: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilSat = ((6 - today.getDay()) % 7) + weeksAhead * 7;
  const sat = new Date(today);
  sat.setDate(sat.getDate() + daysUntilSat);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  return { start: fmtDate(sat), end: fmtDate(sun) };
}

const QUICK_DATE_PICKS = [
  { label: "이번 주말", type: "weekend" as const, weeksAhead: 0 },
  { label: "다음 주말", type: "weekend" as const, weeksAhead: 1 },
  { label: "당일치기", type: "nights" as const, nights: 0 },
  { label: "1박 2일", type: "nights" as const, nights: 1 },
  { label: "2박 3일", type: "nights" as const, nights: 2 },
  { label: "3박 4일", type: "nights" as const, nights: 3 },
];

const TRAVEL_STYLES = [
  { id: "관광",     emoji: "🏖️" },
  { id: "휴양",     emoji: "😌" },
  { id: "체험",     emoji: "🎣" },
  { id: "사진",     emoji: "📸" },
  { id: "생태",     emoji: "🌿", badge: "생태관광" },
  { id: "무장애",   emoji: "♿", badge: "무장애여행" },
  { id: "반려동물", emoji: "🐾", badge: "반려동물동반" },
];

const BUDGETS = ["알뜰", "보통", "여유"];

export function CreateTrip() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    travelers: 2,
    travelType: "",
    islands: [] as string[],
    budget: "보통",
    specialRequests: "",
  });
  const [generationMode, setGenerationMode] = useState<"ai" | "quick">("quick");
  const [shakeStart, setShakeStart] = useState(false);
  const [shakeEnd, setShakeEnd] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preSelectedIsland, setPreSelectedIsland] = useState<string | null>(null);
  const [realIslands, setRealIslands] = useState<Island[]>([]);
  const [islandSearch, setIslandSearch] = useState("");

  useEffect(() => {
    fetchIslandData();
    getIslands().then(setRealIslands).catch(() => {});
    const islandName = searchParams.get("name");
    const styleParam = searchParams.get("style");
    if (islandName) {
      // IslandDetail의 "일정 만들기"(?name=) 또는 홈 검색창 AI 추천(?name=&style=)에서 진입
      setPreSelectedIsland(islandName);
      setFormData(prev => ({ ...prev, islands: [islandName], travelType: styleParam || prev.travelType }));
    }
  }, [searchParams]);

  const totalSteps = preSelectedIsland ? 2 : 3;
  const stepNames = preSelectedIsland ? ["날짜 선택", "인원 & 스타일"] : ["섬 선택", "날짜 선택", "인원 & 스타일"];
  const stepDescriptions = preSelectedIsland
    ? ["여행 일정을 생성하기 위해 여행 기간을 선택해주세요.", "함께 떠나는 인원과 원하는 여행 스타일을 알려주세요."]
    : ["방문하고 싶은 섬을 자유롭게 선택해주세요.", "여행 일정을 생성하기 위해 여행 기간을 선택해주세요.", "함께 떠나는 인원과 원하는 여행 스타일을 알려주세요."];

  const computedPort = ISLAND_PORT_MAP[formData.islands[0] ?? ""] ?? "인천항";

  // 실제 Supabase islands 테이블 데이터 — 이름으로 매칭(없는 섬은 실사진/설명 없이 이름만 표시)
  const islandByName = new Map(realIslands.map(i => [i.name, i]));

  // 섬간 이동이 번거로워 한 번에 한 섬만 선택 가능 — 다른 섬을 누르면 선택이 교체됨
  const handleIslandToggle = (island: string) => {
    setFormData(prev => ({
      ...prev,
      islands: prev.islands[0] === island ? [] : [island],
    }));
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const today = localDateStr();
    if (selectedDate && selectedDate < today) {
      toast.error("지나간 날짜는 선택할 수 없어요");
      setShakeStart(true);
      setTimeout(() => setShakeStart(false), 500);
      return;
    }
    if (formData.endDate && selectedDate > formData.endDate) {
      toast.error("출발일은 귀가일 이전이어야 해요");
      setShakeStart(true);
      setTimeout(() => setShakeStart(false), 500);
      return;
    }
    setFormData({ ...formData, startDate: selectedDate });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const today = localDateStr();
    if (selectedDate && selectedDate < today) {
      toast.error("지나간 날짜는 선택할 수 없어요");
      setShakeEnd(true);
      setTimeout(() => setShakeEnd(false), 500);
      return;
    }
    if (formData.startDate && selectedDate < formData.startDate) {
      toast.error("귀가일은 출발일 이후여야 해요");
      setShakeEnd(true);
      setTimeout(() => setShakeEnd(false), 500);
      return;
    }
    setFormData({ ...formData, endDate: selectedDate });
  };

  const handleQuickDatePick = (pick: typeof QUICK_DATE_PICKS[number]) => {
    if (pick.type === "weekend") {
      const { start, end } = upcomingWeekend(pick.weeksAhead);
      setFormData(prev => ({ ...prev, startDate: start, endDate: end }));
    } else {
      setFormData(prev => {
        const start = prev.startDate || localDateStr();
        return { ...prev, startDate: start, endDate: addDays(start, pick.nights) };
      });
    }
  };

  const endDateInputRef = useRef<HTMLInputElement>(null);

  const handleDirectSelect = () => {
    setFormData(prev => (prev.startDate ? prev : { ...prev, startDate: localDateStr() }));
    requestAnimationFrame(() => {
      const el = endDateInputRef.current;
      if (!el) return;
      el.focus();
      (el as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
    });
  };

  const handleSubmit = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const request = {
        departurePort: computedPort,
        islands:       formData.islands,
        startDate:     formData.startDate,
        endDate:       formData.endDate,
        travelers:     formData.travelers,
        travelStyle:   formData.travelType,
        budget:        formData.budget,
        specialRequests: formData.specialRequests.trim() || undefined,
        provider:      "gemini" as const,
      };

      const itinerary = generationMode === "quick"
        ? await generateQuickItinerary(request)
        : await generateItinerary(request, () => {
            toast.warning("AI 일정 생성에 실패했어요. 기본 일정으로 대체합니다.");
          });

      const title = `${formData.islands.join(", ")} 여행`;
      const trip = await tripService.createTrip(
        title,
        formData.startDate,
        formData.endDate,
        formData.islands,
        itinerary
      );

      if (!trip) {
        toast.error("일정 저장에 실패했어요. 로그인 상태를 확인해주세요.");
        return;
      }

      localStorage.setItem(`plan_${trip.id}`, JSON.stringify(itinerary));
      toast.success(itinerary.generatedBy === "llm" ? "AI 일정이 생성됐어요! 🎉" : "일정이 생성됐어요!");
      setShowConfetti(true);
      setTimeout(() => { navigate(`/itinerary/${trip.id}`); }, 2000);
    } catch (e) {
      toast.error("일정 저장 중 오류가 발생했어요. 다시 시도해주세요.");
      console.error("createTrip error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  // 현재 단계 렌더: preSelected → [date(0), style(1)], 없음 → [islands(0), date(1), style(2)]
  const renderStep = () => {
    if (preSelectedIsland) {
      return step === 0 ? renderDateStep() : renderStyleStep();
    }
    if (step === 0) return renderIslandStep();
    if (step === 1) return renderDateStep();
    return renderStyleStep();
  };

  const renderIslandStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">방문할 섬 선택</h2>
        <p className="text-sm text-gray-600">어느 섬으로 떠나고 싶으세요? 섬간 이동이 어려워 한 번에 한 섬만 선택할 수 있어요.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ALL_ISLANDS.map((island) => (
          <button
            key={island}
            onClick={() => handleIslandToggle(island)}
            className={`px-4 py-4 rounded-xl border-2 transition-all ${
              formData.islands.includes(island)
                ? "border-blue-600 bg-blue-50 text-blue-600 font-semibold"
                : "border-gray-200 active:scale-95"
            }`}
          >
            {island}
          </button>
        ))}
      </div>

      {formData.islands.length > 0 && (
        <>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">{formData.islands[0]}</span> 선택됨
            </p>
          </div>
          <button
            onClick={() => setStep(1)}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform"
          >
            다음: 날짜 선택
          </button>
        </>
      )}
    </div>
  );

  const renderDateStep = () => (
    <div className="space-y-6">
      {preSelectedIsland && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm font-semibold text-blue-900 mb-1">선택된 섬</p>
          <p className="text-lg font-bold text-blue-700">{preSelectedIsland}</p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">여행 날짜</h2>
        <p className="text-sm text-gray-600">언제 떠나시나요?</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">출발일</label>
        <input
          type="date"
          value={formData.startDate}
          onChange={handleStartDateChange}
          className={`w-full px-4 py-4 text-base border-2 border-gray-300 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
            shakeStart ? "animate-shake border-red-500" : ""
          }`}
          style={{ WebkitAppearance: "none", colorScheme: "light" }}
          min={localDateStr()}
        />
        {formData.startDate && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
            <CheckCircle className="w-4 h-4 text-blue-600" strokeWidth={2} />
            <p className="text-sm text-blue-700 font-medium">
              {new Date(formData.startDate + "T00:00:00").toLocaleDateString("ko-KR", {
                year: "numeric", month: "long", day: "numeric", weekday: "short",
              })}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">귀가일</label>
        <input
          type="date"
          value={formData.endDate}
          onChange={handleEndDateChange}
          className={`w-full px-4 py-4 text-base border-2 border-gray-300 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
            shakeEnd ? "animate-shake border-red-500" : ""
          }`}
          style={{ WebkitAppearance: "none", colorScheme: "light" }}
          min={formData.startDate || localDateStr()}
        />
        {formData.endDate && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
            <CheckCircle className="w-4 h-4 text-blue-600" strokeWidth={2} />
            <p className="text-sm text-blue-700 font-medium">
              {new Date(formData.endDate + "T00:00:00").toLocaleDateString("ko-KR", {
                year: "numeric", month: "long", day: "numeric", weekday: "short",
              })}
            </p>
          </div>
        )}
      </div>

      {formData.startDate && formData.endDate && (
        <>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 font-medium mb-1">총 여행 기간</p>
                <p className="text-lg font-bold text-gray-900">
                  {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / 86400000)}박{" "}
                  {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / 86400000) + 1}일
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" strokeWidth={2} />
            </div>
          </div>
          <button
            onClick={() => setStep(step + 1)}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform mt-6"
          >
            다음: 인원 & 스타일 선택
          </button>
        </>
      )}
    </div>
  );

  const renderStyleStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">여행 인원 & 스타일</h2>
        <p className="text-sm text-gray-600">함께 떠나는 인원과 여행 스타일을 선택하세요</p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setFormData({ ...formData, travelers: Math.max(1, formData.travelers - 1) })}
          className="w-12 h-12 bg-gray-100 rounded-full text-xl font-bold active:scale-95 transition-transform"
        >
          -
        </button>
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">{formData.travelers}</div>
          <div className="text-sm text-gray-600">명</div>
        </div>
        <button
          onClick={() => setFormData({ ...formData, travelers: formData.travelers + 1 })}
          className="w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold active:scale-95 transition-transform"
        >
          +
        </button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">여행 스타일</h3>
        <div className="grid grid-cols-2 gap-3">
          {TRAVEL_STYLES.map(({ id, emoji, badge }) => (
            <button
              key={id}
              onClick={() => setFormData({ ...formData, travelType: id })}
              className={`p-4 rounded-xl border-2 transition-all relative ${
                formData.travelType === id ? "border-blue-600 bg-blue-50" : "border-gray-200 active:scale-95"
              }`}
            >
              {badge && (
                <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                  관광공사
                </span>
              )}
              <div className="text-2xl mb-1">{emoji}</div>
              <div className={`font-semibold text-sm ${formData.travelType === id ? "text-blue-600" : "text-gray-900"}`}>{id}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">예산</h3>
        <div className="grid grid-cols-3 gap-3">
          {BUDGETS.map((b) => (
            <button
              key={b}
              onClick={() => setFormData({ ...formData, budget: b })}
              className={`px-4 py-3 rounded-xl border-2 transition-all ${
                formData.budget === b
                  ? "border-blue-600 bg-blue-50 text-blue-600 font-semibold"
                  : "border-gray-200 active:scale-95"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">일정 생성 방식</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setGenerationMode("quick")}
            className={`p-4 rounded-xl border-2 text-left transition-all relative ${
              generationMode === "quick" ? "border-blue-600 bg-blue-50" : "border-gray-200 active:scale-95"
            }`}
          >
            <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
              추천
            </span>
            <div className="text-2xl mb-1">⚡</div>
            <div className={`font-semibold text-sm ${generationMode === "quick" ? "text-blue-600" : "text-gray-900"}`}>빠른 일정 생성</div>
            <div className="text-xs text-gray-500 mt-0.5">AI 없이 즉시 기본 일정 생성</div>
          </button>
          <button
            onClick={() => setGenerationMode("ai")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              generationMode === "ai" ? "border-blue-600 bg-blue-50" : "border-gray-200 active:scale-95"
            }`}
          >
            <div className="text-2xl mb-1">✨</div>
            <div className={`font-semibold text-sm ${generationMode === "ai" ? "text-blue-600" : "text-gray-900"}`}>AI 추천 일정</div>
            <div className="text-xs text-gray-500 mt-0.5">관광 데이터 기반 맞춤 일정 (다소 소요)</div>
          </button>
        </div>
      </div>

      {generationMode === "ai" && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">AI에게 하고 싶은 말이 있나요? <span className="text-gray-400 font-normal">(선택)</span></h3>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
            placeholder="예: 아이랑 같이 가요, 낚시하고 싶어요, 걷는 건 최소화해주세요"
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
          />
        </div>
      )}

      {formData.travelType && (
        <button
          onClick={handleSubmit}
          disabled={isGenerating}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold transition-all mt-6 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />
              {generationMode === "ai" ? "AI가 일정을 만들고 있어요..." : "일정을 만들고 있어요..."}
            </>
          ) : generationMode === "ai" ? (
            "AI 일정 생성하기 ✨"
          ) : (
            "빠른 일정 생성하기 ⚡"
          )}
        </button>
      )}
    </div>
  );

  // ================================================================
  // 데스크톱 전용 렌더 (lg 이상) — 상태/핸들러는 위와 완전히 동일하게 재사용
  // ================================================================

  const canProceedIsland = formData.islands.length > 0;

  const hasDates = !!(formData.startDate && formData.endDate);
  const nights = hasDates
    ? Math.round((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / 86400000)
    : null;
  const dateError = nights !== null && nights < 0;
  const durationLabel = dateError || nights === null ? null : nights === 0 ? "당일치기" : `${nights}박 ${nights + 1}일`;

  const thisWeekend = upcomingWeekend(0);
  const nextWeekend = upcomingWeekend(1);
  const activeQuickPick = !hasDates || dateError
    ? null
    : formData.startDate === thisWeekend.start && formData.endDate === thisWeekend.end
    ? "이번 주말"
    : formData.startDate === nextWeekend.start && formData.endDate === nextWeekend.end
    ? "다음 주말"
    : QUICK_DATE_PICKS.find((p) => p.type === "nights" && p.nights === nights)?.label ?? "직접 선택";

  const canProceedDate = hasDates && !dateError;
  const isLastStep = step === totalSteps - 1;
  const canSubmitStyle = !!formData.travelType;

  const handleBack = () => {
    if (step === 0) navigate("/travel");
    else setStep(step - 1);
  };

  const handleNextDesktop = () => {
    if (isLastStep) {
      handleSubmit();
      return;
    }
    setStep(step + 1);
  };

  const currentStepKind: "island" | "date" | "style" = preSelectedIsland
    ? (step === 0 ? "date" : "style")
    : (step === 0 ? "island" : step === 1 ? "date" : "style");

  const nextDisabledDesktop =
    currentStepKind === "island" ? !canProceedIsland :
    currentStepKind === "date" ? !canProceedDate :
    !canSubmitStyle || isGenerating;

  const filteredIslandNames = ALL_ISLANDS.filter((name) =>
    name.includes(islandSearch.trim())
  );

  const renderIslandStepDesktop = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1.5">방문할 섬 선택</h2>
        <p className="text-gray-500">어느 섬으로 떠나고 싶으세요? 섬간 이동이 어려워 한 번에 한 섬만 선택할 수 있어요.</p>
      </div>

      <div className="relative mb-5">
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" strokeWidth={2} />
        <input
          type="text"
          value={islandSearch}
          onChange={(e) => setIslandSearch(e.target.value)}
          placeholder="섬 이름으로 검색"
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {formData.islands.length > 0 && (
        <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100 mb-5">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">{formData.islands[0]}</span> 선택됨
          </p>
        </div>
      )}

      {filteredIslandNames.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">'{islandSearch}'와 일치하는 섬이 없어요</div>
      ) : (
        <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredIslandNames.map((name) => {
            const real = islandByName.get(name);
            const selected = formData.islands.includes(name);
            return (
              <button
                key={name}
                onClick={() => handleIslandToggle(name)}
                className={`group relative rounded-2xl border-2 overflow-hidden text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  selected
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 bg-white"
                }`}
              >
                {selected && (
                  <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
                {real ? (
                  <>
                    <div className="aspect-[4/3] bg-gray-100">
                      <IslandImage
                        src={real.image}
                        alt={real.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3.5">
                      <p className="font-semibold text-gray-900 text-sm">{real.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{real.ports.join(", ") || "출발항 정보 없음"} 출발</p>
                      {real.features.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {real.features.slice(0, 2).map((f) => (
                            <span key={f} className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-4 min-h-[96px] flex flex-col justify-center">
                    <p className="font-semibold text-gray-900 text-sm">{name}</p>
                    <p className="text-xs text-gray-400 mt-1">{ISLAND_PORT_MAP[name] ?? "출발항 정보 없음"} 출발</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderDateStepDesktop = () => (
    <div>
      {preSelectedIsland && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-5">
          <p className="text-sm font-semibold text-blue-900 mb-1">선택된 섬</p>
          <p className="text-lg font-bold text-blue-700">{preSelectedIsland}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* ── 여행 날짜 카드 ────────────────────────── */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900 mb-1">여행 날짜</h2>
            <p className="text-sm text-gray-500">언제 떠나시나요?</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">출발일</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={handleStartDateChange}
                className={`w-full px-4 py-3.5 text-base border-2 rounded-xl bg-white hover:border-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors ${
                  shakeStart ? "animate-shake border-red-500" : dateError ? "border-red-300" : "border-gray-300"
                }`}
                style={{ colorScheme: "light" }}
                min={localDateStr()}
              />
              {formData.startDate && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2} />
                  <p className="text-sm text-blue-700 font-medium">
                    {new Date(formData.startDate + "T00:00:00").toLocaleDateString("ko-KR", {
                      month: "long", day: "numeric", weekday: "short",
                    })}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">귀가일</label>
              <input
                ref={endDateInputRef}
                type="date"
                value={formData.endDate}
                onChange={handleEndDateChange}
                className={`w-full px-4 py-3.5 text-base border-2 rounded-xl bg-white hover:border-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors ${
                  shakeEnd ? "animate-shake border-red-500" : dateError ? "border-red-300" : "border-gray-300"
                }`}
                style={{ colorScheme: "light" }}
                min={formData.startDate || localDateStr()}
              />
              {formData.endDate && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" strokeWidth={2} />
                  <p className="text-sm text-blue-700 font-medium">
                    {new Date(formData.endDate + "T00:00:00").toLocaleDateString("ko-KR", {
                      month: "long", day: "numeric", weekday: "short",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {dateError ? (
            <div className="rounded-xl p-4 border border-red-200 bg-red-50 mt-5">
              <p className="text-sm text-red-600 font-medium">귀가일은 출발일 이후여야 합니다.</p>
            </div>
          ) : (
            <div className={`rounded-xl p-4 border flex items-center justify-between mt-5 transition-colors ${
              hasDates ? "bg-blue-50 border-blue-100" : "bg-gray-50 border-gray-100"
            }`}>
              <div>
                <p className={`text-xs font-medium mb-1 ${hasDates ? "text-blue-600" : "text-gray-400"}`}>총 여행 기간</p>
                <p className={`text-lg font-bold ${hasDates ? "text-gray-900" : "text-gray-400"}`}>
                  {durationLabel ?? "날짜를 선택하면 표시돼요"}
                </p>
              </div>
              <CheckCircle className={`w-8 h-8 shrink-0 ${hasDates ? "text-blue-600" : "text-gray-300"}`} strokeWidth={2} />
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">• 계절과 배편을 고려하여 추천 일정을 생성합니다.</p>
        </div>

        {/* ── 사이드: 빠른 선택 + AI 추천 ────────────────────────── */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">빠른 선택</h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_DATE_PICKS.map((pick) => {
                const isActive = activeQuickPick === pick.label;
                return (
                  <button
                    key={pick.label}
                    onClick={() => handleQuickDatePick(pick)}
                    className={`px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors ${
                      isActive
                        ? "border-blue-600 bg-blue-50 text-blue-600 font-semibold"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-gray-600"
                    }`}
                  >
                    {pick.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleDirectSelect}
              className={`w-full mt-2 px-3 py-2.5 rounded-xl border-2 text-xs font-medium transition-colors ${
                activeQuickPick === "직접 선택"
                  ? "border-blue-600 bg-blue-50 text-blue-600 font-semibold"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-gray-600"
              }`}
            >
              직접 선택
            </button>
          </div>

          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <p className="text-sm font-semibold text-blue-900 mb-1.5">💡 AI 추천</p>
            <p className="text-sm text-blue-700 leading-relaxed">가을에는 2박 3일 여행이 가장 만족도가 높아요.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStyleStepDesktop = () => (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1.5">여행 인원 & 스타일</h2>
        <p className="text-gray-500">함께 떠나는 인원과 여행 스타일을 선택하세요</p>
      </div>

      <div className="flex items-center justify-center gap-5 mb-8">
        <button
          onClick={() => setFormData({ ...formData, travelers: Math.max(1, formData.travelers - 1) })}
          className="w-11 h-11 bg-gray-100 hover:bg-gray-200 rounded-full text-xl font-bold transition-colors"
        >
          -
        </button>
        <div className="text-center w-20">
          <div className="text-4xl font-bold text-gray-900">{formData.travelers}</div>
          <div className="text-sm text-gray-600">명</div>
        </div>
        <button
          onClick={() => setFormData({ ...formData, travelers: formData.travelers + 1 })}
          className="w-11 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xl font-bold transition-colors"
        >
          +
        </button>
      </div>

      <div className="mb-7">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">여행 스타일</h3>
        <div className="grid grid-cols-4 gap-3">
          {TRAVEL_STYLES.map(({ id, emoji, badge }) => (
            <button
              key={id}
              onClick={() => setFormData({ ...formData, travelType: id })}
              className={`p-4 rounded-xl border-2 transition-colors relative ${
                formData.travelType === id ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-200"
              }`}
            >
              {badge && (
                <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                  관광공사
                </span>
              )}
              <div className="text-2xl mb-1">{emoji}</div>
              <div className={`font-semibold text-sm ${formData.travelType === id ? "text-blue-600" : "text-gray-900"}`}>{id}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-7">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">예산</h3>
        <div className="grid grid-cols-3 gap-3">
          {BUDGETS.map((b) => (
            <button
              key={b}
              onClick={() => setFormData({ ...formData, budget: b })}
              className={`px-4 py-3 rounded-xl border-2 transition-colors ${
                formData.budget === b
                  ? "border-blue-600 bg-blue-50 text-blue-600 font-semibold"
                  : "border-gray-200 hover:border-blue-200"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-7">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">일정 생성 방식</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setGenerationMode("quick")}
            className={`p-4 rounded-xl border-2 text-left transition-colors relative ${
              generationMode === "quick" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-200"
            }`}
          >
            <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
              추천
            </span>
            <div className="text-2xl mb-1">⚡</div>
            <div className={`font-semibold text-sm ${generationMode === "quick" ? "text-blue-600" : "text-gray-900"}`}>빠른 일정 생성</div>
            <div className="text-xs text-gray-500 mt-0.5">AI 없이 즉시 기본 일정 생성</div>
          </button>
          <button
            onClick={() => setGenerationMode("ai")}
            className={`p-4 rounded-xl border-2 text-left transition-colors ${
              generationMode === "ai" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-200"
            }`}
          >
            <div className="text-2xl mb-1">✨</div>
            <div className={`font-semibold text-sm ${generationMode === "ai" ? "text-blue-600" : "text-gray-900"}`}>AI 추천 일정</div>
            <div className="text-xs text-gray-500 mt-0.5">관광 데이터 기반 맞춤 일정 (다소 소요)</div>
          </button>
        </div>
      </div>

      {generationMode === "ai" && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">AI에게 하고 싶은 말이 있나요? <span className="text-gray-400 font-normal">(선택)</span></h3>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
            placeholder="예: 아이랑 같이 가요, 낚시하고 싶어요, 걷는 건 최소화해주세요"
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
          />
        </div>
      )}
    </div>
  );

  const renderStepDesktop = () => {
    if (preSelectedIsland) {
      return step === 0 ? renderDateStepDesktop() : renderStyleStepDesktop();
    }
    if (step === 0) return renderIslandStepDesktop();
    if (step === 1) return renderDateStepDesktop();
    return renderStyleStepDesktop();
  };

  return (
    <div className="bg-white min-h-screen">

      {/* ================================================================
          데스크탑 레이아웃 (lg 이상)
          ================================================================ */}
      <div className="hidden lg:block">
        <div className="max-w-[1120px] mx-auto px-8">

          {/* 헤더 */}
          <div className="pt-6 pb-4 flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" strokeWidth={2} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              {preSelectedIsland ? `${preSelectedIsland} 일정 만들기` : "일정 만들기"}
            </h1>
          </div>

          {/* Step 표시 + progress */}
          <div className="pb-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-blue-600 mb-1">Step {step + 1} / {totalSteps}</p>
                <h2 className="text-base font-bold text-gray-900">{stepNames[step]}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{stepDescriptions[step]}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? "bg-blue-600" : "bg-gray-200"}`}
                />
              ))}
            </div>
          </div>

          {/* 단계 콘텐츠 */}
          <div className="py-7 min-h-[420px]">
            {renderStepDesktop()}
          </div>

          {/* 이전/다음 네비게이션 */}
          <div className="flex items-center justify-between py-5 border-t border-gray-100">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 px-5 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              이전
            </button>
            <button
              onClick={handleNextDesktop}
              disabled={nextDisabledDesktop}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600 text-base"
            >
              {isLastStep ? (
                isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                    {generationMode === "ai" ? "AI가 일정을 만들고 있어요..." : "일정을 만들고 있어요..."}
                  </>
                ) : generationMode === "ai" ? (
                  "AI 일정 생성하기 ✨"
                ) : (
                  "빠른 일정 생성하기 ⚡"
                )
              ) : (
                <>
                  다음
                  <ChevronRight className="w-4 h-4" strokeWidth={2} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================
          모바일 레이아웃 (lg 미만) — 기존 코드 완전 보존
          ================================================================ */}
      <div className="lg:hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3">
          <button
            onClick={() => step === 0 ? navigate("/travel") : setStep(step - 1)}
            className="active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {preSelectedIsland ? `${preSelectedIsland} 일정 만들기` : "일정 만들기"}
            </h1>
            <p className="text-xs text-gray-500">Step {step + 1} / {totalSteps}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white px-6 py-3 border-b border-gray-200">
          <div className="flex gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-all ${i <= step ? "bg-blue-600" : "bg-gray-200"}`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {renderStep()}
        </div>
      </div>

      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
    </div>
  );
}
