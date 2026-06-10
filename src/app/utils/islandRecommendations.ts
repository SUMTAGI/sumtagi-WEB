export interface RecommendedIsland {
  id: string;
  name: string;
  reason: string;
  features: string[];
  image: string;
  matchScore: number;
}

const ISLAND_PROFILES = {
  baengnyeong: {
    id: "baengnyeong",
    name: "백령도",
    image: "https://images.unsplash.com/photo-1635355942488-a8bdb5a0803e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    styles: {
      힐링: 9,
      액티비티: 6,
      맛집탐방: 7,
      자연관광: 10,
      반려동물동반: 5,
    },
    features: ["두무진 절경", "사곶해변", "자연경관"],
    reason: "천혜의 자연경관과 평화로운 분위기",
  },
  deokjeok: {
    id: "deokjeok",
    name: "덕적도",
    image: "https://images.unsplash.com/photo-1662898069390-badabf2d65df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    styles: {
      힐링: 10,
      액티비티: 7,
      맛집탐방: 6,
      자연관광: 8,
      반려동물동반: 8,
    },
    features: ["맑은 바다", "서포리해수욕장", "가족여행"],
    reason: "맑은 바다와 여유로운 힐링 공간",
  },
  jawol: {
    id: "jawol",
    name: "자월도",
    image: "https://images.unsplash.com/photo-1758327740342-4e705edea29b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    styles: {
      힐링: 10,
      액티비티: 5,
      맛집탐방: 5,
      자연관광: 8,
      반려동물동반: 9,
    },
    features: ["한적한 해변", "에메랄드 바다", "일몰 명소"],
    reason: "한적하고 조용한 휴식의 섬",
  },
  daecheong: {
    id: "daecheong",
    name: "대청도",
    image: "https://images.unsplash.com/photo-1700621496615-6ee6240503ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    styles: {
      힐링: 7,
      액티비티: 9,
      맛집탐방: 6,
      자연관광: 10,
      반려동물동반: 6,
    },
    features: ["옥죽동 사막", "트레킹", "독특한 지형"],
    reason: "모래사막과 기암절벽의 모험",
  },
  yeonghung: {
    id: "yeonghung",
    name: "영흥도",
    image: "https://images.unsplash.com/photo-1628412071389-6e8f7a7a4e6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    styles: {
      힐링: 6,
      액티비티: 7,
      맛집탐방: 10,
      자연관광: 6,
      반려동물동반: 8,
    },
    features: ["당일치기 가능", "맛집 다수", "해산물"],
    reason: "신선한 해산물과 맛집 탐방",
  },
  seonjae: {
    id: "seonjae",
    name: "선재도",
    image: "https://images.unsplash.com/photo-1700621496615-6ee6240503ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    styles: {
      힐링: 8,
      액티비티: 6,
      맛집탐방: 5,
      자연관광: 7,
      반려동물동반: 7,
    },
    features: ["조용한 마을", "해안산책", "여유로운"],
    reason: "소박한 어촌 마을의 평화",
  },
  guleop: {
    id: "guleop",
    name: "굴업도",
    image: "https://images.unsplash.com/photo-1661488601431-e8257e864068?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600",
    styles: {
      힐링: 10,
      액티비티: 8,
      맛집탐방: 4,
      자연관광: 10,
      반려동물동반: 7,
    },
    features: ["무인도 같은 분위기", "트레킹", "야생화"],
    reason: "무인도처럼 순수한 자연",
  },
};

export function getRecommendedIslands(travelStyle: string): RecommendedIsland[] {
  const islands = Object.values(ISLAND_PROFILES);

  const recommendations = islands
    .map((island) => ({
      id: island.id,
      name: island.name,
      reason: island.reason,
      features: island.features,
      image: island.image,
      matchScore: island.styles[travelStyle as keyof typeof island.styles] || 5,
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  return recommendations;
}

export function getTravelStyleMessage(style: string): string {
  const messages: Record<string, string> = {
    힐링: "편안한 휴식을 원하시는군요",
    액티비티: "활동적인 여행을 즐기시는군요",
    맛집탐방: "맛있는 음식을 찾아다니시는군요",
    자연관광: "아름다운 자연을 좋아하시는군요",
    반려동물동반: "반려동물과 함께하는 여행이시군요",
  };
  return messages[style] || "새로운 섬을 탐험해보세요";
}
