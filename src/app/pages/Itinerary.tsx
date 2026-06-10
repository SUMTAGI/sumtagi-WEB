import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Ship, MapPin, Hotel, UtensilsCrossed, Users, DollarSign, Download, Share2, ChevronLeft } from "lucide-react";
import type { GeneratedItinerary, Activity } from "../utils/itineraryGenerator";
import { toast } from "sonner";
import { RouteMap } from "../components/RouteMap";

export function Itinerary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (!id) return;

    const stored = localStorage.getItem(`itinerary_${id}`);
    if (stored) {
      const data = JSON.parse(stored);
      setItinerary(data);
      setIsConfirmed(data.confirmed || false);
    } else {
      navigate("/plan");
    }
  }, [id, navigate]);

  const handleConfirm = () => {
    if (!itinerary || !id) return;

    const updatedItinerary = { ...itinerary, confirmed: true };
    setItinerary(updatedItinerary);
    setIsConfirmed(true);
    localStorage.setItem(`itinerary_${id}`, JSON.stringify(updatedItinerary));
    localStorage.setItem('currentItineraryId', id);
    toast.success("일정이 확정됐어요! 홈에서 확인하세요");
  };

  const handleBookActivity = (activity: Activity) => {
    if (activity.bookingStatus === "booked") {
      toast.info("이미 예약된 항목입니다");
      return;
    }

    const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    bookings.push({
      id: `booking-${Date.now()}`,
      itineraryId: id,
      activity,
      bookedAt: new Date().toISOString(),
      status: "confirmed",
    });
    localStorage.setItem("bookings", JSON.stringify(bookings));

    if (itinerary) {
      const updatedItinerary = { ...itinerary };
      updatedItinerary.days.forEach(day => {
        day.activities.forEach(act => {
          if (act.id === activity.id) {
            act.bookingStatus = "booked";
          }
        });
      });
      setItinerary(updatedItinerary);
      localStorage.setItem(`itinerary_${id}`, JSON.stringify(updatedItinerary));
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

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with Background */}
      <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-4 flex-shrink-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1633775362313-fed93ef8e824?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-blue-700/80"></div>
        <div className="relative z-10">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 mb-3 text-blue-100 active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            <span className="text-sm">홈으로</span>
          </button>
          <h1 className="text-xl font-bold mb-2">{itinerary.title}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-blue-100">
            <div className="flex items-center gap-1">
              <Ship className="w-4 h-4" strokeWidth={2} />
              <span>{itinerary.departurePort || "인천항"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" strokeWidth={2} />
              <span>{itinerary.travelers}명</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" strokeWidth={2} />
              <span>{itinerary.totalCost.toLocaleString()}원</span>
            </div>
          </div>
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
          </div>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0 overflow-x-auto">
        <div className="flex gap-2">
          {itinerary.days.map((day, index) => (
            <button
              key={day.date}
              onClick={() => setSelectedDay(index)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all flex-shrink-0 ${
                selectedDay === index
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 active:scale-95"
              }`}
            >
              Day {day.dayNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Day Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Day {currentDay.dayNumber}
          </h2>
          <p className="text-sm text-gray-600">
            {new Date(currentDay.date).toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
              weekday: 'short'
            })}
          </p>
        </div>

        {/* Activities */}
        <div className="px-6 py-4 space-y-4">
          {currentDay.activities.map((activity, index) => (
            <ActivityCardMobile
              key={activity.id}
              activity={activity}
              isLast={index === currentDay.activities.length - 1}
              onBook={handleBookActivity}
            />
          ))}
        </div>

        {/* Map Section */}
        <div className="px-6 py-6 bg-white mt-4">
          <h3 className="font-semibold text-gray-900 mb-3">여행 경로</h3>
          <RouteMap islands={itinerary.islands} departurePort={itinerary.departurePort} />
          <p className="text-xs text-gray-600 mt-2 text-center">
            {[itinerary.departurePort || "인천항", ...itinerary.islands, itinerary.departurePort || "인천항"].join(" → ")}
          </p>
        </div>

        {/* Budget Summary */}
        <div className="px-6 py-6 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-3">예산 요약</h3>
          <div className="bg-white rounded-xl p-4 space-y-2">
            <BudgetItemMobile
              label="여객선"
              amount={itinerary.days.reduce((sum, day) =>
                sum + day.activities.filter(a => a.type === "ferry").reduce((s, a) => s + (a.price || 0), 0), 0
              )}
            />
            <BudgetItemMobile
              label="숙박"
              amount={itinerary.days.reduce((sum, day) =>
                sum + day.activities.filter(a => a.type === "accommodation").reduce((s, a) => s + (a.price || 0), 0), 0
              )}
            />
            <BudgetItemMobile
              label="식사"
              amount={itinerary.days.reduce((sum, day) =>
                sum + day.activities.filter(a => a.type === "meal").reduce((s, a) => s + (a.price || 0), 0), 0
              )}
            />
            <div className="border-t border-gray-200 pt-2 mt-2">
              <BudgetItemMobile
                label="총 예산"
                amount={itinerary.totalCost}
                isTotal
              />
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        {!isConfirmed && (
          <div className="px-6 py-6">
            <button
              onClick={handleConfirm}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              일정 확정하기
            </button>
            <p className="text-xs text-gray-600 text-center mt-2">
              확정하면 홈 화면에서 일정을 바로 확인할 수 있어요
            </p>
          </div>
        )}

        {isConfirmed && (
          <div className="px-6 py-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Ship className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-1">일정이 확정됐어요</p>
                <p className="text-xs text-green-700">홈 화면에서 일정을 확인하세요</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityCardMobile({
  activity,
  isLast,
  onBook
}: {
  activity: Activity;
  isLast: boolean;
  onBook: (activity: Activity) => void;
}) {
  const getIcon = () => {
    switch (activity.type) {
      case "ferry": return <Ship className="w-5 h-5" strokeWidth={2} />;
      case "accommodation": return <Hotel className="w-5 h-5" strokeWidth={2} />;
      case "meal": return <UtensilsCrossed className="w-5 h-5" strokeWidth={2} />;
      case "attraction": return <MapPin className="w-5 h-5" strokeWidth={2} />;
      default: return null;
    }
  };

  const getTypeColor = () => {
    switch (activity.type) {
      case "ferry": return "bg-blue-100 text-blue-600";
      case "accommodation": return "bg-purple-100 text-purple-600";
      case "meal": return "bg-orange-100 text-orange-600";
      case "attraction": return "bg-green-100 text-green-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const canBook = activity.type === "ferry" || activity.type === "accommodation";

  return (
    <div className="relative">
      <div className="flex gap-3">
        <div className="flex flex-col items-center flex-shrink-0">
          <div className={`w-10 h-10 rounded-full ${getTypeColor()} flex items-center justify-center`}>
            {getIcon()}
          </div>
          {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
        </div>

        <div className="flex-1 pb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-2">
              <div className="text-sm font-semibold text-blue-600">{activity.time}</div>
              {activity.congestionLevel && (
                <span className={`text-xs px-2 py-1 rounded ${
                  activity.congestionLevel === "low" ? "bg-green-100 text-green-700" :
                  activity.congestionLevel === "medium" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {activity.congestionLevel === "low" ? "여유" :
                   activity.congestionLevel === "medium" ? "보통" : "혼잡"}
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
                <span className="text-sm font-semibold text-gray-900">
                  {activity.price.toLocaleString()}원
                </span>
              )}
            </div>

            {canBook && (
              <button
                onClick={() => onBook(activity)}
                disabled={activity.bookingStatus === "booked"}
                className={`w-full mt-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activity.bookingStatus === "booked"
                    ? "bg-gray-100 text-gray-500"
                    : "bg-blue-600 text-white active:scale-95"
                }`}
              >
                {activity.bookingStatus === "booked" ? "예약완료" : "예약하기"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetItemMobile({ label, amount, isTotal = false }: { label: string; amount: number; isTotal?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${isTotal ? "font-bold text-base" : "text-sm"}`}>
      <span className="text-gray-700">{label}</span>
      <span className={isTotal ? "text-blue-600" : "text-gray-900"}>
        {amount.toLocaleString()}원
      </span>
    </div>
  );
}
