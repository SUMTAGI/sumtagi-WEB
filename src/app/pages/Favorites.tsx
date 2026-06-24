import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Heart, MapPin, Ship, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

interface Favorite {
  id: string;
  island_id: string;
  name: string;
  location: string;
  image: string;
  ferryTime?: string;
}

const islandMap: Record<string, Omit<Favorite, "id" | "island_id">> = {
  baengnyeong: {
    name: "백령도",
    location: "인천 옹진군",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    ferryTime: "약 4시간",
  },
  jawol: {
    name: "자월도",
    location: "인천 옹진군",
    image:
      "https://images.unsplash.com/photo-1758327740342-4e705edea29b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    ferryTime: "약 2.5시간",
  },
  ijac: {
    name: "이작도",
    location: "인천 옹진군",
    image:
      "https://images.unsplash.com/photo-1661488601431-e8257e864068?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    ferryTime: "약 2시간",
  },
};

export function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("로그인 후 이용해주세요");
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("id, island_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("찜 목록을 불러오지 못했어요");
      setLoading(false);
      return;
    }

    const mapped =
      data?.map((item) => {
        const island = islandMap[item.island_id] || {
          name: item.island_id,
          location: "인천",
          image:
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
          ferryTime: "",
        };

        return {
          id: item.id,
          island_id: item.island_id,
          ...island,
        };
      }) || [];

    setFavorites(mapped);
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("favorites").delete().eq("id", id);

    if (error) {
      toast.error("삭제에 실패했어요");
      return;
    }

    setFavorites((prev) => prev.filter((f) => f.id !== id));
    toast.success("찜 목록에서 제거되었어요");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">찜 목록을 불러오는 중...</p>
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
        <h1 className="text-lg font-bold text-gray-900">찜한 여행지</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
                onClick={() => navigate(`/island/${favorite.island_id}`)}
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
  onRemove,
  onClick,
}: {
  favorite: Favorite;
  onRemove: (id: string) => void;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex active:scale-[0.99] transition-transform"
    >
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
            <h3 className="font-semibold text-gray-900 mb-1">
              {favorite.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{favorite.location}</span>
            </div>
            {favorite.ferryTime && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Ship className="w-4 h-4" />
                <span>{favorite.ferryTime}</span>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(favorite.id);
            }}
            className="text-red-700 active:scale-95 transition-transform"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <span className="text-xs px-2 py-1 rounded-full self-start mt-auto bg-blue-100 text-blue-700">
          섬
        </span>
      </div>
    </div>
  );
}