import { MapPin, Ship } from "lucide-react";

interface RouteMapProps {
  islands: string[];
  departurePort?: string;
}

export function RouteMap({ islands, departurePort = "인천항" }: RouteMapProps) {
  if (islands.length === 0) return null;

  const positions = [
    { name: "인천항", x: 20, y: 50 },
    { name: "대부도", x: 30, y: 65 },
    { name: "백령도", x: 80, y: 20 },
    { name: "대청도", x: 75, y: 30 },
    { name: "소청도", x: 78, y: 25 },
    { name: "연평도", x: 72, y: 35 },
    { name: "덕적도", x: 50, y: 60 },
    { name: "자월도", x: 55, y: 70 },
    { name: "승봉도", x: 60, y: 65 },
    { name: "대이작도", x: 58, y: 72 },
    { name: "소이작도", x: 62, y: 75 },
    { name: "풍도", x: 65, y: 78 },
    { name: "육도", x: 68, y: 80 },
  ];

  const getPosition = (island: string) => {
    return positions.find(p => p.name === island) || positions.find(p => p.name === "인천항")!;
  };

  const portPos = getPosition(departurePort);
  const islandPositions = islands.map(island => getPosition(island));

  return (
    <div className="relative w-full aspect-square bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg overflow-hidden border border-blue-200">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>

        <path
          d={`M ${portPos.x} ${portPos.y} ${islandPositions.map(pos => `L ${pos.x} ${pos.y}`).join(' ')} L ${portPos.x} ${portPos.y}`}
          stroke="#3b82f6"
          strokeWidth="0.5"
          fill="none"
          strokeDasharray="2,2"
          markerEnd="url(#arrowhead)"
        />

        <circle
          cx={portPos.x}
          cy={portPos.y}
          r="3"
          fill={departurePort === "대부도" ? "#f97316" : "#ef4444"}
          stroke="white"
          strokeWidth="1"
        />

        {islandPositions.map((pos, index) => (
          <circle
            key={index}
            cx={pos.x}
            cy={pos.y}
            r="2.5"
            fill="#3b82f6"
            stroke="white"
            strokeWidth="1"
          />
        ))}
      </svg>

      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute flex flex-col items-center"
          style={{ left: `${portPos.x}%`, top: `${portPos.y}%`, transform: 'translate(-50%, -120%)' }}
        >
          <div className={`${departurePort === "대부도" ? "bg-orange-500" : "bg-red-600"} text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-sm`}>
            {portPos.name}
          </div>
        </div>

        {islandPositions.map((pos, index) => (
          <div
            key={index}
            className="absolute flex flex-col items-center"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -120%)' }}
          >
            <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-sm">
              {pos.name}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-blue-200">
        <div className="flex items-center gap-2 text-xs">
          <Ship className="w-4 h-4 text-blue-600" strokeWidth={2} />
          <span className="text-gray-700">여행 경로</span>
        </div>
      </div>
    </div>
  );
}
