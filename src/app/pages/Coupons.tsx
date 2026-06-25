import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Gift, Hotel, UtensilsCrossed, Camera, Download, Clock } from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  title: string;
  category: "숙박" | "맛집" | "체험" | "교통";
  discount: string;
  description: string;
  island: string;
  expiryDate: string;
  minAmount?: number;
  isDownloaded: boolean;
  code: string;
}

const COUPONS: Coupon[] = [
  {
    id: "c1",
    title: "백령리조트 20% 할인",
    category: "숙박",
    discount: "20%",
    description: "1박 이상 예약 시 20% 할인",
    island: "백령도",
    expiryDate: "2026-12-31",
    minAmount: 100000,
    isDownloaded: false,
    code: "BAEK20"
  },
  {
    id: "c2",
    title: "덕적펜션 얼리버드",
    category: "숙박",
    discount: "15%",
    description: "30일 전 예약 시 15% 할인",
    island: "덕적도",
    expiryDate: "2026-11-30",
    minAmount: 80000,
    isDownloaded: false,
    code: "EARLY15"
  },
  {
    id: "c3",
    title: "백령횟집 10,000원 할인",
    category: "맛집",
    discount: "10,000원",
    description: "5만원 이상 주문 시",
    island: "백령도",
    expiryDate: "2026-10-31",
    minAmount: 50000,
    isDownloaded: false,
    code: "FISH10K"
  },
  {
    id: "c4",
    title: "덕적맛집 무료 음료",
    category: "맛집",
    discount: "음료 1잔",
    description: "회 주문 시 음료 1잔 무료",
    island: "덕적도",
    expiryDate: "2026-09-30",
    isDownloaded: false,
    code: "DRINK1"
  },
  {
    id: "c5",
    title: "카약 체험 30% 할인",
    category: "체험",
    discount: "30%",
    description: "자월도 카약 투어",
    island: "자월도",
    expiryDate: "2026-08-31",
    minAmount: 40000,
    isDownloaded: false,
    code: "KAYAK30"
  },
  {
    id: "c6",
    title: "갯벌체험 20% 할인",
    category: "체험",
    discount: "20%",
    description: "가족 단위 예약 시",
    island: "덕적도",
    expiryDate: "2026-07-31",
    minAmount: 30000,
    isDownloaded: false,
    code: "MUD20"
  },
  {
    id: "c7",
    title: "여객선 왕복 5% 할인",
    category: "교통",
    discount: "5%",
    description: "왕복 티켓 구매 시",
    island: "전체",
    expiryDate: "2026-12-31",
    minAmount: 40000,
    isDownloaded: false,
    code: "ROUND5"
  },
  {
    id: "c8",
    title: "자전거 대여 무료",
    category: "교통",
    discount: "무료 (4시간)",
    description: "전동스쿠터 대여 시",
    island: "영흥도",
    expiryDate: "2026-10-31",
    isDownloaded: false,
    code: "BIKE4H"
  },
];

