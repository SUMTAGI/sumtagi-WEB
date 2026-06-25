import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Users, ChevronLeft, Calendar, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { groupTripService } from "../../lib/groupTripService";
import type { GroupTripData } from "../../lib/groupTripService";

export function GroupJoin() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupTripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!code) { setLoading(false); return; }
    groupTripService.getGroupByInviteCode(code).then(data => {
      setGroup(data);
      setLoading(false);
    });
  }, [code]);

  const handleJoin = async () => {
    if (!group) return;
    setJoining(true);
    const ok = await groupTripService.joinGroup(group.id);
    setJoining(false);
    if (!ok) {
      toast.error("참여에 실패했어요. 다시 시도해주세요");
      return;
    }
    toast.success(`${group.name} 그룹에 참여했어요!`);
    navigate("/group-trip");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">그룹 초대</h1>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        {!group ? (
          <div className="text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
            <p className="text-gray-700 font-semibold mb-2">초대 링크를 찾을 수 없어요</p>
            <p className="text-sm text-gray-500 mb-6">링크가 만료됐거나 잘못된 코드예요</p>
            <button
              onClick={() => navigate("/group-trip")}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium active:scale-95 transition-transform"
            >
              그룹 여행으로 가기
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-blue-600" strokeWidth={2} />
              </div>
              <p className="text-sm text-gray-500 mb-1">그룹 여행 초대</p>
              <h2 className="text-2xl font-bold text-gray-900">{group.name}</h2>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <MapPin className="w-4 h-4 text-blue-500" strokeWidth={2} />
                <span>{group.destination.join(", ")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-blue-500" strokeWidth={2} />
                <span>
                  {new Date(group.startDate).toLocaleDateString("ko-KR")} -{" "}
                  {new Date(group.endDate).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Users className="w-4 h-4 text-blue-500" strokeWidth={2} />
                <span>현재 참여자 {group.members.length}명</span>
              </div>
            </div>

            {group.members.length > 0 && (
              <div className="flex gap-2 mb-6 justify-center">
                {group.members.slice(0, 5).map(m => (
                  <img
                    key={m.id}
                    src={m.avatar}
                    alt={m.name}
                    className="w-10 h-10 rounded-full border-2 border-white shadow"
                  />
                ))}
                {group.members.length > 5 && (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium border-2 border-white shadow">
                    +{group.members.length - 5}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {joining && <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2} />}
              그룹 참여하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
