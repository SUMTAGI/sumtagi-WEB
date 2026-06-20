import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Ship, Clock, TrendingUp, Search } from "lucide-react";
import { CardGridSkeleton } from "../components/SkeletonLoader";
import { getIslands, type Island } from "../../lib/api/islands";
import { getAllIslandsCongestion, type IslandCongestionData } from "../../lib/api/congestion";

export function Islands() {
  const [islands, setIslands] = useState<Island[]>([]);
  const [congestionMap, setCongestionMap] = useState<Record<string, IslandCongestionData>>({});
  const [portFilter, setPortFilter] = useState<"all" | "인천항" | "대부도">("all");
  const [congestionFilter, setCongestionFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-500 text-white flex-shrink-0">
        <h1 className="text-xl font-bold mb-1">섬 둘러보기</h1>
        <p className="text-sm text-blue-100">인천의 아름다운 섬들을 탐색해보세요</p>
      </div>

      <div className="px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
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

      <div className="bg-white px-6 py-4 border-b border-gray-200 flex-shrink-0 space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">출발 항구</p>
          <div className="grid grid-cols-3 gap-2">
            <FilterButton active={portFilter === "all"} onClick={() => setPortFilter("all")} label="전체" count={islands.length} />
            <FilterButton active={portFilter === "인천항"} onClick={() => setPortFilter("인천항")} label="인천항" color="red" count={islands.filter(i => i.ports.includes("인천항")).length} />
            <FilterButton active={portFilter === "대부도"} onClick={() => setPortFilter("대부도")} label="대부도" color="orange" count={islands.filter(i => i.ports.includes("대부도")).length} />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">혼잡도</p>
          <div className="grid grid-cols-4 gap-2">
            <FilterButton active={congestionFilter === "all"} onClick={() => setCongestionFilter("all")} label="전체" count={islands.length} />
            <FilterButton active={congestionFilter === "low"} onClick={() => setCongestionFilter("low")} label="여유" color="green" count={islands.filter(i => effectiveCongestion(i) === "low").length} />
            <FilterButton active={congestionFilter === "medium"} onClick={() => setCongestionFilter("medium")} label="보통" color="yellow" count={islands.filter(i => effectiveCongestion(i) === "medium").length} />
            <FilterButton active={congestionFilter === "high"} onClick={() => setCongestionFilter("high")} label="혼잡" color="red" count={islands.filter(i => effectiveCongestion(i) === "high").length} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
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
    </div>
  );
}

function FilterButton({
  active, onClick, label, color = "blue", count
}: {
  active: boolean; onClick: () => void; label: string; color?: "blue" | "green" | "yellow" | "red" | "orange"; count: number;
}) {
  const colors = {
    blue: active ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700",
    green: active ? "bg-green-500 text-white" : "bg-green-100 text-green-700",
    yellow: active ? "bg-yellow-500 text-white" : "bg-yellow-100 text-yellow-800",
    red: active ? "bg-red-500 text-white" : "bg-gray-100 text-gray-700",
    orange: active ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700",
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

function IslandCardMobile({ island, congestionLevel }: { island: Island; congestionLevel: 'low' | 'medium' | 'high' }) {
  const getCongestionBadge = () => {
    const config = {
      low: { label: "여유", color: "bg-green-500 text-white" },
      medium: { label: "보통", color: "bg-yellow-500 text-white" },
      high: { label: "혼잡", color: "bg-red-500 text-white" },
    };
    const { label, color } = config[congestionLevel];
    return <span className={`text-xs px-2 py-1 rounded font-medium ${color}`}>{label}</span>;
  };

  return (
    <Link to={`/island/${island.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden active:scale-98 transition-transform">
      <div className="relative h-40">
        <img src={island.image} alt={island.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute top-3 right-3">
          {island.popularity_trend === "up" && (
            <div className="bg-red-500 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3" strokeWidth={2} />
              <span>인기상승</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white mb-1">{island.name}</h3>
          {getCongestionBadge()}
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3">{island.description}</p>
        <div className="space-y-1 mb-3">
          {island.features.slice(0, 2).map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-gray-700">
              <div className="w-1 h-1 rounded-full bg-blue-500" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <Ship className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <span className="text-gray-900 font-medium">{island.ferry_time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <span className="text-gray-900 font-medium">{island.best_season}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">여객선 요금</span>
            <span className="font-bold text-blue-500">{island.ferry_price.toLocaleString()}원</span>
          </div>
          <div className="flex gap-1">
            {island.ports.map((port) => (
              <span key={port} className={`text-xs px-2 py-0.5 rounded ${port === "인천항" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                {port}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
