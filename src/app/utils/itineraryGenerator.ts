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
  { id: "f1", from: "인천항", to: "백령도", departureTime: "08:00", arrivalTime: "12:00", price: 45000, available: true },
  { id: "f2", from: "백령도", to: "인천항", departureTime: "14:00", arrivalTime: "18:00", price: 45000, available: true },
  { id: "f3", from: "인천항", to: "대청도", departureTime: "08:30", arrivalTime: "12:30", price: 45000, available: true },
  { id: "f4", from: "대청도", to: "인천항", departureTime: "14:00", arrivalTime: "18:00", price: 45000, available: true },
  { id: "f5", from: "인천항", to: "소청도", departureTime: "08:30", arrivalTime: "12:30", price: 45000, available: true },
  { id: "f6", from: "소청도", to: "인천항", departureTime: "14:00", arrivalTime: "18:00", price: 45000, available: true },
  { id: "f7", from: "인천항", to: "연평도", departureTime: "09:00", arrivalTime: "12:30", price: 40000, available: true },
  { id: "f8", from: "연평도", to: "인천항", departureTime: "14:30", arrivalTime: "18:00", price: 40000, available: true },
  { id: "f9", from: "인천항", to: "덕적도", departureTime: "09:00", arrivalTime: "11:30", price: 28000, available: true },
  { id: "f10", from: "덕적도", to: "인천항", departureTime: "15:00", arrivalTime: "17:30", price: 28000, available: true },
  { id: "f11", from: "인천항", to: "자월도", departureTime: "09:30", arrivalTime: "12:00", price: 25000, available: true },
  { id: "f12", from: "자월도", to: "인천항", departureTime: "14:30", arrivalTime: "17:00", price: 25000, available: true },
  { id: "f13", from: "인천항", to: "승봉도", departureTime: "10:00", arrivalTime: "12:00", price: 23000, available: true },
  { id: "f14", from: "승봉도", to: "인천항", departureTime: "15:00", arrivalTime: "17:00", price: 23000, available: true },
  { id: "f15", from: "인천항", to: "대이작도", departureTime: "10:30", arrivalTime: "12:30", price: 25000, available: true },
  { id: "f16", from: "대이작도", to: "인천항", departureTime: "15:30", arrivalTime: "17:30", price: 25000, available: true },

  // 대부도항 출발
  { id: "d1", from: "대부도", to: "자월도", departureTime: "09:00", arrivalTime: "11:00", price: 25000, available: true },
  { id: "d2", from: "자월도", to: "대부도", departureTime: "15:00", arrivalTime: "17:00", price: 25000, available: true },
  { id: "d3", from: "대부도", to: "승봉도", departureTime: "09:30", arrivalTime: "11:00", price: 23000, available: true },
  { id: "d4", from: "승봉도", to: "대부도", departureTime: "15:30", arrivalTime: "17:00", price: 23000, available: true },
  { id: "d5", from: "대부도", to: "대이작도", departureTime: "10:00", arrivalTime: "11:30", price: 25000, available: true },
  { id: "d6", from: "대이작도", to: "대부도", departureTime: "16:00", arrivalTime: "17:30", price: 25000, available: true },
  { id: "d7", from: "대부도", to: "소이작도", departureTime: "10:30", arrivalTime: "12:00", price: 25000, available: true },
  { id: "d8", from: "소이작도", to: "대부도", departureTime: "16:30", arrivalTime: "18:00", price: 25000, available: true },
  { id: "d9", from: "대부도", to: "덕적도", departureTime: "11:00", arrivalTime: "13:00", price: 28000, available: true },
  { id: "d10", from: "덕적도", to: "대부도", departureTime: "14:00", arrivalTime: "16:00", price: 28000, available: true },
  { id: "d11", from: "대부도", to: "풍도", departureTime: "11:30", arrivalTime: "14:00", price: 27000, available: true },
  { id: "d12", from: "풍도", to: "대부도", departureTime: "14:30", arrivalTime: "17:00", price: 27000, available: true },
  { id: "d13", from: "대부도", to: "육도", departureTime: "12:00", arrivalTime: "15:00", price: 28000, available: true },
  { id: "d14", from: "육도", to: "대부도", departureTime: "15:00", arrivalTime: "18:00", price: 28000, available: true },

  // 섬간 연결
  { id: "s1", from: "덕적도", to: "자월도", departureTime: "13:00", arrivalTime: "13:40", price: 12000, available: true },
  { id: "s2", from: "자월도", to: "대이작도", departureTime: "14:00", arrivalTime: "14:30", price: 8000, available: true },
];

