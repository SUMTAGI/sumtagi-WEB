import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { User, Mail, Calendar, ChevronRight, Settings, Bell, HelpCircle, LogOut, Shield, CreditCard, MapPin, Heart, Gift, Users, Book, Ticket, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/useAuth";
import { supabase } from "../lib/supabase";
import { tripService } from "../../lib/tripService";

export function MyPage() {
  const navigate = useNavigate();
  const { user, displayName } = useAuth();
  const [tripCount, setTripCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    Promise.all([tripService.getTripCount(), tripService.getMyReviewCount()])
      .then(([t, r]) => { setTripCount(t); setReviewCount(r); });
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("로그아웃됐어요. 다음에 또 만나요!");
    navigate("/login");
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  if (!user) return null;

  const daysSinceJoin = Math.floor(
    (new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-gray-50">
      {/* Header with Background */}
      <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-8 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1691422066850-de273fe9008d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-blue-700/80"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-blue-600" strokeWidth={2} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white mb-1">{displayName}</h2>
              <p className="text-sm text-blue-100">{user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="가입일" value={`${daysSinceJoin}일전`} />
            <StatCard label="예약" value={`${tripCount}건`} />
            <StatCard label="리뷰" value={`${reviewCount}개`} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Account Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2">계정 정보</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <MenuItem
              icon={<User className="w-5 h-5" strokeWidth={2} />}
              label="프로필 수정"
              onClick={() => handleMenuClick("/profile-edit")}
            />
            <MenuItem
              icon={<Mail className="w-5 h-5" strokeWidth={2} />}
              label="이메일"
              value={user.email ?? ''}
              onClick={() => handleMenuClick("/profile-edit")}
            />
            <MenuItem
              icon={<Shield className="w-5 h-5" strokeWidth={2} />}
              label="비밀번호 변경"
              onClick={() => handleMenuClick("/profile-edit")}
              showDivider={false}
            />
          </div>
        </div>

        {/* Travel Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2">여행 관리</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <MenuItem
              icon={<Calendar className="w-5 h-5" strokeWidth={2} />}
              label="내 여행 일정"
              onClick={() => handleMenuClick("/travel")}
            />
            <MenuItem
              icon={<Users className="w-5 h-5" strokeWidth={2} />}
              label="그룹 여행"
              onClick={() => handleMenuClick("/group-trip")}
            />
            <MenuItem
              icon={<Book className="w-5 h-5" strokeWidth={2} />}
              label="여행 다이어리"
              onClick={() => handleMenuClick("/diary")}
            />
            <MenuItem
              icon={<Ticket className="w-5 h-5" strokeWidth={2} />}
              label="패키지 상품"
              onClick={() => handleMenuClick("/packages")}
            />
            <MenuItem
              icon={<CreditCard className="w-5 h-5" strokeWidth={2} />}
              label="경비 관리"
              onClick={() => handleMenuClick("/budget")}
            />
            <MenuItem
              icon={<Gift className="w-5 h-5" strokeWidth={2} />}
              label="쿠폰함"
              onClick={() => handleMenuClick("/coupons")}
            />
            <MenuItem
              icon={<MapPin className="w-5 h-5" strokeWidth={2} />}
              label="방문한 섬"
              onClick={() => handleMenuClick("/visited-islands")}
            />
            <MenuItem
              icon={<Heart className="w-5 h-5" strokeWidth={2} />}
              label="찜한 여행지"
              onClick={() => handleMenuClick("/favorites")}
              showDivider={false}
            />
          </div>
        </div>

        {/* Utilities Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2">편의 기능</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <MenuItem
              icon={<Clock className="w-5 h-5" strokeWidth={2} />}
              label="교통 시간표"
              onClick={() => handleMenuClick("/schedule")}
            />
            <MenuItem
              icon={<Calendar className="w-5 h-5" strokeWidth={2} />}
              label="이벤트 & 축제"
              onClick={() => handleMenuClick("/events")}
            />
            <MenuItem
              icon={<AlertCircle className="w-5 h-5" strokeWidth={2} />}
              label="긴급 연락처"
              onClick={() => handleMenuClick("/emergency")}
              showDivider={false}
            />
          </div>
        </div>

        {/* Settings Section */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2">설정</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <MenuItem
              icon={<Bell className="w-5 h-5" strokeWidth={2} />}
              label="알림 설정"
              onClick={() => handleMenuClick("/notification-settings")}
            />
            <MenuItem
              icon={<Settings className="w-5 h-5" strokeWidth={2} />}
              label="앱 설정"
              onClick={() => handleMenuClick("/app-settings")}
            />
            <MenuItem
              icon={<HelpCircle className="w-5 h-5" strokeWidth={2} />}
              label="고객센터"
              onClick={() => handleMenuClick("/support")}
              showDivider={false}
            />
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-4 flex items-center justify-center gap-2 text-red-700 font-medium active:scale-95 transition-transform"
        >
          <LogOut className="w-5 h-5" strokeWidth={2} />
          로그아웃
        </button>

        <div className="text-center mt-6 mb-4">
          <p className="text-xs text-gray-500">버전 1.0.0</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
      <p className="text-xs text-blue-100 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  value,
  onClick,
  showDivider = true
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
  showDivider?: boolean;
}) {
  return (
    <>
      <button
        onClick={onClick}
        className={`w-full px-4 py-4 flex items-center gap-3 text-left active:bg-gray-50 transition-colors ${
          !showDivider ? "" : "border-b border-gray-100"
        }`}
      >
        <div className="text-gray-500">{icon}</div>
        <span className="flex-1 font-medium text-gray-900">{label}</span>
        {value ? (
          <span className="text-sm text-gray-500">{value}</span>
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" strokeWidth={2} />
        )}
      </button>
    </>
  );
}
