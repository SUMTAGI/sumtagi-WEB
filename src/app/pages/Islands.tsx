import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Ship, Clock, Search, X, ChevronDown, ChevronRight, TrendingUp, LayoutGrid, Map as MapIcon } from "lucide-react";
import { CardGridSkeleton } from "../components/SkeletonLoader";
import { IslandImage } from "../components/IslandImage";
import { Link } from "react-router";
import { getIslands, formatFerryPrice, type Island } from "../../lib/api/islands";
import { getAllIslandsCongestion, type IslandCongestionData } from "../../lib/api/congestion";

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type PortFilter = "all" | "인천항" | "대부도" | "삼목선착장";
type CongestionFilter = "all" | "low" | "medium" | "high";
type SortOrder = "default" | "price_asc" | "price_desc";
type ViewMode = "list" | "map";

interface Port {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color: string;
  description: string;
}

interface IslandWithCoords extends Island {
  lat: number;
  lng: number;
}

interface PortMarker extends Port {
  isPort: true;
}

interface IslandMarker extends IslandWithCoords {
  isPort: false;
  color: string;
}

type MarkerItem = PortMarker | IslandMarker;

function isIslandMarker(marker: MarkerItem): marker is IslandMarker {
  return !marker.isPort;
}

// ─── 정적 데이터 (지도 뷰 전용) ────────────────────────────────────────────────

const PORTS: Port[] = [
  { id: "incheon", name: "인천항",   lat: 37.4744, lng: 126.6169, color: "#ef4444", description: "인천 연안여객터미널" },
  { id: "daebu",   name: "대부도항", lat: 37.2173, lng: 126.5589, color: "#f97316", description: "방아머리여객터미널" },
];

const FERRY_ROUTES: [string, string][] = [
  ["incheon", "baengnyeong"], ["incheon", "daecheong"],  ["incheon", "socheong"],
  ["incheon", "yeonpyeong"],  ["incheon", "deokjeok"],   ["incheon", "jawol"],
  ["incheon", "seungbong"],   ["incheon", "daeijak"],
  ["daebu",   "jawol"],       ["daebu",   "seungbong"],  ["daebu",   "daeijak"],
  ["daebu",   "soijak"],      ["daebu",   "deokjeok"],   ["daebu",   "pungdo"],
  ["daebu",   "yukdo"],
  ["deokjeok","jawol"],       ["jawol",   "daeijak"],
  ["incheon", "yeonghung"],   ["incheon", "guleop"],
  ["yeonghung","seonjae"],
];

const CONGESTION_CONFIG = {
  low:    { label: "여유", bg: "bg-green-500",  text: "text-white" },
  medium: { label: "보통", bg: "bg-yellow-400", text: "text-white" },
  high:   { label: "혼잡", bg: "bg-red-500",    text: "text-white" },
} as const;

// ─── 유틸 (지도 뷰 전용) ───────────────────────────────────────────────────────

