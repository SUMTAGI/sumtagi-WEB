import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Ship, Clock, TrendingUp, Users, Search } from "lucide-react";
import { CardGridSkeleton } from "../components/SkeletonLoader";

interface IslandData {
  id: string;
  name: string;
  description: string;
  features: string[];
  ferryTime: string;
  ferryPrice: number;
  popularityTrend: "up" | "down" | "stable";
  congestion: "low" | "medium" | "high";
  bestSeason: string;
  image: string;
  ports: ("인천항" | "대부도")[];
}

const ISLANDS: IslandData[] = [
  {
    id: "baengnyeong",
    name: "백령도",
    description: "천혜의 자연경관과 독특한 지질을 자랑하는 서해 최북단 섬",
    features: ["두무진 해안 절벽", "사곶해변", "콩돌해변"],
    ferryTime: "4시간",
    ferryPrice: 45000,
    popularityTrend: "up",
    congestion: "medium",
    bestSeason: "5~10월",
    image: "https://images.unsplash.com/photo-1635355942488-a8bdb5a0803e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    ports: ["인천항"],
  },
  {
    id: "daecheong",
    name: "대청도",
    description: "모래사막과 기암절벽이 공존하는 신비로운 섬",
    features: ["옥죽동 사막", "농여해변", "미아동 해안"],
    ferryTime: "4시간",
    ferryPrice: 45000,
    popularityTrend: "stable",
    congestion: "low",
    bestSeason: "5~9월",
    image: "https://images.unsplash.com/photo-1700621496615-6ee6240503ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    ports: ["인천항"],
  },
  {
    id: "socheong",
    name: "소청도",
    description: "작지만 아름다운 서해의 보석",
    features: ["분바위", "등대", "해안절벽"],
    ferryTime: "4시간",
    ferryPrice: 45000,
    popularityTrend: "stable",
    congestion: "low",
    bestSeason: "5~9월",
    image: "https://images.unsplash.com/photo-1661488601431-e8257e864068?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    ports: ["인천항"],
  },
  {
    id: "yeonpyeong",
    name: "연평도",
    description: "조기로 유명한 서해 5도 중 하나",
    features: ["조기잡이", "낚시", "해안산책"],
    ferryTime: "3.5시간",
    ferryPrice: 40000,
    popularityTrend: "stable",
    congestion: "medium",
    bestSeason: "4~10월",
    image: "https://images.unsplash.com/photo-1628412071389-6e8f7a7a4e6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    ports: ["인천항"],
  },
  {
    id: "deokjeok",
    name: "덕적도",
    description: "맑은 바다와 아름다운 해변이 어우러진 가족 여행지",
    features: ["서포리해수욕장", "비조봉", "소야도"],
    ferryTime: "2.5시간",
    ferryPrice: 28000,
    popularityTrend: "stable",
    congestion: "medium",
    bestSeason: "6~9월",
    image: "https://images.unsplash.com/photo-1662898069390-badabf2d65df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    ports: ["인천항", "대부도"],
  },
  {
    id: "jawol",
    name: "자월도",
    description: "한적한 어촌 풍경과 에메랄드빛 바다",
    features: ["큰말해변", "선착장마을", "일몰 명소"],
    ferryTime: "2.5시간",
    ferryPrice: 25000,
    popularityTrend: "up",
    congestion: "low",
    bestSeason: "5~10월",
    image: "https://images.unsplash.com/photo-1758327740342-4e705edea29b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    ports: ["인천항", "대부도"],
  },
  {
    id: "seungbong",
    name: "승봉도",
    description: "작고 아담한 섬의 매력",
    features: ["해안산책로", "선착장", "조용한 마을"],
    ferryTime: "2시간",
    ferryPrice: 23000,
    popularityTrend: "stable",
    congestion: "low",
    bestSeason: "5~10월",
    image: "https://images.unsplash.com/photo-1635355942488-a8bdb5a0803e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    ports: ["인천항", "대부도"],
  },
  {
    id: "daeijak",
    name: "대이작도",
    description: "청정 해역과 고운 모래가 특징인 섬",
    features: ["목기미해변", "부아산", "해안 트레킹"],
    ferryTime: "2시간",
    ferryPrice: 25000,
    popularityTrend: "up",
    congestion: "low",
    bestSeason: "6~9월",
    image: "https://images.unsplash.com/photo-1661488601431-e8257e864068?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    ports: ["인천항", "대부도"],
  },
  {
    id: "soijak",
    name: "소이작도",
    description: "작은 이작도의 조용한 해변",
    features: ["해수욕장", "낚시", "조개잡이"],
    ferryTime: "2시간",
    ferryPrice: 25000,
    popularityTrend: "stable",
    congestion: "low",
    bestSeason: "6~9월",
    image: "https://images.unsplash.com/photo-1662898069390-badabf2d65df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    ports: ["대부도"],
  },
  {
    id: "pungdo",
    name: "풍도",
    description: "동백꽃으로 유명한 아름다운 섬",
    features: ["동백나무숲", "해안트레킹", "일몰명소"],
    ferryTime: "2.5시간",
    ferryPrice: 27000,
    popularityTrend: "up",
    congestion: "medium",
    bestSeason: "3~5월",
    image: "https://images.unsplash.com/photo-1700621496615-6ee6240503ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    ports: ["대부도"],
  },
  {
    id: "yukdo",
    name: "육도",
    description: "작은 섬의 평화로운 풍경",
    features: ["작은해변", "어촌마을", "산책로"],
    ferryTime: "3시간",
    ferryPrice: 28000,
    popularityTrend: "stable",
    congestion: "low",
    bestSeason: "5~9월",
    image: "https://images.unsplash.com/photo-1758327740342-4e705edea29b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    ports: ["대부도"],
  },
];

