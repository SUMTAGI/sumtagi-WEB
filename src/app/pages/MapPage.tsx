import { useState } from "react";
import { MapPin, Ship, Navigation, Info, ChevronRight } from "lucide-react";

interface Island {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  ferryTime: string;
  description: string;
}

const islands: Island[] = [
  { id: "incheon", name: "인천항", x: 20, y: 50, color: "#ef4444", ferryTime: "-", description: "인천 연안여객터미널" },
  { id: "daebu", name: "대부도항", x: 30, y: 65, color: "#f97316", ferryTime: "-", description: "방아머리여객터미널" },
  { id: "baengnyeong", name: "백령도", x: 25, y: 15, color: "#3b82f6", ferryTime: "4시간", description: "서해 최북단 섬" },
  { id: "daecheong", name: "대청도", x: 30, y: 25, color: "#3b82f6", ferryTime: "4시간", description: "모래사막의 섬" },
  { id: "socheong", name: "소청도", x: 28, y: 20, color: "#3b82f6", ferryTime: "4시간", description: "작은 섬" },
  { id: "yeonpyeong", name: "연평도", x: 35, y: 30, color: "#3b82f6", ferryTime: "3.5시간", description: "조기의 섬" },
  { id: "deokjeok", name: "덕적도", x: 50, y: 55, color: "#3b82f6", ferryTime: "2.5시간", description: "서포리 해변" },
  { id: "jawol", name: "자월도", x: 55, y: 65, color: "#3b82f6", ferryTime: "2.5시간", description: "한적한 어촌" },
  { id: "seungbong", name: "승봉도", x: 60, y: 60, color: "#3b82f6", ferryTime: "2시간", description: "작은 섬" },
  { id: "daeijak", name: "대이작도", x: 58, y: 68, color: "#3b82f6", ferryTime: "2시간", description: "큰 이작도" },
  { id: "soijak", name: "소이작도", x: 62, y: 72, color: "#3b82f6", ferryTime: "2시간", description: "작은 이작도" },
  { id: "pungdo", name: "풍도", x: 65, y: 75, color: "#3b82f6", ferryTime: "2.5시간", description: "동백꽃의 섬" },
  { id: "yukdo", name: "육도", x: 68, y: 78, color: "#3b82f6", ferryTime: "3시간", description: "작은 섬" },
];

const ferryRoutes = [
  // 인천항 출발
  { from: "incheon", to: "baengnyeong" },
  { from: "incheon", to: "daecheong" },
  { from: "incheon", to: "socheong" },
  { from: "incheon", to: "yeonpyeong" },
  { from: "incheon", to: "deokjeok" },
  { from: "incheon", to: "jawol" },
  { from: "incheon", to: "seungbong" },
  { from: "incheon", to: "daeijak" },
  // 대부도항 출발
  { from: "daebu", to: "jawol" },
  { from: "daebu", to: "seungbong" },
  { from: "daebu", to: "daeijak" },
  { from: "daebu", to: "soijak" },
  { from: "daebu", to: "deokjeok" },
  { from: "daebu", to: "pungdo" },
  { from: "daebu", to: "yukdo" },
  // 섬간 연결
  { from: "deokjeok", to: "jawol" },
  { from: "jawol", to: "daeijak" },
];

