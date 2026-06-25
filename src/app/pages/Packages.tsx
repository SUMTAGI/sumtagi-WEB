import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Clock, Users, DollarSign, Star, Ship, Hotel, Camera, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { generateItinerary, type TripFormData } from "../utils/itineraryGenerator";
import { Confetti } from "../components/Confetti";

interface Package {
  id: string;
  name: string;
  subtitle: string;
  islands: string[];
  duration: string;
  nights: number;
  days: number;
  minPeople: number;
  maxPeople: number;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  includes: string[];
  highlights: string[];
  departurePort: "인천항" | "대부도";
}

const PACKAGES: Package[] = [
  {
    id: "pkg1",
    name: "1박2일 덕적도 힐링",
    subtitle: "가까운 섬에서 힐링하는 주말여행",
    islands: ["덕적도"],
    duration: "1박 2일",
    nights: 1,
    days: 2,
    minPeople: 2,
    maxPeople: 4,
    price: 189000,
    image: "https://images.unsplash.com/photo-1662898069390-badabf2d65df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    rating: 4.8,
    reviewCount: 142,
    tags: ["힐링", "해변", "가족여행"],
    departurePort: "인천항",
    includes: [
      "왕복 여객선",
      "펜션 1박 (조식 포함)",
      "섬 투어 가이드",
      "여행자 보험"
    ],
    highlights: [
      "서포리 해수욕장 자유시간",
      "비조봉 정상 트레킹",
      "현지 맛집 투어",
      "일몰 포토 타임"
    ]
  },
  {
    id: "pkg2",
    name: "2박3일 백령도 완전정복",
    subtitle: "서해 최북단 섬의 모든 것",
    islands: ["백령도"],
    duration: "2박 3일",
    nights: 2,
    days: 3,
    minPeople: 2,
    maxPeople: 6,
    price: 459000,
    image: "https://images.unsplash.com/photo-1635355942488-a8bdb5a0803e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    rating: 4.9,
    reviewCount: 89,
    tags: ["자연경관", "사진", "트레킹"],
    departurePort: "인천항",
    includes: [
      "왕복 여객선",
      "리조트 2박 (조식 포함)",
      "전 일정 가이드 동행",
      "두무진 유람선",
      "여행자 보험"
    ],
    highlights: [
      "두무진 해안 절벽 투어",
      "사곶해변 천연비행장",
      "콩돌해변 석양",
      "심청각 등 역사 탐방"
    ]
  },
  {
    id: "pkg3",
    name: "1박2일 자월도 로맨틱",
    subtitle: "커플을 위한 낭만 여행",
    islands: ["자월도"],
    duration: "1박 2일",
    nights: 1,
    days: 2,
    minPeople: 2,
    maxPeople: 2,
    price: 249000,
    image: "https://images.unsplash.com/photo-1758327740342-4e705edea29b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    rating: 4.7,
    reviewCount: 156,
    tags: ["커플", "힐링", "일몰"],
    departurePort: "대부도",
    includes: [
      "왕복 여객선",
      "오션뷰 펜션 1박",
      "커플 석식 1회",
      "카약 체험",
      "여행자 보험"
    ],
    highlights: [
      "큰말해변 일몰 감상",
      "2인 카약 투어",
      "해변 캠핑 파이어",
      "별빛 사진 촬영"
    ]
  },
  {
    id: "pkg4",
    name: "2박3일 섬 호핑 투어",
    subtitle: "덕적도 + 자월도 + 이작도",
    islands: ["덕적도", "자월도", "이작도"],
    duration: "2박 3일",
    nights: 2,
    days: 3,
    minPeople: 4,
    maxPeople: 8,
    price: 389000,
    image: "https://images.unsplash.com/photo-1661488601431-e8257e864068?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    rating: 4.8,
    reviewCount: 78,
    tags: ["체험", "해변", "모험"],
    departurePort: "인천항",
    includes: [
      "왕복 여객선",
      "섬간 이동 선박",
      "숙박 2박 (조식 포함)",
      "전 일정 가이드",
      "여행자 보험"
    ],
    highlights: [
      "3개 섬 탐방",
      "섬마다 다른 숙소 체험",
      "해산물 BBQ",
      "갯벌 체험"
    ]
  },
  {
    id: "pkg5",
    name: "당일 영흥도 체험",
    subtitle: "가장 가까운 섬에서 즐기는 하루",
    islands: ["영흥도"],
    duration: "당일",
    nights: 0,
    days: 1,
    minPeople: 2,
    maxPeople: 10,
    price: 89000,
    image: "https://images.unsplash.com/photo-1628412071389-6e8f7a7a4e6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    rating: 4.5,
    reviewCount: 203,
    tags: ["당일", "가족", "체험"],
    departurePort: "인천항",
    includes: [
      "왕복 여객선",
      "섬 투어 가이드",
      "점심 식사",
      "갯벌 체험",
      "여행자 보험"
    ],
    highlights: [
      "십리포 해변",
      "갯벌 생물 채집",
      "현지 해산물 점심",
      "자전거 대여 (옵션)"
    ]
  },
  {
    id: "pkg6",
    name: "3박4일 대청도 & 소청도",
    subtitle: "서해의 숨은 보석을 찾아서",
    islands: ["대청도", "소청도"],
    duration: "3박 4일",
    nights: 3,
    days: 4,
    minPeople: 2,
    maxPeople: 6,
    price: 589000,
    image: "https://images.unsplash.com/photo-1700621496615-6ee6240503ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    rating: 4.9,
    reviewCount: 45,
    tags: ["자연", "사진", "프리미엄"],
    departurePort: "인천항",
    includes: [
      "왕복 여객선",
      "섬간 이동 선박",
      "리조트 3박 (조식 포함)",
      "전문 사진 가이드",
      "여행자 보험"
    ],
    highlights: [
      "옥죽동 모래사막",
      "농여해변 절벽",
      "분바위 일출",
      "등대 투어"
    ]
  }
];

