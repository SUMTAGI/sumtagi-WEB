import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronLeft, Calendar, CheckCircle } from "lucide-react";
import { generateItinerary } from "../utils/itineraryGenerator";
import { toast } from "sonner";
import { Confetti } from "../components/Confetti";

export function CreateTrip() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    departurePort: "",
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

  // URL 파라미터에서 섬 정보 확인 - 섬 상세에서 온 경우
  useEffect(() => {
    const islandName = searchParams.get("name");
    if (islandName) {
      setPreSelectedIsland(islandName);
      setFormData(prev => ({
        ...prev,
        islands: [islandName]
      }));
    }
  }, [searchParams]);

  const handleIslandToggle = (island: string) => {
    setFormData(prev => ({
      ...prev,
      islands: prev.islands.includes(island)
        ? prev.islands.filter(i => i !== island)
        : [...prev.islands, island]
    }));
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];

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
    const today = new Date().toISOString().split('T')[0];

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

  const handleSubmit = () => {
    // 일정 생성
    const itinerary = generateItinerary(formData);
    const itineraryId = Date.now().toString();
    localStorage.setItem(`itinerary_${itineraryId}`, JSON.stringify(itinerary));
    localStorage.setItem('currentItineraryId', itineraryId);

    toast.success("일정이 생성됐어요!");
    setShowConfetti(true);
    setTimeout(() => {
      navigate(`/itinerary/${itineraryId}`);
    }, 2000);
  };

  const canProceed = () => {
    if (step === 2) return formData.startDate && formData.endDate;
    if (step === 3) return formData.travelers > 0;
    return true;
  };

  const getAvailableIslands = () => {
    if (formData.departurePort === "인천항") {
      return ["백령도", "대청도", "소청도", "연평도", "덕적도", "자월도", "승봉도", "대이작도"];
    } else if (formData.departurePort === "대부도") {
      return ["자월도", "승봉도", "대이작도", "소이작도", "덕적도", "풍도", "육도"];
    }
    return [];
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (step === 0) {
                navigate("/travel");
              } else if (step === 2 && preSelectedIsland) {
                setStep(0); // 섬이 미리 선택된 경우 step 1을 건너뛰었으므로 step 0으로
              } else {
                setStep(step - 1);
              }
            }}
            className="active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {preSelectedIsland ? `${preSelectedIsland} 일정 만들기` : '일정 만들기'}
            </h1>
            <p className="text-xs text-gray-500">
              Step {preSelectedIsland ? (step >= 2 ? step : step + 1) : step + 1} / {preSelectedIsland ? 3 : 4}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white px-6 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex gap-2">
          {(preSelectedIsland ? [0, 2, 3] : [0, 1, 2, 3]).map((s, index) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-all ${
                (preSelectedIsland ? (step >= s) : (s <= step)) ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {step === 0 && (
          <div className="space-y-6">
            {preSelectedIsland && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-1">선택된 섬</p>
                <p className="text-lg font-bold text-blue-700">{preSelectedIsland}</p>
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">출발 항구 선택</h2>
              <p className="text-sm text-gray-600">
                {preSelectedIsland ? `${preSelectedIsland}로 가는 항구를 선택하세요` : '여행을 시작할 항구를 선택하세요'}
              </p>
            </div>

            <div className="space-y-4">
              {/* 인천항 연안여객터미널 */}
              <div
                onClick={() => setFormData({ ...formData, departurePort: "인천항" })}
                className={`border-2 rounded-2xl p-5 cursor-pointer transition-all active:scale-98 ${
                  formData.departurePort === "인천항"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className={`text-lg font-bold mb-1 ${
                      formData.departurePort === "인천항" ? "text-blue-900" : "text-gray-900"
                    }`}>
                      인천항 연안여객터미널
                    </h3>
                    <p className={`text-sm ${
                      formData.departurePort === "인천항" ? "text-blue-700" : "text-gray-600"
                    }`}>
                      인천 도서 지역 주요 여객선 출발지
                    </p>
                  </div>
                  {formData.departurePort === "인천항" && (
                    <CheckCircle className="w-6 h-6 text-blue-600" strokeWidth={2} />
                  )}
                </div>
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">이 항구에서 갈 수 있는 섬</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["백령도", "대청도", "소청도", "연평도", "덕적도", "자월도", "승봉도", "대이작도"].map((island) => (
                      <span
                        key={island}
                        className={`text-xs px-2 py-1 rounded-full ${
                          formData.departurePort === "인천항"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {island}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 대부도 방아머리여객터미널 */}
              <div
                onClick={() => setFormData({ ...formData, departurePort: "대부도" })}
                className={`border-2 rounded-2xl p-5 cursor-pointer transition-all active:scale-98 ${
                  formData.departurePort === "대부도"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className={`text-lg font-bold mb-1 ${
                      formData.departurePort === "대부도" ? "text-blue-900" : "text-gray-900"
                    }`}>
                      대부도 방아머리여객터미널
                    </h3>
                    <p className={`text-sm ${
                      formData.departurePort === "대부도" ? "text-blue-700" : "text-gray-600"
                    }`}>
                      수도권 남부에서 접근하기 좋은 섬 여행 출발지
                    </p>
                  </div>
                  {formData.departurePort === "대부도" && (
                    <CheckCircle className="w-6 h-6 text-blue-600" strokeWidth={2} />
                  )}
                </div>
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">이 항구에서 갈 수 있는 섬</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["자월도", "승봉도", "대이작도", "소이작도", "덕적도", "풍도", "육도"].map((island) => (
                      <span
                        key={island}
                        className={`text-xs px-2 py-1 rounded-full ${
                          formData.departurePort === "대부도"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {island}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 다음 버튼 */}
            {formData.departurePort && (
              <button
                onClick={() => setStep(preSelectedIsland ? 2 : 1)}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform mt-6"
              >
                {preSelectedIsland ? `다음: 날짜 선택` : `다음: 방문할 섬 선택`}
              </button>
            )}
          </div>
        )}

        {step === 1 && !preSelectedIsland && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">방문할 섬 선택</h2>
              <p className="text-sm text-gray-600">{formData.departurePort}에서 갈 수 있는 섬이에요</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {getAvailableIslands().map((island) => (
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
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">{formData.islands.length}개 섬</span> 선택됨: {formData.islands.join(', ')}
                </p>
              </div>
            )}

            {/* 다음 버튼 */}
            {formData.islands.length > 0 && (
              <button
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform"
              >
                다음: 날짜 선택
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">여행 날짜</h2>
              <p className="text-sm text-gray-600">언제 떠나시나요?</p>
            </div>

            {/* 출발일 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">출발일</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={handleStartDateChange}
                className={`w-full px-4 py-4 text-base border-2 border-gray-300 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                  shakeStart ? 'animate-shake border-red-500' : ''
                }`}
                style={{
                  WebkitAppearance: 'none',
                  colorScheme: 'light'
                }}
                min={new Date().toISOString().split('T')[0]}
              />
              {formData.startDate && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-blue-600" strokeWidth={2} />
                  <p className="text-sm text-blue-700 font-medium">
                    {new Date(formData.startDate + 'T00:00:00').toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* 귀가일 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 block">귀가일</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={handleEndDateChange}
                className={`w-full px-4 py-4 text-base border-2 border-gray-300 rounded-xl bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${
                  shakeEnd ? 'animate-shake border-red-500' : ''
                }`}
                style={{
                  WebkitAppearance: 'none',
                  colorScheme: 'light'
                }}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
              {formData.endDate && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-blue-600" strokeWidth={2} />
                  <p className="text-sm text-blue-700 font-medium">
                    {new Date(formData.endDate + 'T00:00:00').toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* 여행 기간 요약 */}
            {formData.startDate && formData.endDate && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-1">총 여행 기간</p>
                    <p className="text-lg font-bold text-gray-900">
                      {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))}박 {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}일
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-600" strokeWidth={2} />
                </div>
              </div>
            )}

            {/* 다음 버튼 - 날짜 선택 완료 시에만 표시 */}
            {formData.startDate && formData.endDate && (
              <button
                onClick={() => setStep(3)}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform mt-6"
              >
                다음: 인원 & 스타일 선택
              </button>
            )}
          </div>
        )}

        {step === 3 && (
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
                {["관광", "휴양", "체험", "사진"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, travelType: type })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.travelType === type
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 active:scale-95"
                    }`}
                  >
                    <div className="text-2xl mb-1">
                      {type === "관광" && "🏖️"}
                      {type === "휴양" && "😌"}
                      {type === "체험" && "🎣"}
                      {type === "사진" && "📸"}
                    </div>
                    <div className={`font-semibold ${
                      formData.travelType === type ? "text-blue-600" : "text-gray-900"
                    }`}>
                      {type}
                    </div>
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

            {/* 일정 생성 버튼 */}
            {formData.travelType && (
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform mt-6"
              >
                일정 생성하기
              </button>
            )}
          </div>
        )}
      </div>
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
    </div>
  );
}
