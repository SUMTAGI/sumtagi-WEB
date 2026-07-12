import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Search, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { recommendIsland } from "../../lib/api/islandRecommend";

interface Props {
  variant?: "hero" | "card";
  placeholder?: string;
}

// 홈 검색창 — 자연어로 여행 취향을 입력하면 AI가 섬을 추천하고 CreateTrip으로 바로 연결
export function AiIslandSearchBar({ variant = "card", placeholder }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const isHero = variant === "hero";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    try {
      const { island, travelStyle, reason } = await recommendIsland(trimmed);
      toast.success(reason || `${island} 추천드려요!`);
      navigate(`/create-trip?name=${encodeURIComponent(island)}&style=${encodeURIComponent(travelStyle)}`);
    } catch {
      toast.error("추천에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={`flex items-center gap-2 rounded-2xl px-4 py-3.5 transition-colors ${
          isHero
            ? "bg-white/15 backdrop-blur-sm border border-white/30 focus-within:bg-white/20"
            : "bg-white border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.06)] focus-within:border-blue-300"
        }`}
      >
        <Sparkles className={`w-5 h-5 shrink-0 ${isHero ? "text-white" : "text-blue-600"}`} strokeWidth={2} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder ?? "어떤 여행을 원하세요? 예: 낚시하고 조용한 섬 가고 싶어요"}
          disabled={loading}
          className={`flex-1 min-w-0 bg-transparent outline-none text-sm ${
            isHero ? "text-white placeholder:text-blue-100" : "text-gray-900 placeholder:text-gray-400"
          }`}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 ${
            isHero ? "bg-white text-blue-600" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
          ) : (
            <Search className="w-4 h-4" strokeWidth={2.5} />
          )}
        </button>
      </div>
    </form>
  );
}
