import { supabase } from '../../lib/supabase'
import { getCoursesForIsland } from '../../lib/api/durunubi'
import { getSpecialTourByStyle } from '../../lib/api/specialTour'
import { getIslandAttractions, type TourItem } from '../../lib/api/tourApi'

export interface TripFormData {
  departurePort: string;
  startDate: string;
  endDate: string;
  travelers: number;
  travelType: string;
  islands: string[];
  budget: string;
}

export interface FerrySchedule {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  available: boolean;
}

export interface Attraction {
  id: string;
  name: string;
  island: string;
  category: string;
  duration: number;
  congestionLevel: "low" | "medium" | "high";
  description: string;
}

export interface ItineraryDay {
  date: string;
  dayNumber: number;
  activities: Activity[];
}

export interface Activity {
  id: string;
  type: "ferry" | "attraction" | "accommodation" | "meal";
  time: string;
  title: string;
  location: string;
  duration: number;
  description: string;
  price?: number;
  bookingStatus?: "available" | "booked" | "unavailable";
  congestionLevel?: "low" | "medium" | "high";
}

export interface GeneratedItinerary {
  id: string;
  title: string;
  departurePort: string;
  startDate: string;
  endDate: string;
  travelers: number;
  days: ItineraryDay[];
  totalCost: number;
  islands: string[];
  confirmed?: boolean;
}

const FERRY_SCHEDULES: FerrySchedule[] = [
  // 인천항 출발
  { id: "f1", from: "인천항", to: "백령도", departureTime: "08:00", arrivalTime: "12:00", price: 71700, available: true },
  { id: "f2", from: "백령도", to: "인천항", departureTime: "14:00", arrivalTime: "18:00", price: 71700, available: true },
  { id: "f3", from: "인천항", to: "대청도", departureTime: "08:30", arrivalTime: "12:10", price: 65000, available: true },
  { id: "f4", from: "대청도", to: "인천항", departureTime: "14:00", arrivalTime: "17:40", price: 65000, available: true },
  { id: "f5", from: "인천항", to: "소청도", departureTime: "08:30", arrivalTime: "12:10", price: 65000, available: true },
  { id: "f6", from: "소청도", to: "인천항", departureTime: "14:00", arrivalTime: "17:40", price: 65000, available: true },
  { id: "f7", from: "인천항", to: "연평도", departureTime: "09:00", arrivalTime: "11:30", price: 54550, available: true },
  { id: "f8", from: "연평도", to: "인천항", departureTime: "14:30", arrivalTime: "17:00", price: 54550, available: true },
  { id: "f9", from: "인천항", to: "덕적도", departureTime: "09:00", arrivalTime: "10:10", price: 13000, available: true },
  { id: "f10", from: "덕적도", to: "인천항", departureTime: "15:00", arrivalTime: "16:10", price: 13000, available: true },
  { id: "f11", from: "인천항", to: "자월도", departureTime: "09:30", arrivalTime: "10:20", price: 20800, available: true },
  { id: "f12", from: "자월도", to: "인천항", departureTime: "14:30", arrivalTime: "15:20", price: 20800, available: true },
  { id: "f13", from: "인천항", to: "승봉도", departureTime: "10:00", arrivalTime: "11:15", price: 22600, available: true },
  { id: "f14", from: "승봉도", to: "인천항", departureTime: "15:00", arrivalTime: "16:15", price: 22600, available: true },
  { id: "f15", from: "인천항", to: "대이작도", departureTime: "10:30", arrivalTime: "12:00", price: 22600, available: true },
  { id: "f16", from: "대이작도", to: "인천항", departureTime: "15:30", arrivalTime: "17:00", price: 22600, available: true },

  // 대부도항 출발
  { id: "d1", from: "대부도", to: "자월도", departureTime: "09:00", arrivalTime: "11:00", price: 20800, available: true },
  { id: "d2", from: "자월도", to: "대부도", departureTime: "15:00", arrivalTime: "17:00", price: 20800, available: true },
  { id: "d3", from: "대부도", to: "승봉도", departureTime: "09:30", arrivalTime: "11:00", price: 22600, available: true },
  { id: "d4", from: "승봉도", to: "대부도", departureTime: "15:30", arrivalTime: "17:00", price: 22600, available: true },
  { id: "d5", from: "대부도", to: "대이작도", departureTime: "10:00", arrivalTime: "11:30", price: 22600, available: true },
  { id: "d6", from: "대이작도", to: "대부도", departureTime: "16:00", arrivalTime: "17:30", price: 22600, available: true },
  { id: "d7", from: "대부도", to: "소이작도", departureTime: "10:30", arrivalTime: "12:00", price: 22600, available: true },
  { id: "d8", from: "소이작도", to: "대부도", departureTime: "16:30", arrivalTime: "18:00", price: 22600, available: true },
  { id: "d9", from: "대부도", to: "덕적도", departureTime: "11:00", arrivalTime: "13:00", price: 10700, available: true },
  { id: "d10", from: "덕적도", to: "대부도", departureTime: "14:00", arrivalTime: "16:00", price: 10700, available: true },
  { id: "d11", from: "대부도", to: "풍도", departureTime: "11:30", arrivalTime: "14:00", price: 27000, available: true },
  { id: "d12", from: "풍도", to: "대부도", departureTime: "14:30", arrivalTime: "17:00", price: 27000, available: true },
  { id: "d13", from: "대부도", to: "육도", departureTime: "12:00", arrivalTime: "15:00", price: 28000, available: true },
  { id: "d14", from: "육도", to: "대부도", departureTime: "15:00", arrivalTime: "18:00", price: 28000, available: true },

  // 섬간 연결 (덕적도 ↔ 굴업도 환승 포함)
  { id: "s1", from: "덕적도", to: "자월도", departureTime: "13:00", arrivalTime: "13:40", price: 12000, available: true },
  { id: "s2", from: "자월도", to: "대이작도", departureTime: "14:00", arrivalTime: "14:30", price: 8000, available: true },
  { id: "s3", from: "덕적도", to: "굴업도", departureTime: "11:20", arrivalTime: "12:00", price: 7500, available: true },
  { id: "s4", from: "굴업도", to: "덕적도", departureTime: "14:00", arrivalTime: "14:40", price: 7500, available: true },
];

