import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Ship, Clock, MapPin, Bell, Bus, Car, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface FerrySchedule {
  id: string;
  route: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  vessel: string;
  status: "정상" | "지연" | "결항";
}

const FERRY_SCHEDULES: FerrySchedule[] = [
  {
    id: "f1",
    route: "인천항 → 백령도",
    departure: "인천항",
    arrival: "백령도",
    departureTime: "08:00",
    arrivalTime: "12:00",
    duration: "4시간",
    price: 45000,
    vessel: "하모니플라워호",
    status: "정상"
  },
  {
    id: "f2",
    route: "백령도 → 인천항",
    departure: "백령도",
    arrival: "인천항",
    departureTime: "14:00",
    arrivalTime: "18:00",
    duration: "4시간",
    price: 45000,
    vessel: "하모니플라워호",
    status: "정상"
  },
  {
    id: "f3",
    route: "인천항 → 덕적도",
    departure: "인천항",
    arrival: "덕적도",
    departureTime: "09:00",
    arrivalTime: "11:30",
    duration: "2.5시간",
    price: 28000,
    vessel: "섬사랑2호",
    status: "정상"
  },
  {
    id: "f4",
    route: "덕적도 → 인천항",
    departure: "덕적도",
    arrival: "인천항",
    departureTime: "15:00",
    arrivalTime: "17:30",
    duration: "2.5시간",
    price: 28000,
    vessel: "섬사랑2호",
    status: "정상"
  },
  {
    id: "f5",
    route: "인천항 → 영흥도",
    departure: "인천항",
    arrival: "영흥도",
    departureTime: "10:00",
    arrivalTime: "11:00",
    duration: "1시간",
    price: 15000,
    vessel: "영흥페리호",
    status: "정상"
  },
  {
    id: "f6",
    route: "영흥도 → 인천항",
    departure: "영흥도",
    arrival: "인천항",
    departureTime: "16:00",
    arrivalTime: "17:00",
    duration: "1시간",
    price: 15000,
    vessel: "영흥페리호",
    status: "정상"
  },
  {
    id: "f7",
    route: "대부도 → 자월도",
    departure: "대부도",
    arrival: "자월도",
    departureTime: "09:30",
    arrivalTime: "11:30",
    duration: "2시간",
    price: 25000,
    vessel: "코리아킹호",
    status: "정상"
  },
  {
    id: "f8",
    route: "자월도 → 대부도",
    departure: "자월도",
    arrival: "대부도",
    departureTime: "14:30",
    arrivalTime: "16:30",
    duration: "2시간",
    price: 25000,
    vessel: "코리아킹호",
    status: "정상"
  },
];

interface LocalTransport {
  island: string;
  bus?: {
    routes: string[];
    interval: string;
    firstBus: string;
    lastBus: string;
  };
  taxi: {
    available: boolean;
    contact?: string;
  };
  rental: {
    available: boolean;
    types: string[];
    contact?: string;
  };
}

const LOCAL_TRANSPORT: LocalTransport[] = [
  {
    island: "백령도",
    bus: {
      routes: ["항구 - 두무진", "항구 - 사곶해변"],
      interval: "1-2시간",
      firstBus: "07:00",
      lastBus: "18:00"
    },
    taxi: {
      available: true,
      contact: "032-836-3000"
    },
    rental: {
      available: true,
      types: ["자전거", "전동스쿠터"],
      contact: "032-836-5500"
    }
  },
  {
    island: "덕적도",
    bus: {
      routes: ["진리 - 서포리", "진리 - 비조봉"],
      interval: "2시간",
      firstBus: "08:00",
      lastBus: "17:00"
    },
    taxi: {
      available: true,
      contact: "032-831-5000"
    },
    rental: {
      available: true,
      types: ["자전거", "전동스쿠터", "ATV"],
      contact: "032-831-7700"
    }
  },
  {
    island: "영흥도",
    bus: {
      routes: ["항구 - 십리포", "순환버스"],
      interval: "30분-1시간",
      firstBus: "06:30",
      lastBus: "19:00"
    },
    taxi: {
      available: true,
      contact: "032-886-5000"
    },
    rental: {
      available: true,
      types: ["자전거", "전동스쿠터", "자동차"],
      contact: "032-886-8800"
    }
  },
  {
    island: "자월도",
    taxi: {
      available: true,
      contact: "032-832-3000"
    },
    rental: {
      available: true,
      types: ["자전거"],
      contact: "032-832-5500"
    }
  },
];

