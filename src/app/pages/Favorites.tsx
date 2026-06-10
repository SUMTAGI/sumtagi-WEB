import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Heart, MapPin, Ship, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Favorite {
  id: string;
  name: string;
  type: "island" | "attraction";
  location: string;
  image: string;
  ferryTime?: string;
}

export function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([
    {
      id: "1",
      name: "자월도",
      type: "island",
      location: "인천",
      image: "https://images.unsplash.com/photo-1758327740342-4e705edea29b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      ferryTime: "2.5시간",
    },
    {
      id: "2",
      name: "두무진",
      type: "attraction",
      location: "백령도",
      image: "https://images.unsplash.com/photo-1635355942488-a8bdb5a0803e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    },
    {
      id: "3",
      name: "이작도",
      type: "island",
      location: "인천",
      image: "https://images.unsplash.com/photo-1661488601431-e8257e864068?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      ferryTime: "2시간",
    },
  ]);

  const handleRemove = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
    toast.success("찜 목록에서 제거되었어요");
  };

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
        <h1 className="text-lg font-bold text-gray-900">찜한 여행지</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              찜한 여행지가 없어요
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              마음에 드는 섬이나 관광지를 찜해보세요
            </p>
            <button
              onClick={() => navigate("/islands")}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium active:scale-95 transition-transform"
            >
              섬 둘러보기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((favorite) => (
              <FavoriteCard
                key={favorite.id}
                favorite={favorite}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FavoriteCard({
  favorite,
  onRemove
}: {
  favorite: Favorite;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex">
      <div className="w-28 h-28 flex-shrink-0">
        <img
          src={favorite.image}
          alt={favorite.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{favorite.name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" strokeWidth={2} />
              <span>{favorite.location}</span>
            </div>
            {favorite.ferryTime && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Ship className="w-4 h-4" strokeWidth={2} />
                <span>{favorite.ferryTime}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => onRemove(favorite.id)}
            className="text-red-700 active:scale-95 transition-transform"
          >
            <Trash2 className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <span className={`text-xs px-2 py-1 rounded-full self-start mt-auto ${
          favorite.type === "island"
            ? "bg-blue-100 text-blue-700"
            : "bg-green-100 text-green-700"
        }`}>
          {favorite.type === "island" ? "섬" : "관광지"}
        </span>
      </div>
    </div>
  );
}