export function Coupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState(COUPONS);
  const [categoryFilter, setCategoryFilter] = useState<"all" | Coupon["category"]>("all");
  const [activeTab, setActiveTab] = useState<"available" | "downloaded">("available");

  const downloadCoupon = (id: string) => {
    setCoupons(coupons.map(coupon =>
      coupon.id === id ? { ...coupon, isDownloaded: true } : coupon
    ));
    toast.success("쿠폰이 다운로드됐어요!");
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    toast.success("쿠폰 코드가 복사됐어요");
  };

  const filteredCoupons = coupons.filter(coupon => {
    const categoryMatch = categoryFilter === "all" || coupon.category === categoryFilter;
    const tabMatch = activeTab === "available" ? !coupon.isDownloaded : coupon.isDownloaded;
    return categoryMatch && tabMatch;
  });

  const getCategoryIcon = (category: Coupon["category"]) => {
    const icons = {
      숙박: <Hotel className="w-5 h-5" strokeWidth={2} />,
      맛집: <UtensilsCrossed className="w-5 h-5" strokeWidth={2} />,
      체험: <Camera className="w-5 h-5" strokeWidth={2} />,
      교통: <Gift className="w-5 h-5" strokeWidth={2} />,
    };
    return icons[category];
  };

  const getCategoryColor = (category: Coupon["category"]) => {
    const colors = {
      숙박: "from-blue-400 to-blue-500",
      맛집: "from-blue-500 to-blue-600",
      체험: "from-blue-600 to-blue-700",
      교통: "from-blue-500 to-blue-600",
    };
    return colors[category];
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-3 text-blue-100 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          <span className="text-sm">뒤로</span>
        </button>
        <h1 className="text-xl font-bold mb-1">쿠폰</h1>
        <p className="text-sm text-blue-100">특별 할인과 혜택을 받으세요</p>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex gap-2">
        <button
          onClick={() => setActiveTab("available")}
          className={`flex-1 py-2 rounded-lg font-medium transition-all ${
            activeTab === "available"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          받을 수 있는 쿠폰
        </button>
        <button
          onClick={() => setActiveTab("downloaded")}
          className={`flex-1 py-2 rounded-lg font-medium transition-all ${
            activeTab === "downloaded"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          내 쿠폰함
        </button>
      </div>

      {/* Category Filter */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["all", "숙박", "맛집", "체험", "교통"] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200"
              }`}
            >
              {cat === "all" ? "전체" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons List */}
      <div className="px-6 py-4">
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
            <p className="text-gray-500 mb-2">
              {activeTab === "available" ? "사용 가능한 쿠폰이 없어요" : "다운로드한 쿠폰이 없어요"}
            </p>
            <p className="text-sm text-gray-400">
              {activeTab === "available" ? "다른 카테고리를 선택해보세요" : "받을 수 있는 쿠폰을 확인해보세요"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCoupons.map(coupon => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onDownload={downloadCoupon}
                onCopyCode={copyCouponCode}
                daysUntilExpiry={getDaysUntilExpiry(coupon.expiryDate)}
                getCategoryIcon={getCategoryIcon}
                getCategoryColor={getCategoryColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CouponCard({
  coupon,
  onDownload,
  onCopyCode,
  daysUntilExpiry,
  getCategoryIcon,
  getCategoryColor
}: {
  coupon: Coupon;
  onDownload: (id: string) => void;
  onCopyCode: (code: string) => void;
  daysUntilExpiry: number;
  getCategoryIcon: (category: Coupon["category"]) => React.ReactNode;
  getCategoryColor: (category: Coupon["category"]) => string;
}) {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 overflow-hidden relative">
      {/* Gradient Background */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getCategoryColor(coupon.category)} opacity-10 rounded-full -mr-16 -mt-16`}></div>

      <div className="p-4 relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getCategoryColor(coupon.category)} flex items-center justify-center text-white`}>
              {getCategoryIcon(coupon.category)}
            </div>
            <div>
              <div className="font-bold text-gray-900 mb-1">{coupon.title}</div>
              <div className="text-xs text-gray-500 mb-1">{coupon.island}</div>
              <div className="text-sm text-gray-600">{coupon.description}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{coupon.discount}</div>
            <div className="text-xs text-gray-500">할인</div>
          </div>
        </div>

        {/* Min Amount */}
        {coupon.minAmount && (
          <div className="text-xs text-gray-500 mb-3">
            {coupon.minAmount.toLocaleString()}원 이상 구매 시
          </div>
        )}

        {/* Expiry & Code */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" strokeWidth={2} />
            <span>
              {daysUntilExpiry > 0 ? `${daysUntilExpiry}일 남음` : "기간 만료"}
            </span>
          </div>
          {coupon.isDownloaded && (
            <button
              onClick={() => onCopyCode(coupon.code)}
              className="text-xs font-semibold text-blue-600 px-2 py-1 bg-blue-50 rounded"
            >
              {coupon.code}
            </button>
          )}
        </div>

        {/* Action Button */}
        {!coupon.isDownloaded ? (
          <button
            onClick={() => onDownload(coupon.id)}
            disabled={daysUntilExpiry <= 0}
            className={`w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-transform ${
              daysUntilExpiry > 0
                ? "bg-blue-600 text-white active:scale-95"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Download className="w-4 h-4" strokeWidth={2} />
            쿠폰 받기
          </button>
        ) : (
          <div className="w-full py-2.5 bg-gray-100 rounded-lg font-semibold text-center text-gray-700">
            보유 중인 쿠폰
          </div>
        )}
      </div>
    </div>
  );
}
