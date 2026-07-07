import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

interface RouteMapProps {
  islands: string[];
  departurePort?: string;
}

const islandCoords: Record<string, { lat: number; lng: number }> = {
  "인천항":   { lat: 37.4744, lng: 126.6169 },
  "대부도":   { lat: 37.2173, lng: 126.5589 },
  "삼목항":   { lat: 37.4986, lng: 126.4532 },
  "신도":     { lat: 37.5279, lng: 126.4572 },
  "장봉도":   { lat: 37.5310, lng: 126.3679 },
  "백령도":   { lat: 37.9685, lng: 124.6902 },
  "대청도":   { lat: 37.8371, lng: 124.7182 },
  "소청도":   { lat: 37.7625, lng: 124.7431 },
  "연평도":   { lat: 37.6736, lng: 125.6814 },
  "덕적도":   { lat: 37.2269, lng: 126.1432 },
  "자월도":   { lat: 37.2589, lng: 126.3083 },
  "승봉도":   { lat: 37.1669, lng: 126.1611 },
  "대이작도": { lat: 37.1667, lng: 126.2833 },
  "소이작도": { lat: 37.1500, lng: 126.2917 },
  "풍도":     { lat: 37.0647, lng: 126.2636 },
  "육도":     { lat: 37.0036, lng: 126.3547 },
  "영흥도":   { lat: 37.2397, lng: 126.4921 },
  "선재도":   { lat: 37.2508, lng: 126.4731 },
  "굴업도":   { lat: 37.1917, lng: 126.2186 },
  "시도":     { lat: 37.5446026512, lng: 126.431177159 },
  "소야도":   { lat: 37.2126756954, lng: 126.175942845 },
  "울도":     { lat: 37.0257233193983, lng: 125.997020937643 },
  // 모도·문갑도·백아도는 관광공사 API에 데이터가 없어 OSM Nominatim으로 실측 좌표 확보(2026-07-07)
  "모도":     { lat: 37.5331998, lng: 126.4080697 },
  "문갑도":   { lat: 37.1769151, lng: 126.0982694 },
  "백아도":   { lat: 37.0802720, lng: 125.9468352 },
};

function makeStopIcon(index: number, isPort: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:22px;height:22px;
      background:${isPort ? "#ef4444" : "#3b82f6"};
      border:2px solid white;
      border-radius:50%;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:10px;font-weight:700;
    ">${isPort ? "출" : index}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function AutoFit({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [24, 24] });
    }
  }, [map, positions]);
  return null;
}

export function RouteMap({ islands, departurePort = "인천항" }: RouteMapProps) {
  if (islands.length === 0) return null;

  // 다리로 연결된 섬("육로 이동")은 고정 출발항이 없어 좌표가 없음 — 섬간 경로만 표시
  const portCoord = islandCoords[departurePort];
  const stops = islands.map(name => islandCoords[name]).filter(Boolean);

  if (stops.length === 0) return null;

  const routePositions: [number, number][] = portCoord
    ? [
        [portCoord.lat, portCoord.lng],
        ...stops.map(c => [c.lat, c.lng] as [number, number]),
        [portCoord.lat, portCoord.lng],
      ]
    : stops.map(c => [c.lat, c.lng] as [number, number]);

  const center = portCoord ?? stops[0];

  return (
    <div className="w-full">
    <div className="w-full rounded-lg overflow-hidden border border-blue-200" style={{ height: 240 }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={8}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <AutoFit positions={routePositions} />

        <Polyline
          positions={routePositions}
          pathOptions={{ color: "#3b82f6", weight: 2, dashArray: "6,5", opacity: 0.85 }}
        />

        {portCoord && (
          <Marker
            position={[portCoord.lat, portCoord.lng]}
            icon={makeStopIcon(0, true)}
          />
        )}

        {stops.map((coord, i) => (
          <Marker
            key={i}
            position={[coord.lat, coord.lng]}
            icon={makeStopIcon(i + 1, false)}
          />
        ))}
      </MapContainer>
    </div>
    <p className="text-right text-xs text-gray-400 mt-1">© OpenStreetMap contributors</p>
    </div>
  );
}
