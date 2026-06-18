import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Calendar, Ship, Sparkles, MapPin, Trash2, ListChecks, Info, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ListSkeleton } from "../components/SkeletonLoader";
import { tripService } from "../../lib/tripService";

export function Travel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"plan" | "bookings">("plan");
  const [currentItinerary, setCurrentItinerary] = useState<any>(null);
  const [currentTripId, setCurrentTripId] = useState<string | null>(null);
  const [confirmedTrips, setConfirmedTrips] = useState<any[]>([]);
  const [checklistProgress, setChecklistProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [trip, progress] = await Promise.all([
        tripService.getUpcomingTrip(),
        tripService.getChecklistProgress(),
      ]);
      if (trip) {
        setCurrentItinerary({ ...trip, startDate: trip.start_date, islands: trip.islands ?? [] });
        setCurrentTripId(trip.id);
      }
      setChecklistProgress(progress);
      if (activeTab === 'bookings') {
        const trips = await tripService.getVisitedTrips();
        setConfirmedTrips(trips);
      }
      setIsLoading(false);
    };
    load();
  }, [activeTab]);

  const handleDeleteTrip = async (tripId: string) => {
    await tripService.deleteTrip(tripId);
    setConfirmedTrips(prev => prev.filter(t => t.id !== tripId));
    toast.success("여행 내역이 삭제됐어요");
  };

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
            activeTab === "plan" ? "text-blue-600" : "text-gray-500"
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
            activeTab === "bookings" ? "text-blue-600" : "text-gray-500"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Ship className="w-5 h-5" strokeWidth={2} />
            <span>지난 여행</span>
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
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/itinerary/${currentTripId}`}
                      className="inline-block bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold active:scale-95 transition-transform"
                    >
                      일정 전체보기
                    </Link>
                    {!currentItinerary.confirmed && (
                      <span className="bg-white/20 border border-white/50 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                        미확정
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Unconfirmed Banner */}
              {!currentItinerary.confirmed && (
                <Link
                  to={`/itinerary/${currentTripId}`}
                  className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4"
                >
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0" strokeWidth={2} />
                  <p className="flex-1 text-sm text-amber-800">
                    일정이 아직 미확정이에요. 열어서 확정하면 홈에도 표시돼요.
                  </p>
                  <ChevronRight className="w-4 h-4 text-amber-600 flex-shrink-0" strokeWidth={2} />
                </Link>
              )}

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
            {confirmedTrips.length === 0 ? (
              <div className="text-center py-12">
                <Ship className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">지난 여행이 없어요</h3>
                <p className="text-sm text-gray-600">여행을 다녀오면 여기에 기록돼요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {confirmedTrips.map(trip => (
                  <div key={trip.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{trip.title ?? '여행'}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" strokeWidth={2} />
                          {(trip.islands ?? []).join(', ') || '섬 정보 없음'}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteTrip(trip.id)} className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                      <span>{trip.start_date} ~ {trip.end_date}</span>
                      <Link to={`/itinerary/${trip.id}`} className="text-blue-600 font-medium">일정보기</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
