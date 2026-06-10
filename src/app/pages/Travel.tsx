import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Calendar, Ship, Sparkles, XCircle, MapPin, Trash2, CheckCircle, Clock, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { ListSkeleton } from "../components/SkeletonLoader";

interface Booking {
  id: string;
  itineraryId: string;
  activity: Activity;
  bookedAt: string;
  status: "confirmed" | "cancelled" | "pending";
}

export function Travel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"plan" | "bookings">("plan");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentItinerary, setCurrentItinerary] = useState<any>(null);
  const [checklistProgress, setChecklistProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load current itinerary
    const currentId = localStorage.getItem('currentItineraryId');
    if (currentId) {
      const stored = localStorage.getItem(`itinerary_${currentId}`);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.confirmed) {
          setCurrentItinerary(data);
        }
      }
    }

    // Load checklist progress
    const checklistItems = JSON.parse(localStorage.getItem("checklistItems") || "[]");
    if (checklistItems.length > 0) {
      const completed = checklistItems.filter((item: any) => item.checked).length;
      setChecklistProgress(Math.round((completed / checklistItems.length) * 100));
    }

    if (activeTab === "bookings") {
      loadBookings();
    }

    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const loadBookings = () => {
    const stored = localStorage.getItem("bookings");
    if (stored) {
      setBookings(JSON.parse(stored));
    }
  };


  const handleCancelBooking = (bookingId: string) => {
    const updated = bookings.map(booking =>
      booking.id === bookingId
        ? { ...booking, status: "cancelled" as const }
        : booking
    );
    setBookings(updated);
    localStorage.setItem("bookings", JSON.stringify(updated));
    toast.success("예약이 취소됐어요");
  };

  const handleDeleteBooking = (bookingId: string) => {
    const updated = bookings.filter(booking => booking.id !== bookingId);
    setBookings(updated);
    localStorage.setItem("bookings", JSON.stringify(updated));
    toast.success("예약 내역이 삭제됐어요");
  };

  const confirmedBookings = bookings.filter(b => b.status === "confirmed");
  const totalCost = confirmedBookings.reduce((sum, b) => sum + (b.activity.price || 0), 0);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with Background */}
      <div className="relative px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-shrink-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1633775362266-2e314af7c30f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-blue-700/80"></div>
        <div className="relative z-10">
          <h1 className="text-xl font-bold mb-1">여행 계획</h1>
          <p className="text-sm text-blue-100">일정 생성과 예약 관리</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => setActiveTab("plan")}
          className={`flex-1 py-3 font-medium transition-colors relative ${
            activeTab === "plan"
              ? "text-blue-600"
              : "text-gray-500"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Calendar className="w-5 h-5" strokeWidth={2} />
            <span>일정 생성</span>
          </div>
          {activeTab === "plan" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex-1 py-3 font-medium transition-colors relative ${
            activeTab === "bookings"
              ? "text-blue-600"
              : "text-gray-500"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Ship className="w-5 h-5" strokeWidth={2} />
            <span>예약 관리</span>
            {confirmedBookings.length > 0 && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {confirmedBookings.length}
              </span>
            )}
          </div>
          {activeTab === "bookings" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-6 py-4">
            <ListSkeleton count={3} />
          </div>
        ) : activeTab === "plan" ? (
          currentItinerary ? (
            <div className="px-6 py-4 space-y-4">
              {/* Upcoming Trip Highlight */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg">다가오는 여행</h3>
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const startDate = new Date(currentItinerary.startDate + 'T00:00:00');
                      const dday = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      return dday >= 0 ? (
                        <div className="bg-white/20 px-3 py-1 rounded-full">
                          <span className="text-sm font-bold">
                            {dday === 0 ? "오늘 출발!" : `D-${dday}`}
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <h2 className="text-xl font-bold mb-2">{currentItinerary.title}</h2>
                  <div className="flex items-center gap-2 text-sm text-blue-100 mb-4">
                    <MapPin className="w-4 h-4" strokeWidth={2} />
                    <span>{currentItinerary.islands.join(', ')}</span>
                  </div>
                  <Link
                    to={`/itinerary/${localStorage.getItem('currentItineraryId')}`}
                    className="inline-block bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold active:scale-95 transition-transform"
                  >
                    일정 전체보기
                  </Link>
                </div>
              </div>

              {/* Preparation Status */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-blue-600" strokeWidth={2} />
                  준비 상황
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700">체크리스트</span>
                      <span className="text-sm font-semibold text-blue-600">{checklistProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${checklistProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button
                      onClick={() => navigate('/checklist')}
                      className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium active:scale-95 transition-transform"
                    >
                      체크리스트
                    </button>
                    <button
                      onClick={() => navigate('/budget')}
                      className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium active:scale-95 transition-transform"
                    >
                      경비관리
                    </button>
                    <button
                      onClick={() => navigate('/schedule')}
                      className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium active:scale-95 transition-transform"
                    >
                      시간표
                    </button>
                  </div>
                </div>
              </div>

              {/* Create New Trip Button */}
              <button
                onClick={() => navigate("/create-trip")}
                className="w-full border-2 border-dashed border-gray-300 text-gray-600 py-4 rounded-xl font-semibold active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" strokeWidth={2} />
                새 여행 계획 만들기
              </button>
            </div>
          ) : (
            <div className="px-6 py-6 flex flex-col items-center justify-center h-full">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-blue-600" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  AI 맞춤 일정 생성
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  여행 날짜와 스타일을 선택하면<br />
                  최적의 일정을 자동으로 만들어드려요
                </p>
                <button
                  onClick={() => navigate("/create-trip")}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" strokeWidth={2} />
                  일정 만들기 시작
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="px-6 py-4">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <Ship className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">예약 내역이 없어요</h3>
                <p className="text-sm text-gray-600">
                  일정을 생성하고 예약해보세요
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-blue-600 mb-1">확정 예약</p>
                    <p className="text-2xl font-bold text-blue-700">{confirmedBookings.length}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-blue-600 mb-1">총 금액</p>
                    <p className="text-2xl font-bold text-blue-700">{Math.floor(totalCost / 10000)}만</p>
                  </div>
                </div>

                {/* Travel Route Map */}
                {confirmedBookings.length > 0 && (
                  <div className="mb-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-100">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Ship className="w-4 h-4" strokeWidth={2} />
                      여행 경로
                    </h3>
                    <div className="relative h-32 bg-white/50 rounded-lg overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <marker id="arrow-travel" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <polygon points="0 0, 6 3, 0 6" fill="#3b82f6" opacity="0.7" />
                          </marker>
                        </defs>

                        {/* Route line */}
                        <line x1="15" y1="20" x2="85" y2="20" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" markerEnd="url(#arrow-travel)" />

                        {/* Start point */}
                        <circle cx="15" cy="20" r="3" fill="#ef4444" stroke="white" strokeWidth="1.5" />
                        <text x="15" y="32" fontSize="4" fill="#374151" textAnchor="middle" fontWeight="600">
                          {confirmedBookings[0].activity.title.includes("인천항") ? "인천항" :
                           confirmedBookings[0].activity.title.includes("대부도") ? "대부도" : "출발"}
                        </text>

                        {/* End point */}
                        <circle cx="85" cy="20" r="3" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
                        <text x="85" y="32" fontSize="4" fill="#374151" textAnchor="middle" fontWeight="600">
                          {confirmedBookings[0].activity.location}
                        </text>
                      </svg>
                    </div>
                    <p className="text-xs text-blue-700 mt-2 text-center">
                      {confirmedBookings[0].activity.title.includes("인천항") ? "인천항" :
                       confirmedBookings[0].activity.title.includes("대부도") ? "대부도" : "출발"} → {confirmedBookings.map(b => b.activity.location).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <BookingCardCompact
                      key={booking.id}
                      booking={booking}
                      onCancel={handleCancelBooking}
                      onDelete={handleDeleteBooking}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

function BookingCardCompact({
  booking,
  onCancel,
  onDelete
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm mb-1">{booking.activity.title}</h4>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <MapPin className="w-3 h-3" strokeWidth={2} />
            {booking.activity.location}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          booking.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {booking.status === "confirmed" ? "확정" : "취소"}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="font-bold text-blue-600">{booking.activity.price?.toLocaleString()}원</span>
        <button
          onClick={() => setShowActions(!showActions)}
          className="text-sm text-blue-600 font-medium"
        >
          {showActions ? "닫기" : "관리"}
        </button>
      </div>

      {showActions && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          {booking.status === "confirmed" && (
            <button
              onClick={() => onCancel(booking.id)}
              className="flex-1 px-3 py-2 border border-red-300 text-red-700 rounded-lg text-sm active:scale-95 transition-transform"
            >
              취소
            </button>
          )}
          <button
            onClick={() => onDelete(booking.id)}
            className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm active:scale-95 transition-transform"
          >
            삭제
          </button>
          <Link
            to={`/itinerary/${booking.itineraryId}`}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm text-center active:scale-95 transition-transform"
          >
            일정보기
          </Link>
        </div>
      )}
    </div>
  );
}
