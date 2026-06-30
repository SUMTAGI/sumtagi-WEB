import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
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
  const size   = isPort ? 14 : isSelected ? 12 : 10;
  const border = isSelected ? 3 : 2;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:${border}px solid white;
      border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
      ${isSelected ? "outline:2px solid " + color + "80;" : ""}
    "></div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ islands }: { islands: MapIsland[] }) {
  const map = useMap();
  const bounds = L.latLngBounds(islands.map(i => [i.lat, i.lng]));
  map.fitBounds(bounds, { padding: [40, 40] });
  return null;
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export function MapPage() {
  const [islands,         setIslands]         = useState<MapIsland[]>(PORTS);
  const [selectedIsland,  setSelectedIsland]  = useState<MapIsland | null>(null);
  const [showRoutes,      setShowRoutes]      = useState(true);
  const [search,          setSearch]          = useState("");

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
          ferryTime:   i.ferry_time   ?? "",
          description: i.description  ?? "",
          isPort:      false,
        }));
      setIslands([...PORTS, ...mapIslands]);
    });
  }, []);

  const getIsland = (id: string) => islands.find(i => i.id === id);

  const filteredList = islands.filter(i =>
    !i.isPort && i.name.includes(search)
  );

  const routeLines = FERRY_ROUTES.flatMap(([fromId, toId], idx) => {
    const from = getIsland(fromId);
    const to   = getIsland(toId);
    if (!from || !to) return [];
    const isHighlighted = selectedIsland?.id === fromId || selectedIsland?.id === toId;
    return [{
      key: idx, from, to, isHighlighted,
      options: {
        color:     isHighlighted ? "#2563eb" : "#3b82f6",
        weight:    isHighlighted ? 2.5 : 1.2,
        opacity:   isHighlighted ? 1   : 0.4,
        dashArray: "6, 6",
      },
    }];
  });

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════════════════════════════════
          데스크탑 레이아웃 (Booking.com 스타일: 좌 패널 + 우 지도)
          ══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex" style={{ height: "calc(100vh - 72px)" }}>

        {/* ── 좌 사이드바 ───────────────────────────────────────────── */}
        <aside className="w-[320px] shrink-0 flex flex-col bg-white border-r border-gray-100 overflow-hidden">

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
              onClick={() => setShowRoutes(!showRoutes)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                showRoutes ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-gray-100 text-gray-600 border border-transparent"
              }`}
            >
              <Ship className="w-3.5 h-3.5" strokeWidth={2} />
              항로
            </button>
          </div>

          {/* 항구 목록 */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">여객터미널</p>
            <div className="space-y-1">
              {PORTS.map((port) => (
                <button
                  key={port.id}
                  onClick={() => setSelectedIsland(port)}
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

          {/* 섬 목록 */}
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
                    onClick={() => setSelectedIsland(island)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group ${
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

          {/* 선택된 섬 정보 패널 */}
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
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>

              {!selectedIsland.isPort && (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-4 px-1">
                    <Ship className="w-4 h-4 text-gray-400 shrink-0" strokeWidth={2} />
                    <span>인천항 기준 소요 시간: <strong>{selectedIsland.ferryTime}</strong></span>
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

        {/* ── 우: 지도 ─────────────────────────────────────────────── */}
        <div className="flex-1 relative">
          <MapContainer
            center={[37.5, 125.8]}
            zoom={8}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {islands.length > 0 && <FitBounds islands={islands} />}

            {showRoutes && routeLines.map(({ key, from, to, options }) => (
              <Polyline
                key={key}
                positions={[[from.lat, from.lng], [to.lat, to.lng]]}
                pathOptions={options}
              />
            ))}

            {islands.map((island) => (
              <Marker
                key={island.id}
                position={[island.lat, island.lng]}
                icon={makeIcon(island.color, !!island.isPort, selectedIsland?.id === island.id)}
                eventHandlers={{ click: () => setSelectedIsland(island) }}
              >
                <Popup>
                  <div className="text-sm min-w-[120px]">
                    <p className="font-semibold text-gray-900">{island.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{island.description}</p>
                    {!island.isPort && island.ferryTime && (
                      <p className="text-blue-600 text-xs mt-1.5 flex items-center gap-1">
                        <Ship className="w-3 h-3" strokeWidth={2} />
                        {island.ferryTime}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* 범례 */}
          <div className="absolute top-4 right-4 z-[1000] bg-white/92 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">범례</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />인천항
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />대부도항
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />섬
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── 데스크탑 레이아웃 끝 ──────────────────────────────────────── */}


      {/* ══════════════════════════════════════════════════════════════
          모바일 레이아웃 (lg 미만) — 기존 코드 완전 보존
          ══════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden h-full flex flex-col bg-white">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-shrink-0">
          <h1 className="text-xl font-bold mb-1">섬 지도</h1>
          <p className="text-sm text-blue-100">인천 섬들의 위치와 여객선 항로</p>
        </div>

        <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              showRoutes ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            <Ship className="w-4 h-4" strokeWidth={2} />
            항로 {showRoutes ? "숨기기" : "보기"}
          </button>
          <button
            onClick={() => setSelectedIsland(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium"
          >
            전체보기
          </button>
        </div>

        <div className="flex-1 relative" style={{ minHeight: 300 }}>
          <MapContainer
            center={[37.5, 125.8]}
            zoom={8}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {islands.length > 0 && <FitBounds islands={islands} />}

            {showRoutes && routeLines.map(({ key, from, to, options }) => (
              <Polyline
                key={key}
                positions={[[from.lat, from.lng], [to.lat, to.lng]]}
                pathOptions={options}
              />
            ))}

            {islands.map((island) => (
              <Marker
                key={island.id}
                position={[island.lat, island.lng]}
                icon={makeIcon(island.color, !!island.isPort, selectedIsland?.id === island.id)}
                eventHandlers={{ click: () => setSelectedIsland(island) }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{island.name}</p>
                    <p className="text-gray-500 text-xs">{island.description}</p>
                    {!island.isPort && (
                      <p className="text-blue-600 text-xs mt-1">
                        <Ship className="inline w-3 h-3 mr-1" />
                        {island.ferryTime}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-gray-700">인천항</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" /><span className="text-gray-700">대부도항</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" /><span className="text-gray-700">섬</span>
            </div>
          </div>
        </div>

        {selectedIsland && (
          <div className="px-6 py-4 bg-white border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedIsland.id === "incheon" ? "bg-red-100" :
                selectedIsland.id === "daebu"   ? "bg-orange-100" : "bg-blue-100"
              }`}>
                <div className={`w-5 h-5 rounded-full ${
                  selectedIsland.id === "incheon" ? "bg-red-500" :
                  selectedIsland.id === "daebu"   ? "bg-orange-500" : "bg-blue-500"
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-gray-900">{selectedIsland.name}</p>
                <p className="text-sm text-gray-500">{selectedIsland.description}</p>
                {!selectedIsland.isPort && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-700">
                    <Ship className="w-4 h-4" strokeWidth={2} />
                    <span>{selectedIsland.ferryTime}</span>
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedIsland(null)} className="text-gray-400 text-lg font-light">×</button>
            </div>
          </div>
        )}

        {!selectedIsland && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 max-h-44 overflow-y-auto">
            <p className="text-sm font-semibold text-gray-700 mb-3">섬 목록</p>
            <div className="grid grid-cols-2 gap-2">
              {islands.filter(i => !i.isPort).map((island) => (
                <button
                  key={island.id}
                  onClick={() => setSelectedIsland(island)}
                  className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-left active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{island.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" strokeWidth={2} />
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Ship className="w-3 h-3 text-gray-400" strokeWidth={2} />
                    <span className="text-xs text-gray-600">{island.ferryTime}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* ── 모바일 레이아웃 끝 ──────────────────────────────────────────── */}
    </div>
  );
}
