import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Ship, Hotel, Calendar, MapPin, CheckCircle, XCircle, AlertCircle, Trash2, ChevronRight, Camera, Users } from "lucide-react";
import type { Activity } from "../utils/itineraryGenerator";
import { toast } from "sonner";

interface ItineraryBooking {
  id: string;
  itineraryId: string;
  activity: Activity;
  bookedAt: string;
  status: "confirmed" | "cancelled" | "pending";
}

interface ExperienceBooking {
  id: string;
  experienceId: string;
  experience: string;
  island: string;
  date: string;
  people: number;
  price: number;
  status: "confirmed" | "cancelled";
  bookedAt: string;
}

type Booking = ItineraryBooking | ExperienceBooking;

const isExperienceBooking = (booking: Booking): booking is ExperienceBooking => {
  return 'experienceId' in booking;
};

const isItineraryBooking = (booking: Booking): booking is ItineraryBooking => {
  return 'itineraryId' in booking;
};

export function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | "confirmed" | "cancelled">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "itinerary" | "experience">("all");

  const handleCancelBooking = (bookingId: string) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "cancelled" as const } : b));
    toast.success("예약이 취소됐어요");
  };

  const handleDeleteBooking = (bookingId: string) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    toast.success("예약 내역이 삭제됐어요");
  };

  const filteredBookings = bookings.filter(booking => {
    const statusMatch = filter === "all" || booking.status === filter;
    const typeMatch = typeFilter === "all" ||
      (typeFilter === "itinerary" && isItineraryBooking(booking)) ||
      (typeFilter === "experience" && isExperienceBooking(booking));
    return statusMatch && typeMatch;
  });

  const totalCost = bookings
    .filter(b => b.status === "confirmed")
    .reduce((sum, booking) => {
      if (isItineraryBooking(booking)) {
        return sum + (booking.activity.price || 0);
      } else {
        return sum + booking.price;
      }
    }, 0);

  const confirmedCount = bookings.filter(b => b.status === "confirmed").length;
  const cancelledCount = bookings.filter(b => b.status === "cancelled").length;

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <h1 className="text-xl font-bold mb-1">예약 관리</h1>
        <p className="text-sm text-blue-100">모든 예약 내역을 확인하세요</p>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="grid grid-cols-3 gap-3">
          <StatCardMobile
            icon={<CheckCircle className="w-5 h-5" strokeWidth={2} />}
            label="확정"
            value={confirmedCount}
            color="green"
          />
          <StatCardMobile
            icon={<XCircle className="w-5 h-5" strokeWidth={2} />}
            label="취소"
            value={cancelledCount}
            color="red"
          />
          <StatCardMobile
            icon={<Ship className="w-5 h-5" strokeWidth={2} />}
            label="총 금액"
            value={`${Math.floor(totalCost / 10000)}만원`}
            color="blue"
          />
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white px-6 py-3 border-b border-gray-200">
        <div className="mb-2">
          <div className="text-xs font-semibold text-gray-500 mb-2">예약 상태</div>
          <div className="flex gap-2">
            <FilterButtonMobile
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label="전체"
            />
            <FilterButtonMobile
              active={filter === "confirmed"}
              onClick={() => setFilter("confirmed")}
              label="확정"
            />
            <FilterButtonMobile
              active={filter === "cancelled"}
              onClick={() => setFilter("cancelled")}
              label="취소"
            />
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">예약 유형</div>
          <div className="flex gap-2">
            <FilterButtonMobile
              active={typeFilter === "all"}
              onClick={() => setTypeFilter("all")}
              label="전체"
            />
            <FilterButtonMobile
              active={typeFilter === "itinerary"}
              onClick={() => setTypeFilter("itinerary")}
              label="일정"
            />
            <FilterButtonMobile
              active={typeFilter === "experience"}
              onClick={() => setTypeFilter("experience")}
              label="체험"
            />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="">
        {filteredBookings.length === 0 ? (
          <div className="items-center justify-center px-6 py-12">
            <Ship className="w-16 h-16 text-gray-300 mb-4" strokeWidth={2} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">예약 내역이 없어요</h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              여행 일정을 생성하고 원하는 항목을 예약해보세요
            </p>
            <Link
              to="/plan"
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium active:scale-95 transition-transform flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" strokeWidth={2} />
              일정 생성하기
            </Link>
          </div>
        ) : (
          <div className="px-6 py-4 space-y-3">
            {filteredBookings.map((booking) => (
              <BookingCardMobile
                key={booking.id}
                booking={booking}
                onCancel={handleCancelBooking}
                onDelete={handleDeleteBooking}
              />
            ))}

            {/* Notice */}
            <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">📋 예약 안내</h4>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• 여객선: 출발 2시간 전까지 취소 가능</li>
                <li>• 숙박: 체크인 3일 전까지 무료 취소</li>
                <li>• 기상 악화 시 자동 환불 처리</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCardMobile({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: "green" | "red" | "blue";
}) {
  const colors = {
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-600",
  };

  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className={`${colors[color]} w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function FilterButtonMobile({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all ${
        active
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-700 active:scale-95"
      }`}
    >
      {label}
    </button>
  );
}

function BookingCardMobile({
  booking,
  onCancel,
  onDelete
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const isExperience = isExperienceBooking(booking);

  const getIcon = () => {
    if (isExperience) {
      return <Camera className="w-5 h-5" strokeWidth={2} />;
    }
    switch (booking.activity.type) {
      case "ferry": return <Ship className="w-5 h-5" strokeWidth={2} />;
      case "accommodation": return <Hotel className="w-5 h-5" strokeWidth={2} />;
      default: return null;
    }
  };

  const getStatusBadge = () => {
    const config = {
      confirmed: { label: "확정", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3" strokeWidth={2} /> },
      pending: { label: "대기", color: "bg-yellow-100 text-yellow-700", icon: <AlertCircle className="w-3 h-3" strokeWidth={2} /> },
      cancelled: { label: "취소", color: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3" strokeWidth={2} /> },
    };

    const { label, color, icon } = config[booking.status];
    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {icon}
        {label}
      </span>
    );
  };

  const getTypeColor = () => {
    if (isExperience) {
      return "bg-green-100 text-green-600";
    }
    switch (booking.activity.type) {
      case "ferry": return "bg-blue-100 text-blue-600";
      case "accommodation": return "bg-blue-100 text-blue-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full ${getTypeColor()} flex items-center justify-center`}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {isExperience ? booking.experience : booking.activity.title}
              </h3>
              {getStatusBadge()}
            </div>
            {!isExperience && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{booking.activity.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" strokeWidth={2} />
                {isExperience ? booking.island : booking.activity.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" strokeWidth={2} />
                {isExperience ? new Date(booking.date).toLocaleDateString('ko-KR') : booking.activity.time}
              </span>
              {isExperience && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" strokeWidth={2} />
                  {booking.people}명
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-lg font-bold text-gray-900">
            {(isExperience ? booking.price : booking.activity.price)?.toLocaleString()}원
          </span>
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-sm text-blue-600 font-medium active:scale-95 transition-transform flex items-center gap-1"
          >
            {showActions ? "닫기" : "관리"}
            <ChevronRight className={`w-4 h-4 transition-transform ${showActions ? "rotate-90" : ""}`} />
          </button>
        </div>

        {showActions && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
            {booking.status === "confirmed" && (
              <button
                onClick={() => {
                  onCancel(booking.id);
                  setShowActions(false);
                }}
                className="flex-1 px-3 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-medium active:scale-95 transition-transform flex items-center justify-center gap-1"
              >
                <XCircle className="w-4 h-4" strokeWidth={2} />
                취소
              </button>
            )}
            <button
              onClick={() => {
                onDelete(booking.id);
                setShowActions(false);
              }}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium active:scale-95 transition-transform flex items-center justify-center gap-1"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2} />
              삭제
            </button>
            {!isExperience && (
              <Link
                to={`/itinerary/${booking.itineraryId}`}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform flex items-center justify-center"
              >
                일정 보기
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