const ATTRACTIONS: Attraction[] = [
  // 백령도
  { id: "a1", name: "두무진", island: "백령도", category: "자연경관", duration: 120, congestionLevel: "medium", description: "백령도의 대표적인 해안 절벽 명소" },
  { id: "a2", name: "사곶해변", island: "백령도", category: "해변", duration: 90, congestionLevel: "low", description: "천연기념물 천연비행장" },
  { id: "a3", name: "콩돌해변", island: "백령도", category: "해변", duration: 60, congestionLevel: "low", description: "천연 돌멩이 해변" },

  // 대청도
  { id: "a4", name: "옥죽동 사막", island: "대청도", category: "자연경관", duration: 120, congestionLevel: "low", description: "한국 유일의 모래사막" },
  { id: "a5", name: "농여해변", island: "대청도", category: "해변", duration: 90, congestionLevel: "low", description: "청정 해변" },
  { id: "a6", name: "미아동 해안", island: "대청도", category: "자연경관", duration: 60, congestionLevel: "low", description: "기암절벽" },

  // 소청도
  { id: "a7", name: "분바위", island: "소청도", category: "자연경관", duration: 60, congestionLevel: "low", description: "소청도 명물" },
  { id: "a8", name: "등대", island: "소청도", category: "문화", duration: 30, congestionLevel: "low", description: "역사적인 등대" },

  // 연평도
  { id: "a9", name: "조기잡이 체험", island: "연평도", category: "체험", duration: 120, congestionLevel: "medium", description: "유명한 조기 체험" },
  { id: "a10", name: "낚시터", island: "연평도", category: "체험", duration: 90, congestionLevel: "low", description: "바다 낚시" },

  // 덕적도
  { id: "a11", name: "서포리해수욕장", island: "덕적도", category: "해변", duration: 120, congestionLevel: "medium", description: "맑은 물과 고운 모래가 특징" },
  { id: "a12", name: "비조봉", island: "덕적도", category: "등산", duration: 150, congestionLevel: "low", description: "덕적도 최고봉, 섬 전경 조망" },
  { id: "a13", name: "소야도", island: "덕적도", category: "자연경관", duration: 60, congestionLevel: "low", description: "작은 섬 탐방" },

  // 자월도
  { id: "a14", name: "선착장마을", island: "자월도", category: "문화", duration: 60, congestionLevel: "low", description: "전통 어촌 마을 풍경" },
  { id: "a15", name: "큰말해변", island: "자월도", category: "해변", duration: 90, congestionLevel: "low", description: "한적한 해변, 일몰 명소" },

  // 승봉도
  { id: "a16", name: "해안산책로", island: "승봉도", category: "문화", duration: 60, congestionLevel: "low", description: "조용한 해안길" },
  { id: "a17", name: "선착장", island: "승봉도", category: "문화", duration: 30, congestionLevel: "low", description: "어촌 풍경" },

  // 대이작도
  { id: "a18", name: "목기미해변", island: "대이작도", category: "해변", duration: 120, congestionLevel: "low", description: "에메랄드빛 바다" },
  { id: "a19", name: "부아산", island: "대이작도", category: "등산", duration: 90, congestionLevel: "low", description: "섬 정상" },
  { id: "a20", name: "해안 트레킹", island: "대이작도", category: "체험", duration: 120, congestionLevel: "low", description: "둘레길" },

  // 소이작도
  { id: "a21", name: "해수욕장", island: "소이작도", category: "해변", duration: 90, congestionLevel: "low", description: "작은 해변" },
  { id: "a22", name: "조개잡이", island: "소이작도", category: "체험", duration: 60, congestionLevel: "low", description: "갯벌 체험" },

  // 풍도
  { id: "a23", name: "동백나무숲", island: "풍도", category: "자연경관", duration: 90, congestionLevel: "medium", description: "봄철 동백꽃 명소" },
  { id: "a24", name: "해안트레킹", island: "풍도", category: "체험", duration: 120, congestionLevel: "low", description: "둘레길 산책" },
  { id: "a25", name: "일몰명소", island: "풍도", category: "자연경관", duration: 60, congestionLevel: "low", description: "석양 감상" },

  // 육도
  { id: "a26", name: "작은해변", island: "육도", category: "해변", duration: 60, congestionLevel: "low", description: "한적한 모래사장" },
  { id: "a27", name: "어촌마을", island: "육도", category: "문화", duration: 45, congestionLevel: "low", description: "전통 마을" },
];

