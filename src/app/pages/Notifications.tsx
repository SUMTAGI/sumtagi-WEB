import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Bell, AlertTriangle, Ship, Users, Cloud, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { notificationService } from "../../lib/notificationService";

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

export function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    notificationService.getAll().then(data => setNotifications(data));
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success("모든 알림을 읽음으로 표시했어요");
  };

  const handleDelete = async (id: string) => {
    await notificationService.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("알림이 삭제됐어요");
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
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
      <div className="">
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
      className={`px-6 py-4 ${!notification.is_read ? "bg-blue-50/30" : "bg-white"}`}
      onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
    >
      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor()}`}>
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-semibold text-gray-900 ${!notification.is_read ? "font-bold" : ""}`}>
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
            {!notification.is_read && (
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