export function Islands() {
  const [portFilter, setPortFilter] = useState<"all" | "인천항" | "대부도">("all");
  const [congestionFilter, setCongestionFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredIslands = ISLANDS.filter(island => {
    const portMatch = portFilter === "all" || island.ports.includes(portFilter);
    const congestionMatch = congestionFilter === "all" || island.congestion === congestionFilter;
    const searchMatch = searchQuery === "" ||
      island.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      island.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      island.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return portMatch && congestionMatch && searchMatch;
  });

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-500 text-white flex-shrink-0">
        <h1 className="text-xl font-bold mb-1">섬 둘러보기</h1>
        <p className="text-sm text-blue-100">인천의 아름다운 섬들을 탐색해보세요</p>
      </div>

      {/* Search Bar */}
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

      {/* Filters */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex-shrink-0 space-y-3">
        {/* 출발 항구 필터 */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">출발 항구</p>
          <div className="grid grid-cols-3 gap-2">
            <FilterButton
              active={portFilter === "all"}
              onClick={() => setPortFilter("all")}
              label="전체"
              count={ISLANDS.length}
            />
            <FilterButton
              active={portFilter === "인천항"}
              onClick={() => setPortFilter("인천항")}
              label="인천항"
              color="red"
              count={ISLANDS.filter(i => i.ports.includes("인천항")).length}
            />
            <FilterButton
              active={portFilter === "대부도"}
              onClick={() => setPortFilter("대부도")}
              label="대부도"
              color="orange"
              count={ISLANDS.filter(i => i.ports.includes("대부도")).length}
            />
          </div>
        </div>

        {/* 혼잡도 필터 */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">혼잡도</p>
          <div className="grid grid-cols-4 gap-2">
            <FilterButton
              active={congestionFilter === "all"}
              onClick={() => setCongestionFilter("all")}
              label="전체"
              count={ISLANDS.length}
            />
            <FilterButton
              active={congestionFilter === "low"}
              onClick={() => setCongestionFilter("low")}
              label="여유"
              color="green"
              count={ISLANDS.filter(i => i.congestion === "low").length}
            />
            <FilterButton
              active={congestionFilter === "medium"}
              onClick={() => setCongestionFilter("medium")}
              label="보통"
              color="yellow"
              count={ISLANDS.filter(i => i.congestion === "medium").length}
            />
            <FilterButton
              active={congestionFilter === "high"}
              onClick={() => setCongestionFilter("high")}
              label="혼잡"
              color="red"
              count={ISLANDS.filter(i => i.congestion === "high").length}
            />
          </div>
        </div>
      </div>

      {/* Islands List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <CardGridSkeleton count={5} />
        ) : (
          <div className="space-y-4">
            {filteredIslands.map((island, index) => (
              <div
                key={island.id}
                className="animate-stagger-item"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <IslandCardMobile island={island} />
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
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
  active,
  onClick,
  label,
  color = "blue",
  count
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: "blue" | "green" | "yellow" | "red" | "orange";
  count: number;
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
      className={`px-2 py-2 rounded-lg font-medium transition-all text-sm ${colors[color]} ${
        !active && "active:scale-95"
      }`}
    >
      {label} ({count})
    </button>
  );
}

function IslandCardMobile({ island }: { island: IslandData }) {
  const getCongestionBadge = () => {
    const config = {
      low: { label: "여유", color: "bg-green-500 text-white" },
      medium: { label: "보통", color: "bg-yellow-500 text-white" },
      high: { label: "혼잡", color: "bg-red-500 text-white" },
    };

    const { label, color } = config[island.congestion];
    return <span className={`text-xs px-2 py-1 rounded font-medium ${color}`}>{label}</span>;
  };

  return (
    <Link to={`/island/${island.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden active:scale-98 transition-transform">
      <div className="relative h-40">
        <img
          src={island.image}
          alt={island.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute top-3 right-3">
          {island.popularityTrend === "up" && (
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
            <span className="text-gray-900 font-medium">{island.ferryTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <span className="text-gray-900 font-medium">{island.bestSeason}</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">여객선 요금</span>
            <span className="font-bold text-blue-500">{island.ferryPrice.toLocaleString()}원</span>
          </div>
          <div className="flex gap-1">
            {island.ports.map((port) => (
              <span
                key={port}
                className={`text-xs px-2 py-0.5 rounded ${
                  port === "인천항"
                    ? "bg-red-100 text-red-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {port}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
