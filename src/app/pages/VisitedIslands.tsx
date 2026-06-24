import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, MapPin, Calendar, Ship } from "lucide-react";
import { supabase } from "../lib/supabase";

interface PlannedIsland {
  id: string;
  name: string;
  tripTitle: string;
  startDate: string;
  endDate: string;
  departurePort: string;
  image: string;
}

const islandImages: Record<string, string> = {
  백령도:
    "https://images.unsplash.com/photo-1635355942488-a8bdb5a0803e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  대청도:
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  덕적도:
    "https://images.unsplash.com/photo-1662898069390-badabf2d65df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
  자월도:
    "https://images.unsplash.com/photo-1758327740342-4e705edea29b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
};

export function VisitedIslands() {
  const navigate = useNavigate();
  const [plannedIslands, setPlannedIslands] = useState<PlannedIsland[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlannedIslands();
  }, []);

  const loadPlannedIslands = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from("trips")
      .select("id, title, islands, start_date, end_date, departure_port")
      .eq("user_id", user.id)
      .order("start_date", { ascending: true });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const result: PlannedIsland[] = [];

    data?.forEach((trip) => {
      const islands = Array.isArray(trip.islands) ? trip.islands : [];

      islands.forEach((name: string) => {
        result.push({
          id: `${trip.id}-${name}`,
          name,
          tripTitle: trip.title || `${name} 여행`,
          startDate: trip.start_date,
          endDate: trip.end_date,
          departurePort: trip.departure_port || "출발항 미정",
          image:
            islandImages[name] ||
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
        });
      });
    });

    setPlannedIslands(result);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">여행 예정 섬을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate("/my")}
          className="active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">여행 예정 섬</h1>
      </div>

      <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="예정 섬" value={plannedIslands.length} icon="🏝️" />
          <StatCard label="일정" value={new Set(plannedIslands.map((i) => i.tripTitle)).size} icon="📅" />
          <StatCard label="출발" value="예정" icon="⛴️" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {plannedIslands.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              아직 예정된 섬 여행이 없어요
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              여행 일정을 만들면 예정 섬이 여기에 표시돼요
            </p>
            <button
              onClick={() => navigate("/create-trip")}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium active:scale-95 transition-transform"
            >
              여행 일정 만들기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {plannedIslands.map((island) => (
              <PlannedIslandCard key={island.id} island={island} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}

function PlannedIslandCard({ island }: { island: PlannedIsland }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="relative h-40">
        <img
          src={island.image}
          alt={island.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white mb-1">{island.name}</h3>
          <p className="text-xs text-white/90">{island.tripTitle}</p>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4" strokeWidth={2} />
          <span>
            {new Date(island.startDate).toLocaleDateString("ko-KR")} ~{" "}
            {new Date(island.endDate).toLocaleDateString("ko-KR")}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Ship className="w-4 h-4" strokeWidth={2} />
          <span>{island.departurePort} 출발</span>
        </div>

        <span className="inline-block text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
          여행 예정
        </span>
      </div>
    </div>
  );
}