export function Schedule() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"ferry" | "local">("ferry");
  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const [selectedIsland, setSelectedIsland] = useState<string>("백령도");

  const routes = ["all", ...Array.from(new Set(FERRY_SCHEDULES.map(s => s.departure)))];

  const filteredSchedules = FERRY_SCHEDULES.filter(schedule => {
    if (selectedRoute === "all") return true;
    return schedule.departure === selectedRoute;
  });

  const setAlarm = (schedule: FerrySchedule) => {
    toast.success(`${schedule.departureTime} 출항 1시간 전에 알림을 드릴게요`);
  };

  const currentTransport = LOCAL_TRANSPORT.find(t => t.island === selectedIsland);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-3 text-blue-100 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          <span className="text-sm">뒤로</span>
        </button>
        <h1 className="text-xl font-bold mb-1">교통 시간표</h1>
        <p className="text-sm text-blue-100">여객선 및 섬 내부 교통 정보</p>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex gap-2 flex-shrink-0">
        <button
          onClick={() => setActiveTab("ferry")}
          className={`flex-1 py-2 rounded-lg font-medium transition-all ${
            activeTab === "ferry"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          여객선
        </button>
        <button
          onClick={() => setActiveTab("local")}
          className={`flex-1 py-2 rounded-lg font-medium transition-all ${
            activeTab === "local"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          섬 내부 교통
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "ferry" ? (
          <>
            {/* Route Filter */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">출발지</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {routes.map(route => (
                  <button
                    key={route}
                    onClick={() => setSelectedRoute(route)}
                    className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                      selectedRoute === route
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-200"
                    }`}
                  >
                    {route === "all" ? "전체" : route}
                  </button>
                ))}
              </div>
            </div>

            {/* Ferry Schedules */}
            <div className="px-6 py-4 space-y-3">
              {filteredSchedules.map(schedule => (
                <FerryCard key={schedule.id} schedule={schedule} onSetAlarm={setAlarm} />
              ))}
            </div>

            {/* Notice */}
            <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div className="text-sm text-yellow-800">
                  <div className="font-semibold mb-1">운항 안내</div>
                  <ul className="space-y-1">
                    <li>• 기상 상황에 따라 운항이 지연되거나 결항될 수 있어요</li>
                    <li>• 출항 30분 전까지 승선 수속을 완료해주세요</li>
                    <li>• 성수기에는 사전 예약을 권장해요</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Island Selector */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">섬 선택</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {LOCAL_TRANSPORT.map(transport => (
                  <button
                    key={transport.island}
                    onClick={() => setSelectedIsland(transport.island)}
                    className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                      selectedIsland === transport.island
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-200"
                    }`}
                  >
                    {transport.island}
                  </button>
                ))}
              </div>
            </div>

            {/* Local Transport Info */}
            <div className="px-6 py-4 space-y-4">
              {/* Bus */}
              {currentTransport?.bus && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bus className="w-5 h-5 text-blue-600" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">마을버스</div>
                      <div className="text-xs text-gray-500">배차간격: {currentTransport.bus.interval}</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">노선</div>
                      <div className="space-y-1">
                        {currentTransport.bus.routes.map((route, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-gray-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            {route}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">운행시간</span>
                      <span className="font-semibold text-gray-900">
                        {currentTransport.bus.firstBus} - {currentTransport.bus.lastBus}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Taxi */}
              {currentTransport?.taxi.available && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Car className="w-5 h-5 text-orange-600" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">택시</div>
                      <div className="text-xs text-gray-500">호출 가능</div>
                    </div>
                    {currentTransport.taxi.contact && (
                      <a
                        href={`tel:${currentTransport.taxi.contact}`}
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
                      >
                        전화하기
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Rental */}
              {currentTransport?.rental.available && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Car className="w-5 h-5 text-blue-600" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">렌터카/대여</div>
                      <div className="text-xs text-gray-500">
                        {currentTransport.rental.types.join(", ")}
                      </div>
                    </div>
                    {currentTransport.rental.contact && (
                      <a
                        href={`tel:${currentTransport.rental.contact}`}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
                      >
                        문의
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FerryCard({ schedule, onSetAlarm }: { schedule: FerrySchedule; onSetAlarm: (schedule: FerrySchedule) => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Route */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold text-gray-900 mb-1">{schedule.route}</div>
          <div className="text-xs text-gray-500">{schedule.vessel}</div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          schedule.status === "정상" ? "bg-blue-100 text-blue-700" :
          schedule.status === "지연" ? "bg-orange-100 text-orange-700" :
          "bg-red-100 text-red-700"
        }`}>
          {schedule.status}
        </div>
      </div>

      {/* Time */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">출발</div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <span className="text-lg font-bold text-gray-900">{schedule.departureTime}</span>
          </div>
          <div className="text-xs text-gray-600 mt-1">{schedule.departure}</div>
        </div>

        <div className="flex-shrink-0 px-3 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
          {schedule.duration}
        </div>

        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">도착</div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <span className="text-lg font-bold text-gray-900">{schedule.arrivalTime}</span>
          </div>
          <div className="text-xs text-gray-600 mt-1">{schedule.arrival}</div>
        </div>
      </div>

      {/* Price & Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div>
          <div className="text-xs text-gray-500">편도 요금</div>
          <div className="text-lg font-bold text-blue-600">{schedule.price.toLocaleString()}원</div>
        </div>
        <button
          onClick={() => onSetAlarm(schedule)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium active:scale-95 transition-transform"
        >
          <Bell className="w-4 h-4" strokeWidth={2} />
          알림 설정
        </button>
      </div>
    </div>
  );
}
