import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronLeft, CheckCircle } from "lucide-react";
import { generateItinerary, fetchIslandData } from "../utils/itineraryGenerator";
import { toast } from "sonner";
import { Confetti } from "../components/Confetti";
import { tripService } from "../../lib/tripService";

const ALL_ISLANDS = [
  "백령도", "대청도", "소청도", "연평도",
  "덕적도", "자월도", "승봉도", "대이작도",
  "소이작도", "풍도", "육도",
];

const ISLAND_PORT_MAP: Record<string, string> = {
  "백령도": "인천항", "대청도": "인천항", "소청도": "인천항", "연평도": "인천항",
  "덕적도": "인천항", "자월도": "인천항", "승봉도": "인천항", "대이작도": "인천항",
  "소이작도": "대부도", "풍도": "대부도", "육도": "대부도",
};

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
  });
  const [shakeStart, setShakeStart] = useState(false);
  const [shakeEnd, setShakeEnd] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [preSelectedIsland, setPreSelectedIsland] = useState<string | null>(null);

  useEffect(() => {
    fetchIslandData();
    const islandName = searchParams.get("name");
    if (islandName) {
      setPreSelectedIsland(islandName);
      setFormData(prev => ({ ...prev, islands: [islandName] }));
    }
  }, [searchParams]);

  const totalSteps = preSelectedIsland ? 2 : 3;

  const computedPort = ISLAND_PORT_MAP[formData.islands[0] ?? ""] ?? "인천항";

  const handleIslandToggle = (island: string) => {
    setFormData(prev => ({
      ...prev,
      islands: prev.islands.includes(island)
        ? prev.islands.filter(i => i !== island)
        : [...prev.islands, island],
    }));
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split("T")[0];
    if (selectedDate && selectedDate < today) {
      toast.error("지나간 날짜는 선택할 수 없어요");
      setShakeStart(true);
      setTimeout(() => setShakeStart(false), 500);
      return;
    }
    setFormData({ ...formData, startDate: selectedDate });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split("T")[0];
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

  const handleSubmit = async () => {
    const dataWithPort = { ...formData, departurePort: computedPort };
    const itinerary = generateItinerary(dataWithPort);
    const title = `${formData.islands.join(", ")} 여행`;
    const trip = await tripService.createTrip(title, formData.startDate, formData.endDate, formData.islands, itinerary);
    const tripId = trip?.id ?? Date.now().toString();
    localStorage.setItem(`plan_${tripId}`, JSON.stringify(itinerary));
    toast.success("일정이 생성됐어요!");
    setShowConfetti(true);
    setTimeout(() => { navigate(`/itinerary/${tripId}`); }, 2000);
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
        <p className="text-sm text-gray-600">어느 섬으로 떠나고 싶으세요?</p>
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
              <span className="font-semibold">{formData.islands.length}개 섬</span> 선택됨: {formData.islands.join(", ")}
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
          min={new Date().toISOString().split("T")[0]}
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
          min={formData.startDate || new Date().toISOString().split("T")[0]}
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
          {[
            { id: "관광", emoji: "🏖️" }, { id: "휴양", emoji: "😌" },
            { id: "체험", emoji: "🎣" }, { id: "사진", emoji: "📸" },
          ].map(({ id, emoji }) => (
            <button
              key={id}
              onClick={() => setFormData({ ...formData, travelType: id })}
              className={`p-4 rounded-xl border-2 transition-all ${
                formData.travelType === id ? "border-blue-600 bg-blue-50" : "border-gray-200 active:scale-95"
              }`}
            >
              <div className="text-2xl mb-1">{emoji}</div>
              <div className={`font-semibold ${formData.travelType === id ? "text-blue-600" : "text-gray-900"}`}>{id}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">예산</h3>
        <div className="grid grid-cols-3 gap-3">
          {["알뜰", "보통", "여유"].map((b) => (
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

      {formData.travelType && (
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform mt-6"
        >
          일정 생성하기
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-white">
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

      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
    </div>
  );
}
