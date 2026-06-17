import { useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, Users, Heart, Compass, Sparkles, ChevronRight } from "lucide-react";
import { generateItinerary } from "../utils/itineraryGenerator";
import { tripService } from "../../lib/tripService";

export function PlanTrip() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    travelers: 2,
    travelType: "관광",
    islands: [] as string[],
    budget: "보통",
  });

  const handleSubmit = async () => {
    const itinerary = generateItinerary(formData);
    const title = `${(formData.islands ?? []).join(', ') || '섬'} 여행`;
    const trip = await tripService.createTrip(title, formData.startDate, formData.endDate, formData.islands);
    const tripId = trip?.id ?? Date.now().toString();
    localStorage.setItem(`plan_${tripId}`, JSON.stringify(itinerary));
    navigate(`/itinerary/${tripId}`);
  };

  const handleIslandToggle = (island: string) => {
    setFormData(prev => ({
      ...prev,
      islands: prev.islands.includes(island)
        ? prev.islands.filter(i => i !== island)
        : [...prev.islands, island]
    }));
  };

  const availableIslands = [
    "백령도", "대청도", "덕적도", "자월도",
    "영흥도", "이작도", "승봉도", "선재도"
  ];

  const canProceed = () => {
    if (step === 1) return formData.startDate && formData.endDate;
    if (step === 2) return formData.travelers > 0;
    if (step === 3) return formData.travelType;
    if (step === 4) return true;
    return true;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-shrink-0">
        <h1 className="text-xl font-bold mb-1">여행 일정 만들기</h1>
        <p className="text-sm text-blue-100">Step {step} / 5</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-200 h-1 flex-shrink-0">
        <div
          className="bg-blue-600 h-full transition-all duration-300"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">여행 날짜를 선택해주세요</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" strokeWidth={2} />
                  출발일
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" strokeWidth={2} />
                  귀가일
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">여행 인원을 선택해주세요</h2>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setFormData({ ...formData, travelers: Math.max(1, formData.travelers - 1) })}
                className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold active:scale-95 transition-transform" strokeWidth={2}
              >
                -
              </button>
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                  <Users className="w-12 h-12 text-blue-600" strokeWidth={2} />
                </div>
                <div className="text-4xl font-bold text-gray-900">{formData.travelers}</div>
                <div className="text-sm text-gray-600 mt-1">명</div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, travelers: formData.travelers + 1 })}
                className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold active:scale-95 transition-transform" strokeWidth={2}
              >
                +
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">여행 스타일을 선택해주세요</h2>
            <div className="grid grid-cols-2 gap-3">
              {["관광", "휴양", "체험", "사진"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, travelType: type })}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    formData.travelType === type
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white active:scale-95"
                  }`}
                >
                  <div className="text-3xl mb-2">
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
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">방문하고 싶은 섬</h2>
              <p className="text-sm text-gray-600">선택하지 않으면 자동으로 추천됩니다</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {availableIslands.map((island) => (
                <button
                  key={island}
                  onClick={() => handleIslandToggle(island)}
                  className={`px-4 py-4 rounded-xl border-2 transition-all ${
                    formData.islands.includes(island)
                      ? "border-blue-600 bg-blue-50 text-blue-600 font-semibold"
                      : "border-gray-200 bg-white active:scale-95"
                  }`}
                >
                  {island}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">예산 수준을 선택해주세요</h2>
            <div className="space-y-3">
              {[
                { value: "경제적", label: "경제적", desc: "민박, 기본 식사", emoji: "💰" },
                { value: "보통", label: "보통", desc: "펜션, 일반 식당", emoji: "💵" },
                { value: "여유있게", label: "여유있게", desc: "리조트, 맛집 투어", emoji: "💎" }
              ].map((budget) => (
                <button
                  key={budget.value}
                  onClick={() => setFormData({ ...formData, budget: budget.value })}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    formData.budget === budget.value
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white active:scale-95"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{budget.emoji}</div>
                    <div className="flex-1">
                      <div className={`font-semibold mb-1 ${
                        formData.budget === budget.value ? "text-blue-600" : "text-gray-900"
                      }`}>
                        {budget.label}
                      </div>
                      <div className="text-sm text-gray-600">{budget.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-6 bg-white border-t border-gray-200 flex-shrink-0 space-y-2">
        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            다음
            <ChevronRight className="w-5 h-5" strokeWidth={2} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Sparkles className="w-5 h-5" strokeWidth={2} />
            일정 생성하기
          </button>
        )}
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium active:scale-95 transition-transform"
          >
            이전
          </button>
        )}
      </div>
    </div>
  );
}