function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function selectIslands(formData: TripFormData, numDays: number): string[] {
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

function getAttractionsForIsland(island: string, travelType: string): Attraction[] {
  const islandAttractions = ATTRACTIONS.filter(a => a.island === island);

  const typeMapping: Record<string, string[]> = {
    "관광": ["자연경관", "문화", "해변"],
    "휴양": ["해변"],
    "체험": ["문화", "등산"],
    "사진": ["자연경관", "해변", "문화"],
  };

  const preferredCategories = typeMapping[travelType] || ["자연경관", "해변"];

  return islandAttractions
    .sort((a, b) => {
      const aScore = preferredCategories.includes(a.category) ? 1 : 0;
      const bScore = preferredCategories.includes(b.category) ? 1 : 0;
      if (aScore !== bScore) return bScore - aScore;
      if (a.congestionLevel === "low" && b.congestionLevel !== "low") return -1;
      if (a.congestionLevel !== "low" && b.congestionLevel === "low") return 1;
      return 0;
    })
    .slice(0, 3);
}

export function generateItinerary(formData: TripFormData): GeneratedItinerary {
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

    if (isFirstDay) {
      const departurePort = formData.departurePort || "인천항";
      const ferry = FERRY_SCHEDULES.find(f => f.from === departurePort && f.to === currentIsland);
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

      activities.push({
        id: `act-${dayIndex}-2`,
        type: "meal",
        time: "12:30",
        title: "점심 식사",
        location: currentIsland,
        duration: 60,
        description: "현지 해산물 요리",
        price: 15000 * formData.travelers,
      });
      totalCost += 15000 * formData.travelers;

      const attractions = getAttractionsForIsland(currentIsland, formData.travelType);
      attractions.slice(0, 2).forEach((attraction, idx) => {
        const startHour = 14 + (idx * 2);
        activities.push({
          id: `act-${dayIndex}-${3 + idx}`,
          type: "attraction",
          time: `${startHour.toString().padStart(2, '0')}:00`,
          title: attraction.name,
          location: attraction.island,
          duration: attraction.duration,
          description: attraction.description,
          congestionLevel: attraction.congestionLevel,
        });
      });

      if (numDays > 1) {
        activities.push({
          id: `act-${dayIndex}-accommodation`,
          type: "accommodation",
          time: "18:00",
          title: "숙소 체크인",
          location: currentIsland,
          duration: 0,
          description: formData.budget === "여유있게" ? "리조트" : formData.budget === "보통" ? "펜션" : "민박",
          price: formData.budget === "여유있게" ? 120000 : formData.budget === "보통" ? 80000 : 50000,
          bookingStatus: "available",
        });
        totalCost += formData.budget === "여유있게" ? 120000 : formData.budget === "보통" ? 80000 : 50000;
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

      const attractions = getAttractionsForIsland(currentIsland, formData.travelType);
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

      const departurePort = formData.departurePort || "인천항";
      const returnFerry = FERRY_SCHEDULES.find(f => f.from === currentIsland && f.to === departurePort);
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

      const attractions = getAttractionsForIsland(currentIsland, formData.travelType);
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
        description: "현지 맛집",
        price: 20000 * formData.travelers,
      });
      totalCost += 20000 * formData.travelers;

      activities.push({
        id: `act-${dayIndex}-accommodation`,
        type: "accommodation",
        time: "20:00",
        title: "숙소 휴식",
        location: currentIsland,
        duration: 0,
        description: formData.budget === "여유있게" ? "리조트" : formData.budget === "보통" ? "펜션" : "민박",
        price: formData.budget === "여유있게" ? 120000 : formData.budget === "보통" ? 80000 : 50000,
        bookingStatus: "available",
      });
      totalCost += formData.budget === "여유있게" ? 120000 : formData.budget === "보통" ? 80000 : 50000;
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
