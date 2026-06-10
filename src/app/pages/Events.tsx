import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Calendar, MapPin, Users, ChevronRight, Clock, Plus } from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: string;
  name: string;
  island: string;
  category: "축제" | "문화행사" | "체험" | "공연";
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  image: string;
  fee: string;
  contact: string;
}

const EVENTS: Event[] = [
  {
    id: "evt1",
    name: "백령도 조기축제",
    island: "백령도",
    category: "축제",
    startDate: "2026-04-15",
    endDate: "2026-04-17",
    location: "백령항 일대",
    description: "서해 최고의 조기를 맛보고 즐기는 봄 축제. 조기 요리 시연, 시식회, 어선 체험 등 다채로운 프로그램",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    fee: "무료",
    contact: "032-899-3000",
  },
  {
    id: "evt2",
    name: "덕적도 해변음악회",
    island: "덕적도",
    category: "공연",
    startDate: "2026-07-20",
    endDate: "2026-07-20",
    location: "서포리 해수욕장",
    description: "여름밤 해변에서 즐기는 라이브 공연. 인디밴드와 함께하는 낭만적인 저녁",
    image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    fee: "무료",
    contact: "032-831-2210",
  },
  {
    id: "evt3",
    name: "자월도 동백꽃 축제",
    island: "자월도",
    category: "축제",
    startDate: "2026-03-10",
    endDate: "2026-03-20",
    location: "자월도 동백숲",
    description: "봄을 알리는 붉은 동백꽃이 만발하는 시기에 열리는 꽃 축제",
    image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    fee: "무료",
    contact: "032-899-2114",
  },
  {
    id: "evt4",
    name: "덕적도 갯벌체험축제",
    island: "덕적도",
    category: "체험",
    startDate: "2026-05-01",
    endDate: "2026-05-05",
    location: "덕적도 갯벌",
    description: "조개, 게, 낙지를 직접 잡아보는 가족 체험 행사. 갯벌 생태 학습과 체험이 함께하는 축제",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    fee: "1만원 (체험키트 포함)",
    contact: "032-831-2210",
  },
  {
    id: "evt5",
    name: "백령도 전통문화체험",
    island: "백령도",
    category: "문화행사",
    startDate: "2026-08-15",
    endDate: "2026-08-15",
    location: "백령면사무소 광장",
    description: "전통 놀이, 민속 공연, 지역 특산물 장터가 열리는 여름 문화 행사",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    fee: "무료",
    contact: "032-899-3000",
  },
  {
    id: "evt6",
    name: "대청도 별빛축제",
    island: "대청도",
    category: "축제",
    startDate: "2026-08-01",
    endDate: "2026-08-03",
    location: "대청도 해변",
    description: "도시에서는 볼 수 없는 맑은 밤하늘의 별을 관측하는 축제. 천체망원경 체험, 별자리 교육",
    image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    fee: "무료",
    contact: "032-899-2114",
  },
  {
    id: "evt7",
    name: "풍도 동백축제",
    island: "풍도",
    category: "축제",
    startDate: "2026-03-15",
    endDate: "2026-03-25",
    location: "풍도 동백나무숲",
    description: "천연기념물 동백나무 자생지에서 열리는 봄맞이 축제",
    image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    fee: "무료",
    contact: "032-830-2000",
  },
];

export function Events() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [islandFilter, setIslandFilter] = useState<string>("all");

  const filteredEvents = EVENTS.filter(event => {
    const eventMonth = parseInt(event.startDate.split('-')[1]);
    const monthMatch = eventMonth === selectedMonth;
    const islandMatch = islandFilter === "all" || event.island === islandFilter;
    return monthMatch && islandMatch;
  });

  const islands = ["all", ...Array.from(new Set(EVENTS.map(e => e.island)))];

  const addToItinerary = (event: Event) => {
    toast.success(`${event.name}를 즐겨찾기에 추가했어요`);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-3 text-blue-100 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          <span className="text-sm">뒤로</span>
        </button>
        <h1 className="text-xl font-bold mb-1">이벤트 & 축제</h1>
        <p className="text-sm text-blue-100">섬에서 열리는 특별한 행사를 확인하세요</p>
      </div>

      {/* Month Selector */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                selectedMonth === month
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {month}월
            </button>
          ))}
        </div>
      </div>

      {/* Island Filter */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {islands.map(island => (
            <button
              key={island}
              onClick={() => setIslandFilter(island)}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                islandFilter === island
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200"
              }`}
            >
              {island === "all" ? "전체 섬" : island}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
            <p className="text-gray-500 mb-2">이번 달 예정된 행사가 없어요</p>
            <p className="text-sm text-gray-400">다른 월을 선택해보세요</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} onAdd={addToItinerary} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, onAdd }: { event: Event; onAdd: (event: Event) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryColor = (category: Event["category"]) => {
    const colors = {
      축제: "bg-pink-100 text-pink-700",
      문화행사: "bg-blue-100 text-blue-700",
      체험: "bg-green-100 text-green-700",
      공연: "bg-blue-100 text-blue-700",
    };
    return colors[category];
  };

  const formatDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (startDate === endDate) {
      return `${start.getMonth() + 1}월 ${start.getDate()}일`;
    }

    return `${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Image */}
      <div className="relative h-40">
        <img
          src={event.image}
          alt={event.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(event.category)}`}>
            {event.category}
          </span>
        </div>

        {/* Title */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white mb-1">{event.name}</h3>
          <div className="flex items-center gap-2 text-sm text-white/90">
            <MapPin className="w-4 h-4" strokeWidth={2} />
            <span>{event.island}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Date & Location */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <span>{formatDate(event.startDate, event.endDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-gray-400" strokeWidth={2} />
            <span>{event.location}</span>
          </div>
        </div>

        {/* Description */}
        <p className={`text-sm text-gray-600 mb-3 ${!isExpanded && "line-clamp-2"}`}>
          {event.description}
        </p>

        {/* Expanded Info */}
        {isExpanded && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">참가비</span>
              <span className="font-semibold text-gray-900">{event.fee}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">문의</span>
              <a href={`tel:${event.contact}`} className="font-semibold text-blue-600">
                {event.contact}
              </a>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm active:scale-95 transition-transform"
          >
            {isExpanded ? "접기" : "자세히 보기"}
          </button>
          <button
            onClick={() => onAdd(event)}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-1 active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            즐겨찾기
          </button>
        </div>
      </div>
    </div>
  );
}