export function Packages() {
  const navigate = useNavigate();
  const [durationFilter, setDurationFilter] = useState<"all" | "당일" | "1박" | "2박이상">("all");
  const [priceSort, setPriceSort] = useState<"none" | "low" | "high">("none");

  let filteredPackages = PACKAGES.filter(pkg => {
    if (durationFilter === "all") return true;
    if (durationFilter === "당일") return pkg.nights === 0;
    if (durationFilter === "1박") return pkg.nights === 1;
    if (durationFilter === "2박이상") return pkg.nights >= 2;
    return true;
  });

  if (priceSort === "low") {
    filteredPackages = [...filteredPackages].sort((a, b) => a.price - b.price);
  } else if (priceSort === "high") {
    filteredPackages = [...filteredPackages].sort((a, b) => b.price - a.price);
  }

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
        <h1 className="text-xl font-bold mb-1">패키지 상품</h1>
        <p className="text-sm text-blue-100">미리 준비된 완벽한 여행 코스</p>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">여행 기간</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { value: "all", label: "전체" },
              { value: "당일", label: "당일" },
              { value: "1박", label: "1박2일" },
              { value: "2박이상", label: "2박 이상" }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setDurationFilter(option.value as any)}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  durationFilter === option.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">가격순</p>
          <div className="flex gap-2">
            {[
              { value: "none", label: "기본순" },
              { value: "low", label: "낮은 가격" },
              { value: "high", label: "높은 가격" }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setPriceSort(option.value as any)}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                  priceSort === option.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Package List */}
      <div className="px-6 py-4">
        <div className="space-y-4">
          {filteredPackages.map(pkg => (
            <PackageCard key={pkg.id} package={pkg} />
          ))}
        </div>

        {filteredPackages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">검색 결과가 없어요</p>
            <button
              onClick={() => {
                setDurationFilter("all");
                setPriceSort("none");
              }}
              className="text-blue-600 font-semibold"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PackageCard({ package: pkg }: { package: Package }) {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);

  const handleBook = () => {
    // 패키지 정보를 바탕으로 일정 생성
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7); // 7일 후

    const endDate = new Date(tomorrow);
    endDate.setDate(endDate.getDate() + pkg.nights);

    const formData: TripFormData = {
      departurePort: pkg.departurePort,
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      travelers: pkg.minPeople,
      travelType: pkg.tags[0] === "힐링" ? "휴양" :
                  pkg.tags[0] === "자연경관" ? "관광" :
                  pkg.tags[0] === "체험" ? "체험" : "관광",
      islands: pkg.islands,
      budget: "보통",
    };

    const itinerary = generateItinerary(formData);
    const itineraryId = Date.now().toString();
    localStorage.setItem(`itinerary_${itineraryId}`, JSON.stringify(itinerary));
    localStorage.setItem('currentItineraryId', itineraryId);

    // 체크리스트 자동 생성 제안
    setTimeout(() => {
      const hasChecklist = localStorage.getItem("checklistItems");
      if (!hasChecklist || JSON.parse(hasChecklist).length === 0) {
        toast.success("체크리스트에서 준비물을 확인해보세요!", {
          duration: 3000,
        });
      }
    }, 2000);

    toast.success(`${pkg.name} 일정이 생성됐어요!`);
    setShowConfetti(true);
    setTimeout(() => {
      navigate(`/itinerary/${itineraryId}`);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Image */}
      <div className="relative h-48">
        <img
          src={pkg.image}
          alt={pkg.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Tags */}
        <div className="absolute top-3 left-3 flex gap-2">
          {pkg.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-xs font-medium text-gray-700">
              {tag}
            </span>
          ))}
        </div>

        {/* Rating */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" strokeWidth={2} />
          <span className="text-sm font-semibold text-gray-900">{pkg.rating}</span>
          <span className="text-xs text-gray-600">({pkg.reviewCount})</span>
        </div>

        {/* Title on Image */}
        <div className="absolute bottom-3 left-3 text-white">
          <h3 className="text-lg font-bold">{pkg.name}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-600 mb-3">{pkg.subtitle}</p>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <span className="text-gray-700">{pkg.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <span className="text-gray-700">{pkg.minPeople}~{pkg.maxPeople}명</span>
          </div>
          <div className="flex items-center gap-2">
            <Ship className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <span className="text-gray-700">{pkg.departurePort}</span>
          </div>
        </div>

        {/* Highlights */}
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-500 mb-2">하이라이트</div>
          <div className="space-y-1">
            {pkg.highlights.slice(0, 3).map((highlight, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-1 h-1 rounded-full bg-blue-600" />
                {highlight}
              </div>
            ))}
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div>
            <div className="text-xs text-gray-500">1인 기준</div>
            <div className="text-xl font-bold text-blue-600">{pkg.price.toLocaleString()}원</div>
          </div>
          <button
            onClick={handleBook}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 active:scale-95 transition-transform"
          >
            일정 생성
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
    </div>
  );
}
