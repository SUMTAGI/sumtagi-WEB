import { useNavigate } from "react-router";
import { ChevronLeft, MapPin, Calendar, Camera, Star } from "lucide-react";

interface VisitedIsland {
  id: string;
  name: string;
  visitDate: string;
  image: string;
  rating: number;
  photos: number;
}

const visitedIslands: VisitedIsland[] = [
  {
    id: "1",
    name: "백령도",
    visitDate: "2024-07-15",
    image: "https://images.unsplash.com/photo-1635355942488-a8bdb5a0803e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    rating: 5,
    photos: 24,
  },
  {
    id: "2",
    name: "덕적도",
    visitDate: "2024-05-20",
    image: "https://images.unsplash.com/photo-1662898069390-badabf2d65df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    rating: 4,
    photos: 18,
  },
  {
    id: "3",
    name: "영흥도",
    visitDate: "2024-03-10",
    image: "https://images.unsplash.com/photo-1628412071389-6e8f7a7a4e6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    rating: 5,
    photos: 31,
  },
];

export function VisitedIslands() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate("/my")}
          className="active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">방문한 섬</h1>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="방문" value={visitedIslands.length} icon="🏝️" />
          <StatCard label="사진" value={visitedIslands.reduce((sum, i) => sum + i.photos, 0)} icon="📸" />
          <StatCard label="평점" value="4.7" icon="⭐" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {visitedIslands.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              아직 방문한 섬이 없어요
            </h3>
            <p className="text-sm text-gray-600">
              여행을 떠나 추억을 남겨보세요
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visitedIslands.map((island) => (
              <IslandCard key={island.id} island={island} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}

function IslandCard({ island }: { island: VisitedIsland }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="relative h-40">
        <img
          src={island.image}
          alt={island.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white mb-1">{island.name}</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-white/90" strokeWidth={2} />
              <span className="text-xs text-white/90">
                {new Date(island.visitDate).toLocaleDateString('ko-KR')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Camera className="w-4 h-4 text-white/90" strokeWidth={2} />
              <span className="text-xs text-white/90">{island.photos}장</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= island.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
              strokeWidth={2}
            />
          ))}
          <span className="text-sm text-gray-600 ml-2">{island.rating}.0</span>
        </div>
      </div>
    </div>
  );
}
