import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Ship, ChevronRight } from "lucide-react";
import { getIslands } from "../../lib/api/islands";

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

const PORTS: MapIsland[] = [
  { id: "incheon", name: "인천항", lat: 37.4744, lng: 126.6169, color: "#ef4444", ferryTime: "-", description: "인천 연안여객터미널", isPort: true },
  { id: "daebu", name: "대부도항", lat: 37.2173, lng: 126.5589, color: "#f97316", ferryTime: "-", description: "방아머리여객터미널", isPort: true },
];

const ferryRoutes: [string, string][] = [
  ["incheon", "baengnyeong"],
  ["incheon", "daecheong"],
  ["incheon", "socheong"],
  ["incheon", "yeonpyeong"],
  ["incheon", "deokjeok"],
  ["incheon", "jawol"],
  ["incheon", "seungbong"],
  ["incheon", "daeijak"],
  ["daebu", "jawol"],
  ["daebu", "seungbong"],
  ["daebu", "daeijak"],
  ["daebu", "soijak"],
  ["daebu", "deokjeok"],
  ["daebu", "pungdo"],
  ["daebu", "yukdo"],
  ["deokjeok", "jawol"],
  ["jawol", "daeijak"],
  ["incheon", "yeonghung"],
  ["incheon", "guleop"],
  ["yeonghung", "seonjae"],
];

function makeIcon(color: string, isPort: boolean, isSelected: boolean) {
  const size = isPort ? 14 : isSelected ? 12 : 10;
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
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ islands }: { islands: MapIsland[] }) {
  const map = useMap();
  const bounds = L.latLngBounds(islands.map(i => [i.lat, i.lng]));
  map.fitBounds(bounds, { padding: [40, 40] });
  return null;
}

export function MapPage() {
  const [islands, setIslands] = useState<MapIsland[]>(PORTS);
  const [selectedIsland, setSelectedIsland] = useState<MapIsland | null>(null);
  const [showRoutes, setShowRoutes] = useState(true);

  useEffect(() => {
    getIslands().then(data => {
      const mapIslands: MapIsland[] = data
        .filter(i => i.lat != null && i.lng != null)
        .map(i => ({
          id: i.id,
          name: i.name,
          lat: i.lat!,
          lng: i.lng!,
          color: "#3b82f6",
          ferryTime: i.ferry_time ?? '',
          description: i.description ?? '',
          isPort: false,
        }));
      setIslands([...PORTS, ...mapIslands]);
    });
  }, []);

  const getIsland = (id: string) => islands.find(i => i.id === id);

  return (
    <div className="h-full flex flex-col bg-white">
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

      <div className="flex-1 relative">
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

          {showRoutes && ferryRoutes.map(([fromId, toId], i) => {
            const from = getIsland(fromId);
            const to = getIsland(toId);
            if (!from || !to) return null;
            const isHighlighted =
              selectedIsland?.id === fromId || selectedIsland?.id === toId;
            return (
              <Polyline
                key={i}
                positions={[[from.lat, from.lng], [to.lat, to.lng]]}
                pathOptions={{
                  color: isHighlighted ? "#2563eb" : "#3b82f6",
                  weight: isHighlighted ? 2.5 : 1.2,
                  opacity: isHighlighted ? 1 : 0.4,
                  dashArray: "6, 6",
                }}
              />
            );
          })}

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
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-700">인천항</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-gray-700">대부도항</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="text-gray-700">섬</span>
          </div>
        </div>
      </div>

      {selectedIsland && (
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              selectedIsland.id === "incheon" ? "bg-red-100" : selectedIsland.id === "daebu" ? "bg-orange-100" : "bg-blue-100"
            }`}>
              <div className={`w-5 h-5 rounded-full ${
                selectedIsland.id === "incheon" ? "bg-red-500" : selectedIsland.id === "daebu" ? "bg-orange-500" : "bg-blue-500"
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
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0 max-h-44 overflow-y-auto">
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
  );
}
