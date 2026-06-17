import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, MapPin, Calendar } from "lucide-react";
import { tripService } from "../../lib/tripService";

export function VisitedIslands() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    tripService.getVisitedTrips().then(data => setTrips(data));
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate("/my")}
          className="active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">방문한 섬</h1>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">🏝️</div>
            <p className="text-xl font-bold text-gray-900">{trips.length}</p>
            <p className="text-xs text-gray-600">방문한 섬</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">✈️</div>
            <p className="text-xl font-bold text-gray-900">{trips.length}</p>
            <p className="text-xs text-gray-600">완료 여행</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {trips.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">아직 방문한 섬이 없어요</h3>
            <p className="text-sm text-gray-600">여행을 다녀오면 여기에 기록돼요</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map(trip => (
              <div key={trip.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900 mb-2">{trip.title ?? '여행'}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <MapPin className="w-4 h-4" strokeWidth={2} />
                  <span>{(trip.islands ?? []).join(', ') || '섬 정보 없음'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" strokeWidth={2} />
                  <span>{trip.start_date} ~ {trip.end_date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
