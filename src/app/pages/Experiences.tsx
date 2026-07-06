import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { ChevronLeft, Users, Clock, MapPin, Star, Calendar, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Confetti } from "../components/Confetti";
import { budgetService } from "../../lib/budgetService";

interface Experience {
  id: string;
  name: string;
  island: string;
  category: "낚시" | "갯벌체험" | "카약" | "스노클링" | "자전거" | "트레킹";
  duration: string;
  price: number;
  maxPeople: number;
  rating: number;
  reviewCount: number;
  image: string;
  description: string;
  included: string[];
  schedule: string[];
}

const EXPERIENCES: Experience[] = [
  {
    id: "exp1",
    name: "백령도 바다낚시 체험",
    island: "백령도",
    category: "낚시",
    duration: "4시간",
    price: 50000,
    maxPeople: 10,
    rating: 4.8,
    reviewCount: 124,
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    description: "백령도 주변 청정 해역에서 즐기는 바다낚시",
    included: ["낚시 장비 제공", "미끼 제공", "조과물 손질"],
    schedule: ["집결 및 출항", "낚시 포인트 이동", "낚시 체험", "귀항 및 조과물 손질"],
  },
  {
    id: "exp2",
    name: "덕적도 갯벌 체험",
    island: "덕적도",
    category: "갯벌체험",
    duration: "2시간",
    price: 25000,
    maxPeople: 20,
    rating: 4.6,
    reviewCount: 89,
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    description: "조개, 게, 낙지를 직접 잡아보는 갯벌 체험",
    included: ["장비 대여", "안전 교육", "체험 지도"],
    schedule: ["갯벌 이동", "안전 교육", "갯벌 생물 채집", "세척 및 마무리"],
  },
  {
    id: "exp3",
    name: "자월도 카약 투어",
    island: "자월도",
    category: "카약",
    duration: "3시간",
    price: 45000,
    maxPeople: 8,
    rating: 4.9,
    reviewCount: 156,
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    description: "에메랄드빛 바다를 가로지르는 카약 체험",
    included: ["카약 및 장비", "구명조끼", "가이드 동행", "사진 촬영"],
    schedule: ["안전 교육", "카약 기초 연습", "해안선 투어", "자유 시간"],
  },
  {
    id: "exp4",
    name: "덕적도 자전거 일주",
    island: "덕적도",
    category: "자전거",
    duration: "5시간",
    price: 35000,
    maxPeople: 15,
    rating: 4.7,
    reviewCount: 92,
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    description: "덕적도의 숨은 명소를 자전거로 돌아보는 투어",
    included: ["자전거 대여", "헬멧 제공", "가이드 동행", "간식"],
    schedule: ["출발 및 안전 교육", "해안도로", "비조봉 전망대", "서포리 해변", "귀환"],
  },
  {
    id: "exp5",
    name: "백령도 트레킹",
    island: "백령도",
    category: "트레킹",
    duration: "4시간",
    price: 30000,
    maxPeople: 12,
    rating: 4.8,
    reviewCount: 78,
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    description: "두무진 절벽과 사곶해변을 연결하는 트레킹 코스",
    included: ["가이드 동행", "트레킹 스틱", "생수", "간식"],
    schedule: ["집결 및 출발", "두무진 전망", "해안 트레킹", "사곶해변", "귀환"],
  },
  {
    id: "exp6",
    name: "자월도 스노클링",
    island: "자월도",
    category: "스노클링",
    duration: "2.5시간",
    price: 40000,
    maxPeople: 10,
    rating: 4.9,
    reviewCount: 134,
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    description: "맑은 물에서 즐기는 스노클링 체험",
    included: ["스노클링 장비", "구명조끼", "수중 사진", "샤워 시설"],
    schedule: ["장비 착용", "안전 교육", "스노클링", "자유 시간", "샤워 및 마무리"],
  },
];

