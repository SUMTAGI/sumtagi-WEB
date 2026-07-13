import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Heart, MapPin, Ship, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { favoritesService } from "../../lib/favoritesService";
import { IslandImage } from "../components/IslandImage";

export function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    favoritesService.getFavorites()
      .then(data => setFavorites(data))
      .catch(() => toast.error("찜 목록을 불러오지 못했어요"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleRemove = async (islandId: string) => {
    await favoritesService.removeFavorite(islandId);
    setFavorites(prev => prev.filter(f => f.island_id !== islandId));
    toast.success("찜 목록에서 제거되었어요");
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3">
        <button
          onClick={() => navigate("/my")}
          className="active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">찜한 여행지</h1>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">찜한 여행지가 없어요</h3>
            <p className="text-sm text-gray-600 mb-6">마음에 드는 섬을 찜해보세요</p>
            <button onClick={() => navigate("/islands")} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium active:scale-95 transition-transform">
              섬 둘러보기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav) => (
              <div key={fav.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex">
                <div className="w-28 h-28">
                  <IslandImage src={fav.islands?.image} alt={fav.islands?.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 p-4 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{fav.islands?.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" strokeWidth={2} /><span>인천</span>
                      </div>
                      {fav.islands?.ferry_time && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Ship className="w-4 h-4" strokeWidth={2} /><span>{fav.islands.ferry_time}</span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleRemove(fav.island_id)} className="text-red-700 active:scale-95 transition-transform">
                      <Trash2 className="w-5 h-5" strokeWidth={2} />
                    </button>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full self-start mt-auto bg-blue-100 text-blue-700">섬</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

