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

  const portCoord = islandCoords[departurePort];
  const stops = islands.map(name => islandCoords[name]).filter(Boolean);

  if (!portCoord || stops.length === 0) return null;

  const routePositions: [number, number][] = [
    [portCoord.lat, portCoord.lng],
    ...stops.map(c => [c.lat, c.lng] as [number, number]),
    [portCoord.lat, portCoord.lng],
  ];

  return (
    <div className="w-full">
    <div className="w-full rounded-lg overflow-hidden border border-blue-200" style={{ height: 240 }}>
      <MapContainer
        center={[portCoord.lat, portCoord.lng]}
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

        <Marker
          position={[portCoord.lat, portCoord.lng]}
          icon={makeStopIcon(0, true)}
        />

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
