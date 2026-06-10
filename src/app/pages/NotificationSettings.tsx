import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Bell, Ship, Calendar, MessageSquare, Smartphone } from "lucide-react";
import { toast } from "sonner";

export function NotificationSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    pushEnabled: true,
    bookingReminder: true,
    ferryStatus: true,
    weatherAlert: true,
    promotions: false,
    smsEnabled: true,
    emailEnabled: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast.success("알림 설정이 변경됐어요");
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
        <h1 className="text-lg font-bold text-gray-900">알림 설정</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Push Notifications */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">푸시 알림</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <SettingItem
              icon={<Bell className="w-5 h-5" strokeWidth={2} />}
              label="푸시 알림"
              description="전체 푸시 알림 받기"
              checked={settings.pushEnabled}
              onChange={() => handleToggle('pushEnabled')}
            />
            <SettingItem
              icon={<Calendar className="w-5 h-5" strokeWidth={2} />}
              label="예약 알림"
              description="예약 확정 및 변경 알림"
              checked={settings.bookingReminder}
              onChange={() => handleToggle('bookingReminder')}
              showDivider
            />
            <SettingItem
              icon={<Ship className="w-5 h-5" strokeWidth={2} />}
              label="운항 상태"
              description="여객선 운항 정보 및 변경사항"
              checked={settings.ferryStatus}
              onChange={() => handleToggle('ferryStatus')}
              showDivider
            />
            <SettingItem
              icon={<MessageSquare className="w-5 h-5" strokeWidth={2} />}
              label="날씨 알림"
              description="기상 특보 및 주의보"
              checked={settings.weatherAlert}
              onChange={() => handleToggle('weatherAlert')}
              showDivider
            />
            <SettingItem
              icon={<Bell className="w-5 h-5" strokeWidth={2} />}
              label="마케팅 정보"
              description="이벤트 및 프로모션 알림"
              checked={settings.promotions}
              onChange={() => handleToggle('promotions')}
              showDivider={false}
            />
          </div>
        </div>

        {/* Other Channels */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 px-2">기타 알림</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <SettingItem
              icon={<Smartphone className="w-5 h-5" strokeWidth={2} />}
              label="SMS 알림"
              description="중요 정보 문자 메시지 받기"
              checked={settings.smsEnabled}
              onChange={() => handleToggle('smsEnabled')}
              showDivider
            />
            <SettingItem
              icon={<MessageSquare className="w-5 h-5" strokeWidth={2} />}
              label="이메일 알림"
              description="예약 확인서 및 안내 이메일"
              checked={settings.emailEnabled}
              onChange={() => handleToggle('emailEnabled')}
              showDivider={false}
            />
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <h4 className="font-semibold text-blue-900 mb-2 text-sm">💡 알림 안내</h4>
          <ul className="space-y-1 text-xs text-blue-800">
            <li>• 예약 관련 알림은 중요한 정보니까 켜두시는 걸 추천해요</li>
            <li>• 날씨 알림은 여행 일정 3일 전부터 보내드려요</li>
            <li>• 마케팅 알림은 언제든지 설정을 변경할 수 있어요</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function SettingItem({
  icon,
  label,
  description,
  checked,
  onChange,
  showDivider = true
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  showDivider?: boolean;
}) {
  return (
    <div className={`px-4 py-4 ${showDivider ? "border-b border-gray-100" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="text-gray-500">{icon}</div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 text-sm">{label}</h3>
          <p className="text-xs text-gray-600 mt-0.5">{description}</p>
        </div>
        <label className="relative inline-block w-11 h-6 flex-shrink-0">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="opacity-0 w-0 h-0 peer"
          />
          <span className={`absolute inset-0 rounded-full transition-colors cursor-pointer ${
            checked ? "bg-blue-600" : "bg-gray-300"
          }`}>
            <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              checked ? "translate-x-5" : ""
            }`} />
          </span>
        </label>
      </div>
    </div>
  );
}
