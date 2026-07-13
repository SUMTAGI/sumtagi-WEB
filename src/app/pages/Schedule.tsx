import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Ship, Clock, MapPin, Bell, Bus, Car, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getFerryScheduleForIsland, getFerryScheduleForAllIslands, getStaticFerrySchedules, type FerrySchedule as LiveFerrySchedule, type StaticFerrySchedule } from "../../lib/api/ferry";
import { getIslands, type Island } from "../../lib/api/islands";

interface FerrySchedule {
  id: string;
  route: string;
  departure: string;
  arrival: string;
  departureTime: string;
  duration: string;
  price: number;
  vessel: string;
  status: string;
}

function toFerrySchedule(live: LiveFerrySchedule, island: Island | undefined, idx: number): FerrySchedule {
  const port = island?.ports?.[0] ?? "인천항";
  return {
    id: `${live.ferryName}_${live.departureTime}_${idx}`,
    route: live.routeName || `${port} ↔ ${island?.name ?? ""}`,
    departure: port,
    arrival: island?.name ?? "",
    departureTime: live.departureTime,
    duration: island?.ferry_time ?? "",
    price: island?.ferry_price ?? 0,
    vessel: live.ferryName,
    status: live.status,
  };
}

// 실시간 API 실패 시에만 쓰는 정기 시간표 폴백 — status를 "정기 시간표"로 고정해 실시간 상태와 구분
function toStaticFerrySchedule(row: StaticFerrySchedule, island: Island | undefined, idx: number): FerrySchedule {
  return {
    id: `static_${row.islandId}_${row.departureTime}_${idx}`,
    route: `${row.departurePort} ↔ ${island?.name ?? ""}`,
    departure: row.departurePort,
    arrival: island?.name ?? "",
    departureTime: row.departureTime,
    duration: island?.ferry_time ?? "",
    price: island?.ferry_price ?? 0,
    vessel: row.ferryName ?? "",
    status: "정기 시간표",
  };
}

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

interface FerryGroup {
  islandName: string;
  schedules: FerrySchedule[];
}

const ALL_FERRY_FILTER = "all";