const ATTRACTIONS: Attraction[] = [
  // 백령도
  { id: "a1",  name: "두무진",       island: "백령도", category: "자연경관", duration: 120, congestionLevel: "medium", description: "서해의 해금강이라 불리는 해안 절벽 명소" },
  { id: "a2",  name: "사곶해변",     island: "백령도", category: "해변",     duration: 90,  congestionLevel: "low",    description: "천연기념물로 지정된 천연비행장 해변" },
  { id: "a3",  name: "콩돌해변",     island: "백령도", category: "해변",     duration: 60,  congestionLevel: "low",    description: "알록달록한 천연 콩돌이 가득한 이색 해변" },
  { id: "a4",  name: "심청각",       island: "백령도", category: "문화",     duration: 60,  congestionLevel: "low",    description: "심청전 배경지, 인당수 전망대" },
  { id: "a5",  name: "백령도 등대",  island: "백령도", category: "문화",     duration: 45,  congestionLevel: "low",    description: "서해 최북단 등대, 탁 트인 바다 전망" },
  { id: "a6",  name: "진촌리 해안",  island: "백령도", category: "자연경관", duration: 60,  congestionLevel: "low",    description: "조용한 어촌 해안과 갯벌 탐방" },

  // 대청도
  { id: "b1",  name: "옥죽동 사막",  island: "대청도", category: "자연경관", duration: 120, congestionLevel: "low",    description: "한국 유일의 모래사막, 신비로운 경관" },
  { id: "b2",  name: "농여해변",     island: "대청도", category: "해변",     duration: 90,  congestionLevel: "low",    description: "투명한 청정 바다와 고운 모래" },
  { id: "b3",  name: "미아동 해안",  island: "대청도", category: "자연경관", duration: 60,  congestionLevel: "low",    description: "기암괴석과 에메랄드빛 바다가 어우러진 절경" },
  { id: "b4",  name: "대청도 트레킹",island: "대청도", category: "등산",     duration: 150, congestionLevel: "low",    description: "섬 전체를 잇는 산책 및 트레킹 코스" },
  { id: "b5",  name: "지두리 해수욕장", island: "대청도", category: "해변",  duration: 90,  congestionLevel: "low",    description: "고요하고 청명한 대청도 대표 해수욕장" },

  // 소청도
  { id: "c1",  name: "분바위",       island: "소청도", category: "자연경관", duration: 60,  congestionLevel: "low",    description: "흰 분을 뿌린 듯한 독특한 석회암 바위" },
  { id: "c2",  name: "소청도 등대",  island: "소청도", category: "문화",     duration: 45,  congestionLevel: "low",    description: "1908년 건립된 서해 최북단 유인 등대" },
  { id: "c3",  name: "해안 절경",    island: "소청도", category: "자연경관", duration: 60,  congestionLevel: "low",    description: "소청도 해안선을 따라 걷는 비경 탐방" },
  { id: "c4",  name: "갯벌 체험",    island: "소청도", category: "체험",     duration: 90,  congestionLevel: "low",    description: "깨끗한 갯벌에서 조개·해산물 채취 체험" },

  // 연평도
  { id: "d1",  name: "조기잡이 체험",island: "연평도", category: "체험",     duration: 120, congestionLevel: "medium", description: "연평도 명물 조기잡이 어업 체험" },
  { id: "d2",  name: "낚시터",       island: "연평도", category: "체험",     duration: 90,  congestionLevel: "low",    description: "풍요로운 서해 바다낚시" },
  { id: "d3",  name: "연평도 해수욕장", island: "연평도", category: "해변",  duration: 90,  congestionLevel: "low",    description: "한적하고 조용한 해수욕장" },
  { id: "d4",  name: "구리동 해변",  island: "연평도", category: "해변",     duration: 60,  congestionLevel: "low",    description: "때묻지 않은 자연 그대로의 해변" },
  { id: "d5",  name: "연평 역사관",  island: "연평도", category: "문화",     duration: 60,  congestionLevel: "low",    description: "연평도 역사와 포격전 기념 전시관" },

  // 덕적도
  { id: "e1",  name: "서포리해수욕장", island: "덕적도", category: "해변",   duration: 120, congestionLevel: "medium", description: "울창한 소나무 숲과 맑은 바다가 어우러진 명소" },
  { id: "e2",  name: "비조봉",        island: "덕적도", category: "등산",    duration: 150, congestionLevel: "low",    description: "덕적도 최고봉, 서해 섬들을 한눈에" },
  { id: "e3",  name: "소야도",        island: "덕적도", category: "자연경관", duration: 60, congestionLevel: "low",    description: "도보 연결되는 아기자기한 작은 섬" },
  { id: "e4",  name: "북리해변",      island: "덕적도", category: "해변",    duration: 90,  congestionLevel: "low",    description: "고요한 어촌 마을 앞 한적한 해변" },
  { id: "e5",  name: "밧지름해변",    island: "덕적도", category: "해변",    duration: 90,  congestionLevel: "low",    description: "덕적도 서쪽의 숨은 청정 해변" },
  { id: "e6",  name: "덕적도 자전거길", island: "덕적도", category: "체험",  duration: 120, congestionLevel: "low",    description: "섬 일주 자전거 코스, 해안 경치 감상" },

  // 자월도
  { id: "f1",  name: "선착장마을",   island: "자월도", category: "문화",     duration: 60,  congestionLevel: "low",    description: "정겨운 전통 어촌 마을 골목 탐방" },
  { id: "f2",  name: "큰말해변",     island: "자월도", category: "해변",     duration: 90,  congestionLevel: "low",    description: "한적한 해변, 서해 일몰 명소" },
  { id: "f3",  name: "달바위 전망대", island: "자월도", category: "자연경관", duration: 60, congestionLevel: "low",    description: "자월도 전경과 주변 섬들을 조망" },
  { id: "f4",  name: "갯벌 체험",    island: "자월도", category: "체험",     duration: 90,  congestionLevel: "low",    description: "바지락·낙지 등 갯벌 생물 채취 체험" },
  { id: "f5",  name: "자월도 트레킹", island: "자월도", category: "등산",    duration: 120, congestionLevel: "low",    description: "섬 능선을 따라 걷는 해안 트레킹 코스" },

  // 승봉도
  { id: "g1",  name: "해안산책로",   island: "승봉도", category: "자연경관", duration: 60,  congestionLevel: "low",    description: "승봉도를 한 바퀴 도는 조용한 해안 산책" },
  { id: "g2",  name: "이일레해변",   island: "승봉도", category: "해변",     duration: 90,  congestionLevel: "low",    description: "투명한 바닷물과 흰 모래의 아름다운 해변" },
  { id: "g3",  name: "부두리 해변",  island: "승봉도", category: "해변",     duration: 60,  congestionLevel: "low",    description: "한적한 자연 그대로의 작은 해변" },
  { id: "g4",  name: "남대문 바위",  island: "승봉도", category: "자연경관", duration: 45,  congestionLevel: "low",    description: "서울 남대문을 닮은 독특한 기암" },

  // 대이작도
  { id: "h1",  name: "목기미해변",   island: "대이작도", category: "해변",   duration: 120, congestionLevel: "low",    description: "에메랄드빛 바다와 아름다운 모래사장" },
  { id: "h2",  name: "부아산",       island: "대이작도", category: "등산",   duration: 90,  congestionLevel: "low",    description: "대이작도 최고봉, 주변 섬 조망 절경" },
  { id: "h3",  name: "해안 트레킹",  island: "대이작도", category: "체험",   duration: 120, congestionLevel: "low",    description: "섬 외곽 해안을 따라 걷는 둘레길" },
  { id: "h4",  name: "풀등 모래섬",  island: "대이작도", category: "자연경관", duration: 90, congestionLevel: "low",   description: "썰물 때 나타나는 신비로운 모래섬" },
  { id: "h5",  name: "작은목기미해변", island: "대이작도", category: "해변",  duration: 60, congestionLevel: "low",    description: "조용하고 아늑한 숨은 해변" },

  // 소이작도
  { id: "i1",  name: "큰풀안해변",   island: "소이작도", category: "해변",   duration: 90,  congestionLevel: "low",    description: "작은 섬의 아담하고 청정한 해변" },
  { id: "i2",  name: "조개잡이",     island: "소이작도", category: "체험",   duration: 60,  congestionLevel: "low",    description: "얕은 바다에서 즐기는 조개 채취 체험" },
  { id: "i3",  name: "섬 한 바퀴",   island: "소이작도", category: "자연경관", duration: 90, congestionLevel: "low",   description: "소이작도 전체를 걸어서 한 바퀴" },

  // 영흥도
  { id: "j1",  name: "십리포해수욕장", island: "영흥도", category: "해변",   duration: 120, congestionLevel: "medium", description: "솔숲과 황금빛 모래사장이 펼쳐진 명소" },
  { id: "j2",  name: "장경리해수욕장", island: "영흥도", category: "해변",   duration: 90,  congestionLevel: "medium", description: "서해 낙조가 아름다운 인기 해수욕장" },
  { id: "j3",  name: "영흥도 트레킹", island: "영흥도", category: "등산",   duration: 120, congestionLevel: "low",    description: "국사봉을 오르는 섬 트레킹 코스" },
  { id: "j4",  name: "선재어촌체험",  island: "영흥도", category: "체험",   duration: 90,  congestionLevel: "low",    description: "영흥도 선재마을 갯벌 및 어촌 체험" },
  { id: "j5",  name: "용담포구",      island: "영흥도", category: "문화",   duration: 60,  congestionLevel: "low",    description: "신선한 해산물을 맛볼 수 있는 포구" },

  // 풍도
  { id: "k1",  name: "동백나무숲",   island: "풍도", category: "자연경관",   duration: 90,  congestionLevel: "medium", description: "봄철 붉은 동백꽃이 만발하는 천연 숲" },
  { id: "k2",  name: "풍도 해안트레킹", island: "풍도", category: "체험",   duration: 120, congestionLevel: "low",    description: "섬 외곽 해안 절경을 따라 걷는 둘레길" },
  { id: "k3",  name: "일몰 명소",    island: "풍도", category: "자연경관",   duration: 60,  congestionLevel: "low",    description: "서해 낙조의 아름다움을 즐기는 전망 포인트" },
  { id: "k4",  name: "후망산",       island: "풍도", category: "등산",       duration: 90,  congestionLevel: "low",    description: "풍도 최고봉에서 서해 바다 조망" },
  { id: "k5",  name: "야생화 군락지", island: "풍도", category: "자연경관",  duration: 60,  congestionLevel: "low",    description: "봄이면 복수초·노루귀 등 야생화 천국" },

  // 육도
  { id: "l1",  name: "작은해변",     island: "육도", category: "해변",       duration: 60,  congestionLevel: "low",    description: "외딴 섬의 조용하고 깨끗한 모래사장" },
  { id: "l2",  name: "어촌마을",     island: "육도", category: "문화",       duration: 45,  congestionLevel: "low",    description: "시간이 멈춘 듯한 전통 어촌 마을" },
  { id: "l3",  name: "육도 트레킹",  island: "육도", category: "등산",       duration: 90,  congestionLevel: "low",    description: "소박한 섬 전체를 걷는 자연 탐방로" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const LUNCH_OPTIONS = ["현지 해산물 정식", "조개구이 점심", "섬 특산물 백반", "싱싱한 회 점심", "해물칼국수"]
const DINNER_OPTIONS = ["현지 맛집 저녁", "바다 뷰 레스토랑", "해산물 바베큐", "어촌 가정식", "해물 전골"]
const ACCOM_NAMES: Record<string, string[]> = {
  "여유있게": ["프리미엄 리조트", "오션뷰 펜션", "풀빌라 리조트"],
  "여유":     ["프리미엄 리조트", "오션뷰 펜션", "풀빌라 리조트"],
  "보통":     ["아늑한 펜션", "바다 앞 펜션", "섬 민박 펜션"],
  "알뜰":     ["아담한 민박", "어촌 민박", "게스트하우스"],
  "경제적":   ["아담한 민박", "어촌 민박", "게스트하우스"],
}
const ACCOM_PRICE: Record<string, number> = {
  "여유있게": 120000, "여유": 120000,
  "보통": 80000,
  "알뜰": 50000, "경제적": 50000,
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function selectIslands(formData: TripFormData, numDays: number, _ferries?: FerrySchedule[]): string[] {
  if (formData.islands.length > 0) {
    return formData.islands.slice(0, Math.min(formData.islands.length, numDays));
  }

  // 출발 항구에 따라 다른 섬 추천
  if (formData.departurePort === "대부도") {
    if (numDays === 1) return ["자월도"];
    if (numDays === 2) return ["대이작도"];
    if (numDays >= 3) return ["풍도", "소이작도"];
    return ["자월도"];
  } else {
    // 인천항
    if (numDays === 1) return ["덕적도"];
    if (numDays === 2) return ["덕적도"];
    if (numDays >= 3) return ["백령도", "덕적도"];
    return ["덕적도"];
  }
}

function getAttractionsForIsland(island: string, travelType: string, allAttractions: Attraction[], count = 3): Attraction[] {
  const typeMapping: Record<string, string[]> = {
    "관광":     ["자연경관", "문화", "해변"],
    "휴양":     ["해변", "자연경관"],
    "체험":     ["체험", "등산", "문화"],
    "사진":     ["자연경관", "해변", "문화"],
    "생태":     ["자연경관", "등산", "체험"],
    "무장애":   ["해변", "문화", "자연경관"],
    "반려동물": ["해변", "자연경관", "체험"],
  };
  const preferred = typeMapping[travelType] ?? ["자연경관", "해변"];

  // 섬 관광지를 먼저 섞은 뒤 선호도 점수로 stable sort → 같은 점수끼리 매번 다른 순서
  return shuffle(allAttractions.filter(a => a.island === island))
    .sort((a, b) => {
      const sa = preferred.indexOf(a.category) !== -1 ? preferred.length - preferred.indexOf(a.category) : 0
      const sb = preferred.indexOf(b.category) !== -1 ? preferred.length - preferred.indexOf(b.category) : 0
      return sb - sa
    })
    .slice(0, count)
}

let _cachedFerries: FerrySchedule[] | null = null
let _cachedAttractions: Attraction[] | null = null

// ─── TourAPI → Attraction 변환 헬퍼 ────────────────────────────────────────

const ADDR_TO_ISLAND: [string, string][] = [
  ['백령', '백령도'], ['대청', '대청도'], ['소청', '소청도'],
  ['연평', '연평도'], ['덕적', '덕적도'], ['자월', '자월도'],
  ['승봉', '승봉도'], ['대이작', '대이작도'], ['소이작', '소이작도'],
  ['영흥', '영흥도'], ['풍도', '풍도'], ['육도', '육도'], ['굴업', '굴업도'],
]

function extractIsland(addr1: string): string {
  for (const [kw, name] of ADDR_TO_ISLAND) {
    if (addr1?.includes(kw)) return name
  }
  return ''
}

function mapTourCategory(item: TourItem): string {
  if (item.contentTypeId === '14') return '문화'
  if (item.contentTypeId === '28') return '체험'
  if (item.cat3 === 'A01020100') return '해변'    // 해수욕장
  if (item.cat2 === 'A0102')     return '자연경관' // 관광자원 (해안, 섬 등)
  if (item.cat2 === 'A0101')     return '자연경관' // 자연경관
  if (item.cat2 === 'A0203')     return '체험'     // 체험관광지
  if (item.cat2 === 'A0201')     return '문화'     // 역사관광지
  if (item.cat2 === 'A0206')     return '문화'     // 문화시설
  return '자연경관'
}

function estimateDuration(category: string): number {
  const map: Record<string, number> = {
    '해변': 120, '자연경관': 90, '문화': 60, '체험': 90, '등산': 150,
  }
  return map[category] ?? 90
}

function tourItemToAttraction(item: TourItem): Attraction | null {
  const island = extractIsland(item.addr1 ?? '')
  if (!island) return null
  const category = mapTourCategory(item)
  return {
    id:             item.contentId,
    name:           item.title,
    island,
    category,
    duration:       estimateDuration(category),
    congestionLevel: 'low',
    description:    item.addr1 ?? '',
  }
}

// ─── Supabase attractions 행 → Attraction (컬럼 매핑 수정) ─────────────────

function parseDurationText(text: string): number {
  const m = String(text ?? '').match(/(\d+(?:\.\d+)?)-?(\d+(?:\.\d+)?)?/)
  if (!m) return 90
  const low = parseFloat(m[1])
  const high = m[2] ? parseFloat(m[2]) : low
  return Math.round(((low + high) / 2) * 60)
}

function supabaseRowToAttraction(r: any): Attraction | null {
  const island = ISLAND_ID_TO_KOR[r.island_id] ?? ''
  if (!island) return null
  return {
    id:              r.id,
    name:            r.name,
    island,
    category:        r.category ?? '자연경관',
    duration:        typeof r.duration === 'number' ? r.duration : parseDurationText(r.duration),
    congestionLevel: 'low',
    description:     r.description ?? '',
  }
}

// ─── 데이터 로드: Supabase(seed된 관광공사 데이터) → tourAPI → 하드코딩 순 ──

export async function fetchIslandData() {
  // 1. Supabase — seed-attractions.mjs로 미리 입력된 데이터 (우선)
  try {
    const { data } = await supabase.from('attractions').select('*')
    if (data && data.length > 10) {        // seed 된 상태 (seed.sql 초기 데이터 10개 이상)
      const mapped = data
        .map(supabaseRowToAttraction)
        .filter((a): a is Attraction => a !== null)
      if (mapped.length > 0) {
        _cachedAttractions = mapped
        return                             // Supabase에 데이터 있으면 여기서 종료
      }
    }
  } catch {
    // Supabase 실패 시 다음 단계로
  }

  // 2. Supabase 데이터 없을 때 관광공사 API 직접 호출 (API 활성화 전 개발용)
  try {
    const tourItems = await getIslandAttractions()
    if (tourItems.length > 0) {
      const mapped = tourItems
        .map(tourItemToAttraction)
        .filter((a): a is Attraction => a !== null)
      if (mapped.length > 0) _cachedAttractions = mapped
    }
  } catch {
    // 3. 모두 실패 시 하드코딩 ATTRACTIONS 자동 사용 (generateItinerary 내부 fallback)
  }
}

// 두루누비 코스 기반 이동시간 캐시 (섬 → 분)
const _durunubiTimeCache: Record<string, number> = {}

const ISLAND_ID_TO_KOR: Record<string, string> = {
  baengnyeong: '백령도', daecheong: '대청도', socheong: '소청도',
  yeonpyeong:  '연평도', deokjeok:  '덕적도', jawol:     '자월도',
  seungbong:   '승봉도', daeijak:   '대이작도', soijak:  '소이작도',
  yeonghung:   '영흥도', pungdo:    '풍도',    guleop:   '굴업도',
}

export async function prefetchDurunubiData(islandIds: string[]): Promise<void> {
  await Promise.allSettled(
    islandIds.map(async (id) => {
      const courses = await getCoursesForIsland(id)
      if (courses.length > 0) {
        const avgMin = courses.reduce((s, c) => s + c.durationMin, 0) / courses.length
        // 한국어 이름으로 저장해야 generateItinerary에서 조회 가능
        const korName = ISLAND_ID_TO_KOR[id] ?? id
        _durunubiTimeCache[korName] = Math.round(avgMin)
      }
    })
  )
}

export async function prefetchSpecialTourData(travelType: string, islandIds: string[]): Promise<Attraction[]> {
  const specialItems = await getSpecialTourByStyle(travelType)
  return specialItems.map((item, idx) => ({
    id:             `special-${idx}`,
    name:           item.title,
    island:         islandIds[0] ?? '',
    category:       travelType === '생태' ? '생태' : travelType === '무장애' ? '문화' : '체험',
    duration:       90,
    congestionLevel: 'low' as const,
    description:    item.addr1,
  }))
}

export function generateItinerary(formData: TripFormData): GeneratedItinerary {
  const ferries = _cachedFerries ?? FERRY_SCHEDULES
  const allAttractions = _cachedAttractions ?? ATTRACTIONS
  const numDays = getDaysBetween(formData.startDate, formData.endDate);
  const selectedIslands = selectIslands(formData, numDays);

  const days: ItineraryDay[] = [];
  let totalCost = 0;

  for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
    const currentDate = new Date(formData.startDate);
    currentDate.setDate(currentDate.getDate() + dayIndex);
    const dateString = currentDate.toISOString().split('T')[0];

    const activities: Activity[] = [];
    const isFirstDay = dayIndex === 0;
    const isLastDay = dayIndex === numDays - 1;
    const currentIsland = selectedIslands[Math.min(dayIndex, selectedIslands.length - 1)];

    const accomPrice = ACCOM_PRICE[formData.budget] ?? 80000
    const accomName  = pick(ACCOM_NAMES[formData.budget] ?? ACCOM_NAMES["보통"])
    const departurePort = formData.departurePort || "인천항"

    if (isFirstDay) {
      const ferry = ferries.find(f => f.from === departurePort && f.to === currentIsland);
      if (ferry) {
        activities.push({
          id: `act-${dayIndex}-1`,
          type: "ferry",
          time: ferry.departureTime,
          title: `여객선 탑승 (${ferry.from} → ${ferry.to})`,
          location: ferry.from,
          duration: 0,
          description: `${ferry.departureTime} 출발 → ${ferry.arrivalTime} 도착`,
          price: ferry.price * formData.travelers,
          bookingStatus: "available",
        });
        totalCost += ferry.price * formData.travelers;
      }

      // 도착 후 점심 (도착시간 기준으로 30분 후)
      const arrivalHour = ferry ? parseInt(ferry.arrivalTime.split(':')[0]) : 12
      const lunchTime = `${arrivalHour}:30`
      activities.push({
        id: `act-${dayIndex}-2`,
        type: "meal",
        time: lunchTime,
        title: "점심 식사",
        location: currentIsland,
        duration: 60,
        description: pick(LUNCH_OPTIONS),
        price: 15000 * formData.travelers,
      });
      totalCost += 15000 * formData.travelers;

      // 오후 관광 (도착+2시간 기준)
      const afternoonStart = arrivalHour + 2
      const attractions = getAttractionsForIsland(currentIsland, formData.travelType, allAttractions, 2);
      attractions.forEach((attraction, idx) => {
        const h = afternoonStart + idx * 2
        activities.push({
          id: `act-${dayIndex}-${3 + idx}`,
          type: "attraction",
          time: `${String(h).padStart(2, '0')}:00`,
          title: attraction.name,
          location: attraction.island,
          duration: attraction.duration,
          description: attraction.description,
          congestionLevel: attraction.congestionLevel,
        });
      });

      // 두루누비 트레킹 코스
      const durunubiTime = _durunubiTimeCache[currentIsland]
      if (durunubiTime && durunubiTime > 0 && numDays > 1) {
        activities.push({
          id: `act-${dayIndex}-trail`,
          type: 'attraction',
          time: `${String(afternoonStart + 4).padStart(2, '0')}:00`,
          title: `${currentIsland} 두루누비 트레킹`,
          location: currentIsland,
          duration: Math.min(durunubiTime, 90),
          description: `두루누비 공식 코스 (예상 ${durunubiTime}분)`,
          congestionLevel: 'low',
        })
      }

      if (numDays === 1) {
        // 당일치기: 귀환 여객선 추가
        const returnFerry = ferries.find(f => f.from === currentIsland && f.to === departurePort)
        if (returnFerry) {
          activities.push({
            id: `act-${dayIndex}-return`,
            type: "ferry",
            time: returnFerry.departureTime,
            title: `여객선 탑승 (${returnFerry.from} → ${returnFerry.to})`,
            location: returnFerry.from,
            duration: 0,
            description: `${returnFerry.departureTime} 출발 → ${returnFerry.arrivalTime} 도착`,
            price: returnFerry.price * formData.travelers,
            bookingStatus: "available",
          });
          totalCost += returnFerry.price * formData.travelers;
        }
      } else {
        activities.push({
          id: `act-${dayIndex}-accommodation`,
          type: "accommodation",
          time: "18:00",
          title: `숙소 체크인 — ${accomName}`,
          location: currentIsland,
          duration: 0,
          description: accomName,
          price: accomPrice,
          bookingStatus: "available",
        });
        totalCost += accomPrice;
      }
    } else if (isLastDay) {
      activities.push({
        id: `act-${dayIndex}-1`,
        type: "meal",
        time: "08:00",
        title: "아침 식사",
        location: currentIsland,
        duration: 60,
        description: "숙소 조식",
        price: 10000 * formData.travelers,
      });
      totalCost += 10000 * formData.travelers;

      const attractions = getAttractionsForIsland(currentIsland, formData.travelType, allAttractions, 1);
      if (attractions.length > 0) {
        activities.push({
          id: `act-${dayIndex}-2`,
          type: "attraction",
          time: "09:30",
          title: attractions[0].name,
          location: attractions[0].island,
          duration: attractions[0].duration,
          description: attractions[0].description,
          congestionLevel: attractions[0].congestionLevel,
        });
      }

      const returnFerry = ferries.find(f => f.from === currentIsland && f.to === departurePort);
      if (returnFerry) {
        activities.push({
          id: `act-${dayIndex}-3`,
          type: "ferry",
          time: returnFerry.departureTime,
          title: `여객선 탑승 (${returnFerry.from} → ${returnFerry.to})`,
          location: returnFerry.from,
          duration: 0,
          description: `${returnFerry.departureTime} 출발 → ${returnFerry.arrivalTime} 도착`,
          price: returnFerry.price * formData.travelers,
          bookingStatus: "available",
        });
        totalCost += returnFerry.price * formData.travelers;
      }
    } else {
      activities.push({
        id: `act-${dayIndex}-1`,
        type: "meal",
        time: "08:00",
        title: "아침 식사",
        location: currentIsland,
        duration: 60,
        description: "숙소 조식",
        price: 10000 * formData.travelers,
      });
      totalCost += 10000 * formData.travelers;

      const attractions = getAttractionsForIsland(currentIsland, formData.travelType, allAttractions);
      attractions.forEach((attraction, idx) => {
        const startHour = 10 + (idx * 2);
        activities.push({
          id: `act-${dayIndex}-${2 + idx}`,
          type: "attraction",
          time: `${startHour.toString().padStart(2, '0')}:00`,
          title: attraction.name,
          location: attraction.island,
          duration: attraction.duration,
          description: attraction.description,
          congestionLevel: attraction.congestionLevel,
        });
      });

      activities.push({
        id: `act-${dayIndex}-meal`,
        type: "meal",
        time: "18:00",
        title: "저녁 식사",
        location: currentIsland,
        duration: 90,
        description: pick(DINNER_OPTIONS),
        price: 20000 * formData.travelers,
      });
      totalCost += 20000 * formData.travelers;

      activities.push({
        id: `act-${dayIndex}-accommodation`,
        type: "accommodation",
        time: "20:00",
        title: `숙소 휴식 — ${accomName}`,
        location: currentIsland,
        duration: 0,
        description: accomName,
        price: accomPrice,
        bookingStatus: "available",
      });
      totalCost += accomPrice;
    }

    days.push({
      date: dateString,
      dayNumber: dayIndex + 1,
      activities: activities,
    });
  }

  return {
    id: Date.now().toString(),
    title: `${selectedIslands.join(", ")} ${numDays}일 여행`,
    departurePort: formData.departurePort || "인천항",
    startDate: formData.startDate,
    endDate: formData.endDate,
    travelers: formData.travelers,
    days,
    totalCost,
    islands: selectedIslands,
  };
}