function makeIcon(color: string, isPort: boolean, isSelected: boolean) {
  const size   = isPort ? 18 : isSelected ? 22 : 16;
  const border = isSelected ? 3 : 2;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:${border}px solid white;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      ${isSelected ? `outline:3px solid ${color}50;outline-offset:1px;` : ""}
    "></div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// 최초 데이터 로드 완료 후 1회만 전체 범위로 fitBounds
function InitialBounds({ markers }: { markers: MarkerItem[] }) {
  const map    = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || markers.length <= PORTS.length) return;
    fitted.current = true;
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [markers, map]);

  return null;
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function Islands() {
  const [islands, setIslands] = useState<Island[]>([]);
  const [congestionMap, setCongestionMap] = useState<Record<string, IslandCongestionData>>({});
  const [portFilter, setPortFilter] = useState<"all" | "인천항" | "대부도" | "삼목선착장">("all");
  const [congestionFilter, setCongestionFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // 지도 뷰 전용 상태
  const [selected, setSelected] = useState<MarkerItem | null>(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    getIslands()
      .then(data => { setIslands(data); return data; })
      .finally(() => setIsLoading(false));
    getAllIslandsCongestion()
      .then(setCongestionMap)
      .catch(() => {});
  }, []);

  const effectiveCongestion = (island: Island) =>
    (congestionMap[island.id]?.todayLevel ?? island.congestion);

  const filteredIslands = islands.filter(island => {
    const portMatch = portFilter === "all" || island.ports.includes(portFilter);
    const congestionMatch = congestionFilter === "all" || effectiveCongestion(island) === congestionFilter;
    const searchMatch = searchQuery === "" ||
      island.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      island.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      island.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return portMatch && congestionMatch && searchMatch;
  });

  const sortedIslands = useMemo(() => {
    const arr = [...filteredIslands];
    // 요금 미확인(null) 섬은 정렬 방향과 무관하게 항상 맨 뒤로
    if (sortOrder === "price_asc") return arr.sort((a, b) => (a.ferry_price ?? Infinity) - (b.ferry_price ?? Infinity));
    if (sortOrder === "price_desc") return arr.sort((a, b) => (b.ferry_price ?? -Infinity) - (a.ferry_price ?? -Infinity));
    return arr;
  }, [filteredIslands, sortOrder]);

  const portCount = (port: string) => islands.filter(i => i.ports.includes(port)).length;
  const congestionCount = (level: "low" | "medium" | "high") =>
    islands.filter(i => effectiveCongestion(i) === level).length;

  // ── 지도 뷰 파생 데이터 ─────────────────────────────────────────────────────
  const mapIslands = useMemo(
    () => sortedIslands.filter((i): i is IslandWithCoords => i.lat != null && i.lng != null),
    [sortedIslands]
  );
  const markers: MarkerItem[] = useMemo(() => [
    ...PORTS.map(p => ({ ...p, isPort: true as const })),
    ...mapIslands.map(i => ({ ...i, isPort: false as const, color: "#3b82f6" })),
  ], [mapIslands]);
  const getMarkerById = (id: string) => markers.find(m => m.id === id);

  const handleSelect = useCallback((marker: MarkerItem) => {
    setSelected(marker);
    if (mapRef.current) {
      const zoom = marker.isPort ? 10 : 11;
      mapRef.current.flyTo([marker.lat, marker.lng], zoom, { duration: 0.8 });
    }
  }, []);

  const routeLines = FERRY_ROUTES.flatMap(([fromId, toId], idx) => {
    const from = getMarkerById(fromId);
    const to   = getMarkerById(toId);
    if (!from || !to) return [];
    const isHighlighted = selected?.id === fromId || selected?.id === toId;
    return [{
      key: idx, from, to,
      options: {
        color:     isHighlighted ? "#2563eb" : "#3b82f6",
        weight:    isHighlighted ? 2.5 : 1.2,
        opacity:   isHighlighted ? 1   : 0.35,
        dashArray: "6, 6",
      },
    }];
  });

  return (
    <div className="bg-white">

      {/* ================================================================
          데스크탑 레이아웃 (lg 이상)
          ================================================================ */}
      <div className="hidden lg:block">
        <div className="max-w-[1440px] mx-auto flex">

          {/* ── 사이드바 필터 ─────────────────────────────────────────── */}
          <aside className="w-[240px] shrink-0 border-r border-gray-200 px-5 py-8 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto">

            {/* 검색 */}
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="섬 이름, 특징 검색..."
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* 출발 항구 */}
            <div className="mb-7">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                출발 항구
              </p>
              <div className="space-y-0.5">
                {(
                  [
                    { value: "all",  label: "전체",  count: islands.length },
                    { value: "인천항", label: "인천항", count: portCount("인천항") },
                    { value: "대부도", label: "대부도", count: portCount("대부도") },
                    { value: "삼목선착장", label: "삼목선착장", count: portCount("삼목선착장") },
                  ] as const
                ).map(({ value, label, count }) => (
                  <button
                    key={value}
                    onClick={() => setPortFilter(value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      portFilter === value
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-xs ${portFilter === value ? "text-blue-400" : "text-gray-400"}`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 혼잡도 */}
            <div className="mb-7">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                혼잡도
              </p>
              <div className="space-y-0.5">
                {(
                  [
                    { value: "all",    label: "전체", count: islands.length,        dot: null },
                    { value: "low",    label: "여유", count: congestionCount("low"),    dot: "bg-green-500" },
                    { value: "medium", label: "보통", count: congestionCount("medium"), dot: "bg-yellow-400" },
                    { value: "high",   label: "혼잡", count: congestionCount("high"),   dot: "bg-red-500" },
                  ] as const
                ).map(({ value, label, count, dot }) => (
                  <button
                    key={value}
                    onClick={() => setCongestionFilter(value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      congestionFilter === value
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
                      {label}
                    </span>
                    <span className={`text-xs ${congestionFilter === value ? "text-blue-400" : "text-gray-400"}`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 여행 가이드 */}
            <div className="pt-6 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                여행 가이드
              </p>
              <ul className="space-y-2.5 text-xs text-gray-500 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">•</span>
                  주말·공휴일은 1주일 전 미리 예약하세요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">•</span>
                  출발 전날 운항 여부를 꼭 확인해주세요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-300 mt-0.5">•</span>
                  자외선 차단제, 편한 신발 챙기는 거 잊지 마세요
                </li>
              </ul>
            </div>
          </aside>

          {/* ── 메인 영역 ─────────────────────────────────────────────── */}
          <main className="flex-1 px-8 py-8 min-w-0">

            {/* 결과 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                인천 앞바다{" "}
                <span className="text-gray-900 font-semibold">{sortedIslands.length}개</span>의 섬
                {(portFilter !== "all" || congestionFilter !== "all" || searchQuery) && (
                  <button
                    onClick={() => { setPortFilter("all"); setCongestionFilter("all"); setSearchQuery(""); }}
                    className="ml-3 text-blue-600 hover:text-blue-700 text-xs font-medium underline underline-offset-2"
                  >
                    필터 초기화
                  </button>
                )}
              </p>
              <div className="flex items-center gap-2">
                {viewMode === "map" && (
                  <button
                    onClick={() => setShowRoutes(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      showRoutes
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-gray-100 text-gray-600 border border-transparent"
                    }`}
                  >
                    <Ship className="w-3.5 h-3.5" strokeWidth={2} />
                    항로
                  </button>
                )}
                {viewMode === "list" && (
                  <div className="relative">
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                      className="appearance-none text-sm text-gray-700 bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                    >
                      <option value="default">기본순</option>
                      <option value="price_asc">요금 낮은순</option>
                      <option value="price_desc">요금 높은순</option>
                    </select>
                    <ChevronDown
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
                      strokeWidth={2}
                    />
                  </div>
                )}
                <ViewToggle viewMode={viewMode} onChange={setViewMode} />
              </div>
            </div>

            {viewMode === "list" ? (
              isLoading ? (
                <CardGridSkeleton count={6} />
              ) : sortedIslands.length === 0 ? (
                <div className="text-center py-28">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-200" strokeWidth={1.5} />
                  <p className="text-lg font-medium text-gray-500 mb-1">검색 결과가 없어요</p>
                  <p className="text-sm text-gray-400">다른 필터나 검색어를 시도해보세요</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {sortedIslands.map((island) => (
                    <IslandCardDesktop
                      key={island.id}
                      island={island}
                      congestionLevel={effectiveCongestion(island)}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200" style={{ height: "calc(100vh - 220px)" }}>
                <IslandMap
                  markers={markers}
                  routeLines={routeLines}
                  showRoutes={showRoutes}
                  selected={selected}
                  onSelect={handleSelect}
                  mapRef={mapRef}
                />
                {selected && (
                  <div className="absolute bottom-4 left-4 z-[1001] w-[320px]">
                    <MarkerDetailCard marker={selected} onClose={() => setSelected(null)} />
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ================================================================
          모바일 레이아웃 (lg 미만) — 기존 코드 완전 보존 + 지도 뷰 추가
          ================================================================ */}
      <div className="lg:hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-500 text-white">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold">섬 둘러보기</h1>
            <ViewToggle viewMode={viewMode} onChange={setViewMode} compact />
          </div>
          <p className="text-sm text-blue-100">인천의 아름다운 섬들을 탐색해보세요</p>
        </div>

        <div className="px-6 py-3 bg-white border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={2} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="섬 이름, 특징으로 검색..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="bg-white px-6 py-4 border-b border-gray-200 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">출발 항구</p>
            <div className="grid grid-cols-4 gap-2">
              <FilterButton active={portFilter === "all"}    onClick={() => setPortFilter("all")}    label="전체"  count={islands.length} />
              <FilterButton active={portFilter === "인천항"} onClick={() => setPortFilter("인천항")} label="인천항" color="red"    count={portCount("인천항")} />
              <FilterButton active={portFilter === "대부도"} onClick={() => setPortFilter("대부도")} label="대부도" color="orange" count={portCount("대부도")} />
              <FilterButton active={portFilter === "삼목선착장"} onClick={() => setPortFilter("삼목선착장")} label="삼목항" color="blue" count={portCount("삼목선착장")} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">혼잡도</p>
            <div className="grid grid-cols-4 gap-2">
              <FilterButton active={congestionFilter === "all"}    onClick={() => setCongestionFilter("all")}    label="전체" count={islands.length} />
              <FilterButton active={congestionFilter === "low"}    onClick={() => setCongestionFilter("low")}    label="여유" color="green"  count={congestionCount("low")} />
              <FilterButton active={congestionFilter === "medium"} onClick={() => setCongestionFilter("medium")} label="보통" color="yellow" count={congestionCount("medium")} />
              <FilterButton active={congestionFilter === "high"}   onClick={() => setCongestionFilter("high")}   label="혼잡" color="red"    count={congestionCount("high")} />
            </div>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="px-6 py-4">
            {isLoading ? (
              <CardGridSkeleton count={5} />
            ) : (
              <div className="space-y-4">
                {filteredIslands.map((island, index) => (
                  <div key={island.id} className="animate-stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
                    <IslandCardMobile island={island} congestionLevel={effectiveCongestion(island)} />
                  </div>
                ))}
                {filteredIslands.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p>검색 결과가 없어요</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 mb-6 bg-blue-100 rounded-xl p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">💡 여행 가이드</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• 주말/공휴일은 1주일 전에 미리 예약하세요</li>
                <li>• 출발 전날 운항 여부를 꼭 확인해주세요</li>
                <li>• 자외선 차단제, 편한 신발 챙기는 거 잊지 마세요</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="px-6 py-4">
            <div className="flex items-center justify-end mb-3">
              <button
                onClick={() => setShowRoutes(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  showRoutes
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-600 border border-transparent"
                }`}
              >
                <Ship className="w-3.5 h-3.5" strokeWidth={2} />
                항로 {showRoutes ? "숨기기" : "보기"}
              </button>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-gray-200" style={{ height: "min(60vh, 480px)" }}>
              <IslandMap
                markers={markers}
                routeLines={routeLines}
                showRoutes={showRoutes}
                selected={selected}
                onSelect={handleSelect}
                mapRef={mapRef}
              />
            </div>
            {selected && (
              <div className="mt-4">
                <MarkerDetailCard marker={selected} onClose={() => setSelected(null)} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 리스트/지도 토글 ─────────────────────────────────────────────────────────

function ViewToggle({
  viewMode, onChange, compact,
}: {
  viewMode: ViewMode; onChange: (v: ViewMode) => void; compact?: boolean;
}) {
  const base = compact
    ? "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
    : "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all";
  return (
    <div className={`inline-flex ${compact ? "bg-white/15" : "bg-gray-100"} rounded-lg p-0.5`}>
      <button
        onClick={() => onChange("list")}
        className={`${base} ${
          viewMode === "list"
            ? (compact ? "bg-white/25 text-white" : "bg-white text-gray-900 shadow-sm")
            : (compact ? "text-blue-100" : "text-gray-500")
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" strokeWidth={2} />
        리스트
      </button>
      <button
        onClick={() => onChange("map")}
        className={`${base} ${
          viewMode === "map"
            ? (compact ? "bg-white/25 text-white" : "bg-white text-gray-900 shadow-sm")
            : (compact ? "text-blue-100" : "text-gray-500")
        }`}
      >
        <MapIcon className="w-3.5 h-3.5" strokeWidth={2} />
        지도
      </button>
    </div>
  );
}

// ─── 지도 뷰 ──────────────────────────────────────────────────────────────────

function IslandMap({
  markers, routeLines, showRoutes, selected, onSelect, mapRef,
}: {
  markers: MarkerItem[];
  routeLines: { key: number; from: MarkerItem; to: MarkerItem; options: L.PolylineOptions }[];
  showRoutes: boolean;
  selected: MarkerItem | null;
  onSelect: (marker: MarkerItem) => void;
  mapRef: React.MutableRefObject<L.Map | null>;
}) {
  return (
    <>
      <MapContainer
        center={[37.5, 125.8]}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <InitialBounds markers={markers} />

        {showRoutes && routeLines.map(({ key, from, to, options }) => (
          <Polyline
            key={key}
            positions={[[from.lat, from.lng], [to.lat, to.lng]]}
            pathOptions={options}
          />
        ))}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={makeIcon(marker.color, marker.isPort, selected?.id === marker.id)}
            eventHandlers={{ click: () => onSelect(marker) }}
          />
        ))}
      </MapContainer>

      {/* 범례 */}
      <div className="absolute top-4 right-4 z-[1001] bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">범례</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500 shrink-0 border-2 border-white shadow-sm" />
            인천항
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <div className="w-3.5 h-3.5 rounded-full bg-orange-500 shrink-0 border-2 border-white shadow-sm" />
            대부도항
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shrink-0 border-2 border-white shadow-sm" />
            섬
          </div>
        </div>
      </div>
    </>
  );
}

function MarkerDetailCard({ marker, onClose }: { marker: MarkerItem; onClose: () => void }) {
  const badge = isIslandMarker(marker) ? CONGESTION_CONFIG[marker.congestion] : null;
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {isIslandMarker(marker) && (
        <div className="relative h-28">
          <IslandImage src={marker.image} alt={marker.name} className="w-full h-full object-cover" />
          {badge && (
            <span className={`absolute top-2.5 left-2.5 text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
          )}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1.5">
          <p className="text-base font-bold text-gray-900">{marker.name}</p>
          {marker.isPort && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 -m-1">
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-3">{marker.description}</p>

        {isIslandMarker(marker) && (
          <>
            <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Ship className="w-3.5 h-3.5 text-gray-400" strokeWidth={2} />
                {marker.ferry_time || "정보 없음"}
              </span>
              <span className="font-semibold text-gray-900">{formatFerryPrice(marker.ferry_price)}</span>
            </div>
            {marker.features.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {marker.features.slice(0, 4).map(tag => (
                  <span key={tag} className="text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <Link
              to={`/island/${marker.id}`}
              className="flex items-center justify-between w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              섬 상세 보기
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// ─── 데스크탑 카드 ────────────────────────────────────────────────────────────

function IslandCardDesktop({
  island,
  congestionLevel,
}: {
  island: Island;
  congestionLevel: "low" | "medium" | "high";
}) {
  const badge = CONGESTION_CONFIG[congestionLevel];

  return (
    <Link to={`/island/${island.id}`} className="group block">
      {/* 이미지 */}
      <div className="aspect-[4/3] rounded-xl overflow-hidden relative mb-3">
        <IslandImage
          src={island.image}
          alt={island.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span
          className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.bg} ${badge.text}`}
        >
          {badge.label}
        </span>
        {island.popularity_trend === "up" && (
          <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
            인기 급상승
          </span>
        )}
      </div>

      {/* 텍스트 정보 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {island.name}
          </h3>
          <span className="text-sm font-semibold text-gray-900 shrink-0 ml-2">
            {island.ferry_price === null ? "요금 확인 필요" : island.ferry_price > 0 ? `${island.ferry_price.toLocaleString()}원~` : "육로 연결"}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-2 line-clamp-1">{island.description}</p>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2.5">
          <span className="flex items-center gap-1">
            <Ship className="w-3.5 h-3.5" strokeWidth={2} />
            {island.ferry_time}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" strokeWidth={2} />
            {island.best_season}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {island.features.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-xs text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ─── 모바일 카드 (기존 코드 그대로) ─────────────────────────────────────────

function FilterButton({
  active, onClick, label, color = "blue", count
}: {
  active: boolean; onClick: () => void; label: string; color?: "blue" | "green" | "yellow" | "red" | "orange"; count: number;
}) {
  const colors = {
    blue:   active ? "bg-blue-500 text-white"   : "bg-gray-100 text-gray-700",
    green:  active ? "bg-green-500 text-white"  : "bg-gray-100 text-gray-700",
    yellow: active ? "bg-yellow-500 text-white" : "bg-gray-100 text-gray-700",
    red:    active ? "bg-blue-600 text-white"   : "bg-gray-100 text-gray-700",
    orange: active ? "bg-blue-300 text-white"   : "bg-gray-100 text-gray-700",
  };

  return (
    <button
      onClick={onClick}
      className={`px-2 py-2 rounded-lg font-medium transition-all text-sm ${colors[color]} ${!active && "active:scale-95"}`}
    >
      {label} ({count})
    </button>
  );
}

function IslandCardMobile({ island, congestionLevel }: { island: Island; congestionLevel: "low" | "medium" | "high" }) {
  const getCongestionBadge = () => {
    const config = {
      low:    { label: "여유", color: "bg-green-500 text-white" },
      medium: { label: "보통", color: "bg-yellow-500 text-white" },
      high:   { label: "혼잡", color: "bg-red-500 text-white" },
    };
    const { label, color } = config[congestionLevel];
    return <span className={`text-xs px-2 py-1 rounded font-medium ${color}`}>{label}</span>;
  };

  return (
    <Link to={`/island/${island.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden active:scale-98 transition-transform">
      <div className="relative h-60">
        <IslandImage src={island.image} alt={island.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white mb-1">{island.name}</h3>
          {getCongestionBadge()}
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-gray-600 mb-2">{island.description}</p>
        <div className="space-y-0.5 mb-2">
          {island.features.slice(0, 2).map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-gray-700">
              <div className="w-1 h-1 rounded-full bg-blue-500" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <Ship className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <span className="text-gray-900 font-medium">{island.ferry_time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <span className="text-gray-900 font-medium">{island.best_season}</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-gray-600">여객선 요금</span>
            <span className="font-bold text-blue-500">
              {formatFerryPrice(island.ferry_price)}
            </span>
          </div>
          <div className="flex gap-1">
            {island.ports.map((port) => (
              <span key={port} className={`text-xs px-2 py-0.5 rounded ${port === "인천항" ? "bg-blue-600 text-white" : "bg-blue-300 text-white"}`}>
                {port}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