export function Schedule() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"ferry" | "local">("ferry");
  const [islands, setIslands] = useState<Island[]>([]);
  const [selectedFerryIsland, setSelectedFerryIsland] = useState<string>(ALL_FERRY_FILTER);
  const [ferryGroups, setFerryGroups] = useState<FerryGroup[]>([]);
  const [isFerryLoading, setIsFerryLoading] = useState(true);
  const [ferryError, setFerryError] = useState(false);
  const [usingStaticFallback, setUsingStaticFallback] = useState(false);
  const [selectedIsland, setSelectedIsland] = useState<string>("백령도");

  useEffect(() => {
    getIslands().then(setIslands).catch(() => toast.error("섬 정보를 불러오지 못했어요"));
  }, []);

  // 실시간 API가 실패하면 정기 시간표(ferry_schedules 테이블)로 폴백 — 일부 섬은 정기 시간표도
  // 없을 수 있어(신규 확장 섬), 그 경우엔 빈 목록 + 에러 안내만 표시됨.
  const loadStaticFallback = async (islandFilter: string) => {
    const rows = await getStaticFerrySchedules(islandFilter === ALL_FERRY_FILTER ? undefined : islandFilter);
    const byIsland = new Map<string, StaticFerrySchedule[]>();
    for (const row of rows) {
      if (!byIsland.has(row.islandId)) byIsland.set(row.islandId, []);
      byIsland.get(row.islandId)!.push(row);
    }
    const groups: FerryGroup[] = Array.from(byIsland.entries()).map(([islandId, rows]) => {
      const island = islands.find(i => i.id === islandId);
      return {
        islandName: island?.name ?? islandId,
        schedules: rows.map((r, idx) => toStaticFerrySchedule(r, island, idx)),
      };
    });
    setFerryGroups(groups);
    setUsingStaticFallback(true);
  };

  useEffect(() => {
    if (islands.length === 0) return;
    setIsFerryLoading(true);
    setFerryError(false);
    setUsingStaticFallback(false);

    if (selectedFerryIsland === ALL_FERRY_FILTER) {
      getFerryScheduleForAllIslands()
        .then(groups => {
          setFerryGroups(groups.map(group => {
            const island = islands.find(i => i.id === group.islandId);
            return {
              islandName: group.islandName,
              schedules: group.schedules.map((l, idx) => toFerrySchedule(l, island, idx)),
            };
          }));
        })
        .catch(() => {
          setFerryError(true);
          toast.error("실시간 운항 정보가 지연되고 있어요 · 정기 시간표를 보여드릴게요");
          loadStaticFallback(ALL_FERRY_FILTER);
        })
        .finally(() => setIsFerryLoading(false));
      return;
    }

    getFerryScheduleForIsland(selectedFerryIsland)
      .then(live => {
        const island = islands.find(i => i.id === selectedFerryIsland);
        setFerryGroups([{
          islandName: island?.name ?? "",
          schedules: live.map((l, idx) => toFerrySchedule(l, island, idx)),
        }]);
      })
      .catch(() => {
        setFerryError(true);
        toast.error("실시간 운항 정보가 지연되고 있어요 · 정기 시간표를 보여드릴게요");
        loadStaticFallback(selectedFerryIsland);
      })
      .finally(() => setIsFerryLoading(false));
  }, [selectedFerryIsland, islands]);

  const setAlarm = (schedule: FerrySchedule) => {
    toast.success(`${schedule.departureTime} 출항 1시간 전에 알림을 드릴게요`);
  };

  const currentTransport = LOCAL_TRANSPORT.find(t => t.island === selectedIsland);

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-3 text-blue-100 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          <span className="text-sm">뒤로</span>
        </button>
        <h1 className="text-xl font-bold mb-1">교통 시간표</h1>
        <p className="text-sm text-blue-100">오늘의 실시간 여객선 운항 정보 및 섬 내부 교통 안내</p>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex gap-2">
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
      <div className="">
        {activeTab === "ferry" ? (
          <>
            {/* Island Filter */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">섬 선택</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedFerryIsland(ALL_FERRY_FILTER)}
                  className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    selectedFerryIsland === ALL_FERRY_FILTER
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-200"
                  }`}
                >
                  전체
                </button>
                {islands.map(island => (
                  <button
                    key={island.id}
                    onClick={() => setSelectedFerryIsland(island.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                      selectedFerryIsland === island.id
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-200"
                    }`}
                  >
                    {island.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Ferry Schedules */}
            <div className="px-6 py-4 space-y-4">
              {isFerryLoading ? (
                <div className="text-center py-12 text-gray-400 text-sm">오늘 운항 정보를 불러오는 중...</div>
              ) : ferryError && ferryGroups.length === 0 ? (
                <div className="text-center py-12">
                  <Ship className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
                  <p className="text-gray-500 mb-2">실시간 정보가 지연되고 있고, 정기 시간표도 아직 준비되지 않은 섬이에요</p>
                  <p className="text-sm text-gray-400">잠시 후 다시 시도하거나 다른 섬을 선택해주세요</p>
                </div>
              ) : ferryGroups.length === 0 ? (
                <div className="text-center py-12">
                  <Ship className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
                  <p className="text-gray-500 mb-2">오늘 예정된 운항이 없어요</p>
                  <p className="text-sm text-gray-400">다른 섬을 선택해보세요</p>
                </div>
              ) : (
                <>
                {usingStaticFallback && (
                  <div className="flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2.5 text-sm text-orange-800">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
                    <span>실시간 운항 정보가 지연되고 있어 정기 시간표를 보여드리고 있어요. 출항 전 실제 운항 여부는 선사에 확인해주세요.</span>
                  </div>
                )}
                {ferryGroups.map(group => (
                  <div key={group.islandName}>
                    {selectedFerryIsland === ALL_FERRY_FILTER && (
                      <div className="px-1 pb-1.5 text-xs font-semibold text-gray-500">{group.islandName}</div>
                    )}
                    <div className="space-y-2">
                      {group.schedules.map(schedule => (
                        <FerryCard key={schedule.id} schedule={schedule} onSetAlarm={setAlarm} />
                      ))}
                    </div>
                  </div>
                ))}
                </>
              )}
            </div>

            {/* Notice */}
            <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" strokeWidth={2} />
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

function statusColor(status: string): string {
  if (status.includes("결항")) return "bg-red-100 text-red-700";
  if (status.includes("지연")) return "bg-orange-100 text-orange-700";
  return "bg-blue-100 text-blue-700";
}

function FerryCard({ schedule, onSetAlarm }: { schedule: FerrySchedule; onSetAlarm: (schedule: FerrySchedule) => void }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-3 py-2">
      <div className="flex flex-col items-start shrink-0 w-14">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-400" strokeWidth={2} />
          <span className="text-sm font-bold text-gray-900">{schedule.departureTime}</span>
        </div>
        <span className="text-[11px] text-gray-500 truncate max-w-14">{schedule.vessel}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-sm font-medium text-gray-900 truncate">
          <MapPin className="w-3 h-3 text-gray-400 shrink-0" strokeWidth={2} />
          <span className="truncate">{schedule.route}</span>
        </div>
        <div className="text-[11px] text-gray-500 truncate">
          {schedule.duration && `소요 ${schedule.duration} · `}
          {schedule.price > 0 ? `${schedule.price.toLocaleString()}원` : "요금 정보 없음"}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${statusColor(schedule.status)}`}>
          {schedule.status}
        </span>
        <button
          onClick={() => onSetAlarm(schedule)}
          className="p-1.5 bg-gray-100 text-gray-600 rounded-lg active:scale-95 transition-transform"
          aria-label="알림 설정"
        >
          <Bell className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
