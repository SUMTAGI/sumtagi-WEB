import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Ship, ChevronRight, Search, X } from "lucide-react";
import { Link } from "react-router";
import { getIslands } from "../../lib/api/islands";

// ─── 타입 ─────────────────────────────────────────────────────────────────────

interface MapIsland {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color: string;
  ferryTime: string;
  description: string;
  isPort?: boolean;
}

// ─── 정적 데이터 ──────────────────────────────────────────────────────────────

const PORTS: MapIsland[] = [
  { id: "incheon", name: "인천항",   lat: 37.4744, lng: 126.6169, color: "#ef4444", ferryTime: "-", description: "인천 연안여객터미널", isPort: true },
  { id: "daebu",   name: "대부도항", lat: 37.2173, lng: 126.5589, color: "#f97316", ferryTime: "-", description: "방아머리여객터미널",  isPort: true },
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

// ─── 유틸 ─────────────────────────────────────────────────────────────────────

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

// Supabase 섬 데이터 로드 완료 후 1회만 전체 범위로 fitBounds
function InitialBounds({ islands }: { islands: MapIsland[] }) {
  const map    = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    // PORTS 2개만 있을 때는 아직 로딩 중이므로 스킵
    if (fitted.current || islands.length <= 2) return;
    fitted.current = true;
    const bounds = L.latLngBounds(islands.map(i => [i.lat, i.lng]));
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [islands, map]);

  return null;
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function MapPage() {
  const [islands,        setIslands]        = useState<MapIsland[]>(PORTS);
  const [selectedIsland, setSelectedIsland] = useState<MapIsland | null>(null);
  const [showRoutes,     setShowRoutes]     = useState(true);
  const [search,         setSearch]         = useState("");
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    getIslands().then(data => {
      const mapIslands: MapIsland[] = data
        .filter(i => i.lat != null && i.lng != null)
        .map(i => ({
          id:          i.id,
          name:        i.name,
          lat:         i.lat!,
          lng:         i.lng!,
          color:       "#3b82f6",
          ferryTime:   i.ferry_time  ?? "",
          description: i.description ?? "",
          isPort:      false,
        }));
      setIslands([...PORTS, ...mapIslands]);
    });
  }, []);

  // 섬 선택 + 지도 flyTo 통합 핸들러
  const handleSelect = useCallback((island: MapIsland) => {
    setSelectedIsland(island);
    if (mapRef.current) {
      const zoom = island.isPort ? 10 : 11;
      mapRef.current.flyTo([island.lat, island.lng], zoom, { duration: 0.8 });
    }
  }, []);

  const getIslandById = (id: string) => islands.find(i => i.id === id);

  const filteredList = islands.filter(i => !i.isPort && i.name.includes(search));

  const routeLines = FERRY_ROUTES.flatMap(([fromId, toId], idx) => {
    const from = getIslandById(fromId);
    const to   = getIslandById(toId);
    if (!from || !to) return [];
    const isHighlighted = selectedIsland?.id === fromId || selectedIsland?.id === toId;
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
    // 모바일: main 전체 높이(100dvh - 64px 바텀 네비) 사용
    // 데스크탑: 헤더 72px 차감
    <div className="flex bg-white h-full lg:h-[calc(100dvh-72px)]">

      {/* ══════════════════════════════════════════════════════════════
          데스크탑 전용 사이드바 (320px 고정, lg 이상에서만 표시)
          ══════════════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-[320px] shrink-0 bg-white border-r border-gray-100 overflow-hidden">

        {/* 제목 */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 mb-0.5">섬 지도</h1>
          <p className="text-sm text-gray-500">인천 섬들의 위치와 여객선 항로</p>
        </div>

        {/* 검색 + 항로 토글 */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
            <input
              type="text"
              placeholder="섬 이름 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-gray-400" strokeWidth={2} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowRoutes(v => !v)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              showRoutes
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-gray-100 text-gray-600 border border-transparent"
            }`}
          >
            <Ship className="w-3.5 h-3.5" strokeWidth={2} />
            항로
          </button>
        </div>

        {/* 여객터미널 목록 */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">여객터미널</p>
          <div className="space-y-1">
            {PORTS.map((port) => (
              <button
                key={port.id}
                onClick={() => handleSelect(port)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 ${
                  selectedIsland?.id === port.id
                    ? "bg-gray-50 border border-gray-200"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: port.color }} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{port.name}</p>
                  <p className="text-xs text-gray-400">{port.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 섬 목록 (스크롤) */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 pt-2">
            섬 {filteredList.length > 0 && `(${filteredList.length})`}
          </p>
          {filteredList.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">검색 결과가 없습니다</p>
          ) : (
            <div className="space-y-1">
              {filteredList.map((island) => (
                <button
                  key={island.id}
                  onClick={() => handleSelect(island)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between ${
                    selectedIsland?.id === island.id
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-blue-500" />
                    <span className="text-sm font-medium text-gray-900 truncate">{island.name}</span>
                  </div>
                  {island.ferryTime && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 ml-2">
                      <Ship className="w-3 h-3" strokeWidth={2} />
                      {island.ferryTime}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 선택된 섬/항구 상세 패널 */}
        {selectedIsland && (
          <div className="border-t border-gray-100 p-5 bg-gray-50 shrink-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: selectedIsland.color + "18" }}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedIsland.color }} />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">{selectedIsland.name}</p>
                  <p className="text-xs text-gray-500">{selectedIsland.description}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIsland(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            {!selectedIsland.isPort && (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-4 px-1">
                  <Ship className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={2} />
                  <span>
                    인천항 기준 소요 시간:{" "}
                    <strong>{selectedIsland.ferryTime || "정보 없음"}</strong>
                  </span>
                </div>
                <Link
                  to={`/island/${selectedIsland.id}`}
                  className="flex items-center justify-between w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  섬 상세 보기
                  <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                </Link>
              </>
            )}
          </div>
        )}
      </aside>

      {/* ══════════════════════════════════════════════════════════════
          지도 영역 — 데스크탑·모바일 공통 (MapContainer 1개)
          ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 relative overflow-hidden">

        {/* 모바일 전용 상단 헤더 오버레이 */}
        <div className="lg:hidden absolute top-0 left-0 right-0 z-[1001] pointer-events-none">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 pt-4 pb-3 pointer-events-auto">
            <h1 className="text-[17px] font-bold mb-0.5">섬 지도</h1>
            <p className="text-xs text-blue-100 mb-2.5">인천 섬들의 위치와 여객선 항로</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRoutes(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  showRoutes ? "bg-white/25 text-white" : "bg-white/10 text-blue-100"
                }`}
              >
                <Ship className="w-3.5 h-3.5" strokeWidth={2} />
                항로 {showRoutes ? "숨기기" : "보기"}
              </button>
              <button
                onClick={() => setSelectedIsland(null)}
                className="flex items-center px-3 py-1.5 rounded-lg bg-white/10 text-blue-100 text-xs font-medium"
              >
                전체보기
              </button>
            </div>
          </div>
        </div>

        {/* ── Leaflet 지도 ────────────────────────────────────────────── */}
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

          {/* 섬 데이터 로드 후 1회만 전체 범위 fitBounds */}
          <InitialBounds islands={islands} />

          {/* 항로 점선 */}
          {showRoutes && routeLines.map(({ key, from, to, options }) => (
            <Polyline
              key={key}
              positions={[[from.lat, from.lng], [to.lat, to.lng]]}
              pathOptions={options}
            />
          ))}

          {/* 마커 — Popup 없음, 클릭 시 handleSelect로 sidebarPanel + flyTo */}
          {islands.map((island) => (
            <Marker
              key={island.id}
              position={[island.lat, island.lng]}
              icon={makeIcon(island.color, !!island.isPort, selectedIsland?.id === island.id)}
              eventHandlers={{ click: () => handleSelect(island) }}
            />
          ))}
        </MapContainer>

        {/* 범례 — 우측 하단, z-index를 Leaflet 컨트롤(1000)보다 높게 */}
        <div className="absolute bottom-4 right-4 z-[1001] bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-sm border border-gray-100">
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

        {/* ── 모바일 전용 하단 패널 ───────────────────────────────────── */}

        {/* 선택된 섬 정보 */}
        {selectedIsland && (
          <div className="lg:hidden absolute bottom-0 left-0 right-0 z-[1001] bg-white border-t border-gray-200 px-5 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                selectedIsland.id === "incheon" ? "bg-red-50" :
                selectedIsland.id === "daebu"   ? "bg-orange-50" : "bg-blue-50"
              }`}>
                <div className={`w-5 h-5 rounded-full ${
                  selectedIsland.id === "incheon" ? "bg-red-500" :
                  selectedIsland.id === "daebu"   ? "bg-orange-500" : "bg-blue-500"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-gray-900">{selectedIsland.name}</p>
                <p className="text-xs text-gray-500 truncate">{selectedIsland.description}</p>
                {!selectedIsland.isPort && selectedIsland.ferryTime && (
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-600">
                    <Ship className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                    <span>{selectedIsland.ferryTime}</span>
                  </div>
                )}
              </div>
              {!selectedIsland.isPort && (
                <Link
                  to={`/island/${selectedIsland.id}`}
                  className="shrink-0 flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
                >
                  상세
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                </Link>
              )}
              <button
                onClick={() => setSelectedIsland(null)}
                className="shrink-0 text-gray-400 hover:text-gray-600 p-1 ml-1"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* 선택된 섬 없을 때 — 하단 섬 목록 그리드 */}
        {!selectedIsland && (
          <div className="lg:hidden absolute bottom-0 left-0 right-0 z-[1001] bg-gray-50 border-t border-gray-200 px-5 py-3 max-h-44 overflow-y-auto shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">섬 목록</p>
            <div className="grid grid-cols-2 gap-2 pb-1">
              {islands.filter(i => !i.isPort).map((island) => (
                <button
                  key={island.id}
                  onClick={() => handleSelect(island)}
                  className="bg-white px-3 py-2 rounded-xl border border-gray-200 text-left active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate">{island.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" strokeWidth={2} />
                  </div>
                  {island.ferryTime && (
                    <div className="flex items-center gap-1 mt-1">
                      <Ship className="w-3 h-3 text-gray-400 shrink-0" strokeWidth={2} />
                      <span className="text-xs text-gray-500">{island.ferryTime}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