export function MapPage() {
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null);
  const [showRoutes, setShowRoutes] = useState(true);

  const getIslandPosition = (id: string) => {
    return islands.find(i => i.id === id);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-shrink-0">
        <h1 className="text-xl font-bold mb-1">섬 지도</h1>
        <p className="text-sm text-blue-100">인천 섬들의 위치와 여객선 항로</p>
      </div>

      {/* Controls */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => setShowRoutes(!showRoutes)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            showRoutes
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          <Ship className="w-4 h-4" strokeWidth={2} />
          <span className="text-sm">항로 {showRoutes ? "숨기기" : "보기"}</span>
        </button>
        <button
          onClick={() => setSelectedIsland(null)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium"
        >
          <Navigation className="w-4 h-4" strokeWidth={2} />
          <span className="text-sm">전체보기</span>
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <defs>
            <marker
              id="arrowhead-map"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" opacity="0.6" />
            </marker>

            <pattern id="water-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="#93c5fd" opacity="0.3" />
            </pattern>
          </defs>

          <rect width="100" height="100" fill="url(#water-pattern)" />

          {/* Korean Peninsula Outline (simplified, light) */}
          <g opacity="0.15" fill="#1e3a8a" stroke="#1e40af" strokeWidth="0.3">
            {/* Mainland Korea (simplified western coast) */}
            <path d="M 5 80 L 8 70 L 10 60 L 12 50 L 15 40 L 18 30 L 20 20 L 22 15 L 20 12 L 18 15 L 15 20 L 12 30 L 10 40 L 8 50 L 6 60 L 5 70 Z" />

            {/* Incheon area coastline */}
            <ellipse cx="15" cy="55" rx="8" ry="12" opacity="0.3" />
          </g>

          {showRoutes && ferryRoutes.map((route, index) => {
            const from = getIslandPosition(route.from);
            const to = getIslandPosition(route.to);
            if (!from || !to) return null;

            return (
              <g key={index}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#3b82f6"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                  opacity="0.6"
                  markerEnd="url(#arrowhead-map)"
                />
              </g>
            );
          })}

          {islands.map((island) => (
            <g key={island.id} onClick={() => setSelectedIsland(island)}>
              <circle
                cx={island.x}
                cy={island.y}
                r={(island.id === "incheon" || island.id === "daebu") ? "4" : selectedIsland?.id === island.id ? "5" : "3"}
                fill={island.color}
                stroke="white"
                strokeWidth="1.5"
                className="cursor-pointer transition-all"
                opacity={selectedIsland && selectedIsland.id !== island.id ? 0.5 : 1}
              />
              {(island.id === "incheon" || island.id === "daebu") && (
                <circle
                  cx={island.x}
                  cy={island.y}
                  r="6"
                  fill="none"
                  stroke={island.color}
                  strokeWidth="1"
                  opacity="0.3"
                />
              )}
            </g>
          ))}
        </svg>

        {/* Island Labels */}
        <div className="absolute inset-0 pointer-events-none">
          {islands.map((island) => (
            <div
              key={island.id}
              className="absolute"
              style={{
                left: `${island.x}%`,
                top: `${island.y}%`,
                transform: 'translate(-50%, -150%)',
              }}
            >
              <div
                className={`px-2 py-1 rounded shadow-sm text-xs font-semibold whitespace-nowrap transition-all ${
                  island.id === "incheon"
                    ? "bg-red-500 text-white"
                    : island.id === "daebu"
                    ? "bg-orange-500 text-white"
                    : selectedIsland?.id === island.id
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                {island.name}
              </div>
            </div>
          ))}
        </div>

        {/* Scale indicator */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm">
          <p className="text-xs text-gray-600 mb-1">거리 기준</p>
          <div className="flex items-center gap-2">
            <div className="w-12 h-1 bg-gray-400"></div>
            <span className="text-xs font-medium text-gray-700">약 50km</span>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-700">인천항</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs text-gray-700">대부도항</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-xs text-gray-700">섬</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-blue-600 opacity-60" style={{ strokeDasharray: "2,2" }}></div>
            <span className="text-xs text-gray-700">항로</span>
          </div>
        </div>
      </div>

      {/* Island Info Panel */}
      {selectedIsland && (
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              selectedIsland.id === "incheon" ? "bg-red-100" : selectedIsland.id === "daebu" ? "bg-orange-100" : "bg-blue-100"
            }`}>
              <MapPin className={`w-6 h-6 ${
                selectedIsland.id === "incheon" ? "text-red-700" : selectedIsland.id === "daebu" ? "text-orange-600" : "text-blue-600"
              }`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{selectedIsland.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{selectedIsland.description}</p>
              {selectedIsland.id !== "incheon" && selectedIsland.id !== "daebu" && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-700">
                    <Ship className="w-4 h-4" strokeWidth={2} />
                    <span>{selectedIsland.ferryTime}</span>
                  </div>
                  <button className="flex items-center gap-1 text-blue-600 font-medium">
                    <Info className="w-4 h-4" strokeWidth={2} />
                    <span>상세정보</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedIsland(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Island List */}
      {!selectedIsland && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0 max-h-48 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">섬 목록</h3>
          <div className="grid grid-cols-2 gap-2">
            {islands.filter(i => i.id !== "incheon" && i.id !== "daebu").map((island) => (
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
  );
}
