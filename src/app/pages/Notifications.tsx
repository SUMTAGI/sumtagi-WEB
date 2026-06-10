import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Bell, AlertTriangle, Ship, Users, Cloud, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "congestion" | "ferry" | "weather" | "booking";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  severity: "info" | "warning" | "critical";
  relatedBooking?: {
    id: string;
    destination: string;
    date: string;
  };
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "congestion",
    title: "백령도 혼잡도 증가",
    message: "내일 방문 예정인 백령도의 혼잡도가 '보통'에서 '혼잡'으로 변경됐어요. 이른 시간에 방문하시면 더 여유롭게 즐기실 수 있어요.",
    time: "10분 전",
    isRead: false,
    severity: "warning",
    relatedBooking: {
      id: "book-1",
      destination: "백령도",
      date: "2026-05-25",
    },
  },
  {
    id: "2",
    type: "ferry",
    title: "덕적도행 여객선 지연",
    message: "덕적도행 14:00 출발 여객선이 기상 악화로 30분 지연 출발 예정이에요.",
    time: "1시간 전",
    isRead: false,
    severity: "critical",
    relatedBooking: {
      id: "book-2",
      destination: "덕적도",
      date: "2026-05-24",
    },
  },
  {
    id: "3",
    type: "weather",
    title: "영흥도 소나기 예보",
    message: "영흥도 여행 당일(5/26) 오후에 소나기 예보가 있어요. 우산 챙기는 거 잊지 마세요!",
    time: "3시간 전",
    isRead: false,
    severity: "info",
    relatedBooking: {
      id: "book-3",
      destination: "영흥도",
      date: "2026-05-26",
    },
  },
  {
    id: "4",
    type: "booking",
    title: "자월도 예약 완료",
    message: "자월도 여행 예약이 확정됐어요! 출발 1시간 전까지 선착장에 도착해주세요.",
    time: "5시간 전",
    isRead: true,
    severity: "info",
    relatedBooking: {
      id: "book-4",
      destination: "자월도",
      date: "2026-05-30",
    },
  },
  {
    id: "5",
    type: "ferry",
    title: "대청도행 운항 정상화",
    message: "대청도행 여객선 운항이 정상화됐어요.",
    time: "1일 전",
    isRead: true,
    severity: "info",
    relatedBooking: {
      id: "book-5",
      destination: "대청도",
      date: "2026-05-23",
    },
  },
];

export function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("notifications");
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.setItem("notifications", JSON.stringify(INITIAL_NOTIFICATIONS));
    }
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem("notifications", JSON.stringify(notifications));
    }
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success("모든 알림을 읽음으로 표시했어요");
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("알림이 삭제됐어요");
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">알림</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-500">읽지 않은 알림 {unreadCount}개</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 font-medium"
          >
            모두 읽음
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-12 px-6">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              알림이 없해요
            </h3>
            <p className="text-sm text-gray-600">
              새로운 알림이 오면 여기에 표시돼요
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case "congestion":
        return <Users className="w-5 h-5" strokeWidth={2} />;
      case "ferry":
        return <Ship className="w-5 h-5" strokeWidth={2} />;
      case "weather":
        return <Cloud className="w-5 h-5" strokeWidth={2} />;
      case "booking":
        return <CheckCircle className="w-5 h-5" strokeWidth={2} />;
    }
  };

  const getIconColor = () => {
    switch (notification.severity) {
      case "critical":
        return "text-red-700 bg-red-50";
      case "warning":
        return "text-orange-600 bg-orange-50";
      case "info":
        return "text-blue-600 bg-blue-50";
    }
  };

  return (
    <div
      className={`px-6 py-4 ${!notification.isRead ? "bg-blue-50/30" : "bg-white"}`}
      onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
    >
      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor()}`}>
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-semibold text-gray-900 ${!notification.isRead ? "font-bold" : ""}`}>
              {notification.title}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="text-gray-400 hover:text-gray-600 active:scale-95 transition-transform"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          <p className="text-sm text-gray-700 mb-2 leading-relaxed">
            {notification.message}
          </p>

          {notification.relatedBooking && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full text-gray-700">
                {notification.relatedBooking.destination}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(notification.relatedBooking.date).toLocaleDateString('ko-KR')}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{notification.time}</span>
            {!notification.isRead && (
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
