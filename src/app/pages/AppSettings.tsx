import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Moon, Sun, Bell, Globe, Lock, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function AppSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    language: "ko",
    autoSync: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("appSettings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem("appSettings", JSON.stringify(newSettings));
    toast.success("설정이 저장됐어요");
  };

  const handleClearCache = () => {
    if (window.confirm("캐시를 삭제하시겠어요? 일부 데이터가 사라질 수 있어요.")) {
      // Clear specific cache items, not all localStorage
      const keysToKeep = ["user", "currentItineraryId", "appSettings"];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key) && !key.startsWith("itinerary_")) {
          localStorage.removeItem(key);
        }
      });
      toast.success("캐시가 삭제됐어요");
    }
  };

  const handleResetSettings = () => {
    if (window.confirm("모든 설정을 초기화하시겠어요?")) {
      const defaultSettings = {
        darkMode: false,
        notifications: true,
        language: "ko",
        autoSync: true,
      };
      setSettings(defaultSettings);
      localStorage.setItem("appSettings", JSON.stringify(defaultSettings));
      toast.success("설정이 초기화됐어요");
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-3 text-blue-100 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          <span className="text-sm">뒤로</span>
        </button>
        <h1 className="text-xl font-bold mb-1">앱 설정</h1>
        <p className="text-sm text-blue-100">앱 사용 환경을 설정하세요</p>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Display Settings */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2">화면 설정</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <SettingToggle
              icon={<Moon className="w-5 h-5" strokeWidth={2} />}
              label="다크 모드"
              description="어두운 화면으로 전환"
              checked={settings.darkMode}
              onChange={() => handleToggle("darkMode")}
            />
          </div>
        </div>

        {/* Notification Settings */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2">알림 설정</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <SettingToggle
              icon={<Bell className="w-5 h-5" strokeWidth={2} />}
              label="푸시 알림"
              description="여행 정보 및 알림 받기"
              checked={settings.notifications}
              onChange={() => handleToggle("notifications")}
              showDivider={false}
            />
          </div>
        </div>

        {/* Data Settings */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2">데이터 설정</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <SettingToggle
              icon={<RefreshCw className="w-5 h-5" strokeWidth={2} />}
              label="자동 동기화"
              description="여행 일정 자동 백업"
              checked={settings.autoSync}
              onChange={() => handleToggle("autoSync")}
              showDivider={false}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 px-2">고급 설정</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={handleClearCache}
              className="w-full px-4 py-4 flex items-center gap-3 text-left active:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="text-gray-500">
                <Trash2 className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">캐시 삭제</div>
                <div className="text-xs text-gray-500">임시 데이터 정리</div>
              </div>
            </button>
            <button
              onClick={handleResetSettings}
              className="w-full px-4 py-4 flex items-center gap-3 text-left active:bg-gray-50 transition-colors"
            >
              <div className="text-gray-500">
                <RefreshCw className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">설정 초기화</div>
                <div className="text-xs text-gray-500">모든 설정을 기본값으로</div>
              </div>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500 mb-1">인천 섬 여행</p>
          <p className="text-xs text-gray-400">버전 1.0.0</p>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({
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
    <div
      className={`px-4 py-4 flex items-center gap-3 ${
        showDivider ? "border-b border-gray-100" : ""
      }`}
    >
      <div className="text-gray-500">{icon}</div>
      <div className="flex-1">
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
            checked ? "right-0.5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