export function Experiences() {
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<"all" | Experience["category"]>("all");
  const [islandFilter, setIslandFilter] = useState<"all" | string>("all");

  const filteredExperiences = EXPERIENCES.filter(exp => {
    const categoryMatch = categoryFilter === "all" || exp.category === categoryFilter;
    const islandMatch = islandFilter === "all" || exp.island === islandFilter;
    return categoryMatch && islandMatch;
  });

  const islands = ["all", ...Array.from(new Set(EXPERIENCES.map(e => e.island)))];
  const categories: ("all" | Experience["category"])[] = ["all", "낚시", "갯벌체험", "카약", "스노클링", "자전거", "트레킹"];

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">체험 프로그램</h1>
          <p className="text-xs text-gray-500">특별한 섬 체험을 예약하세요</p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 space-y-3">
        {/* Island Filter */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">섬</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {islands.map((island) => (
              <button
                key={island}
                onClick={() => setIslandFilter(island)}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  islandFilter === island
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200"
                }`}
              >
                {island === "all" ? "전체" : island}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">카테고리</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
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
      </div>

      {/* Experiences List */}
      <div className="px-6 py-4">
        <div className="space-y-4">
          {filteredExperiences.map((exp) => (
            <Link
              key={exp.id}
              to={`/experience/${exp.id}`}
              className="block bg-white rounded-xl border border-gray-200 overflow-hidden active:scale-98 transition-transform"
            >
              <div className="flex gap-4 p-4">
                <img
                  src={exp.image}
                  alt={exp.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{exp.name}</h3>
                    <div className="flex items-center gap-1 ml-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" strokeWidth={2} />
                      <span className="text-sm font-semibold text-gray-700">{exp.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {exp.category}
                    </span>
                    <span className="text-xs text-gray-500">{exp.island}</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">{exp.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" strokeWidth={2} />
                        <span>{exp.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" strokeWidth={2} />
                        <span>최대 {exp.maxPeople}명</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {exp.price.toLocaleString()}원
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredExperiences.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">검색 결과가 없어요</p>
            <button
              onClick={() => {
                setCategoryFilter("all");
                setIslandFilter("all");
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

export function ExperienceDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPeople, setSelectedPeople] = useState(2);
  const [showConfetti, setShowConfetti] = useState(false);

  const experience = EXPERIENCES.find((exp) => exp.id === id) ?? EXPERIENCES[0];

  const handleBook = async () => {
    if (!selectedDate) {
      toast.error("날짜를 선택해주세요");
      return;
    }

    const booking = {
      id: `booking-${Date.now()}`,
      experienceId: experience.id,
      experience: experience.name,
      island: experience.island,
      date: selectedDate,
      people: selectedPeople,
      price: experience.price * selectedPeople,
      status: "confirmed",
      bookedAt: new Date().toISOString(),
    };

    const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
    bookings.push(booking);
    localStorage.setItem("bookings", JSON.stringify(bookings));

    // 경비에도 자동으로 추가 (실제 가계부 데이터에 반영되도록 Supabase에 저장)
    await budgetService.addExpense(
      "체험",
      experience.price * selectedPeople,
      `${experience.name} (${selectedPeople}명)`
    );

    toast.success("체험 예약 및 경비가 추가됐어요!");
    setShowConfetti(true);
    setTimeout(() => {
      navigate("/travel");
    }, 2000);
  };

  return (
    <div className="bg-white">
      {/* Header Image */}
      <div className="relative h-64">
        <img
          src={experience.image}
          alt={experience.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
              {experience.category}
            </span>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
              {experience.island}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-1">{experience.name}</h1>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" strokeWidth={2} />
              <span>{experience.rating}</span>
              <span className="text-white/80">({experience.reviewCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Description */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">체험 소개</h3>
          <p className="text-gray-600">{experience.description}</p>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" strokeWidth={2} />
            <div>
              <div className="text-xs text-gray-600">소요시간</div>
              <div className="font-semibold text-gray-900">{experience.duration}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" strokeWidth={2} />
            <div>
              <div className="text-xs text-gray-600">최대인원</div>
              <div className="font-semibold text-gray-900">{experience.maxPeople}명</div>
            </div>
          </div>
        </div>

        {/* Included */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">포함 사항</h3>
          <div className="space-y-2">
            {experience.included.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">진행 일정</h3>
          <div className="space-y-3">
            {experience.schedule.map((step, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-4">예약하기</h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">날짜 선택</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">인원</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedPeople(Math.max(1, selectedPeople - 1))}
                  className="w-10 h-10 bg-white border border-gray-300 rounded-lg font-bold active:scale-95 transition-transform"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-gray-900">{selectedPeople}</div>
                  <div className="text-xs text-gray-500">명</div>
                </div>
                <button
                  onClick={() => setSelectedPeople(Math.min(experience.maxPeople, selectedPeople + 1))}
                  className="w-10 h-10 bg-blue-600 text-white rounded-lg font-bold active:scale-95 transition-transform"
                >
                  +
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">체험 요금</span>
                <span className="font-semibold text-gray-900">
                  {experience.price.toLocaleString()}원 × {selectedPeople}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">총 금액</span>
                <span className="text-xl font-bold text-blue-600">
                  {(experience.price * selectedPeople).toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <button
          onClick={handleBook}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform"
        >
          예약하기
        </button>
      </div>

      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
    </div>
  );
}
