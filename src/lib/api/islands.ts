import { supabase } from '../supabase'

export interface Island {
  id: string
  name: string
  description: string
  features: string[]
  ferry_time: string
  ferry_price: number | null
  popularity_trend: 'up' | 'down' | 'stable'
  congestion: 'low' | 'medium' | 'high'
  best_season: string
  image: string | null
  ports: string[]
  lat?: number
  lng?: number
}

// ferry_price: 0 = 다리로 연결돼 배가 필요 없음, null = 배는 있지만 정확한 요금 미확인
export function formatFerryPrice(price: number | null): string {
  if (price === null) return '요금 확인 필요'
  if (price > 0) return `${price.toLocaleString()}원`
  return '육로 연결'
}

export interface Attraction {
  id: string
  island_id: string
  name: string
  category: string
  description: string
  image: string
  duration: string
  rating: number
  order_index: number
}

export interface Restaurant {
  id: string
  island_id: string
  name: string
  cuisine: string
  price_level: string
  specialty: string
  image: string
  rating: number
  order_index: number
}

export interface Accommodation {
  id: string
  island_id: string
  name: string
  type: string
  price_per_night: number
  image: string
  rating: number
  order_index: number
}

export interface PhotoSpot {
  id: string
  island_id: string
  name: string
  description: string
  image: string
  best_time: string
  order_index: number
}

export interface IslandDetail extends Island {
  attractions: Attraction[]
  restaurants: Restaurant[]
  accommodations: Accommodation[]
  photo_spots: PhotoSpot[]
}

export async function getIslands(): Promise<Island[]> {
  const { data, error } = await supabase
    .from('islands')
    .select('*')
    .order('name')

  if (error) throw error
  return data ?? []
}

// 즐겨찾기 데이터가 거의 없는 초기 서비스 특성상, "인기 섬"은 관광지 정보(맛집·포토스팟)가
// 가장 풍부하게 등록된 섬을 우선순위로 삼는다 (콘텐츠가 많을수록 실제로 둘러볼 게 많은 섬).
export async function getPopularIslands(limit = 4): Promise<Island[]> {
  const [islands, restaurants, photoSpots] = await Promise.all([
    getIslands(),
    supabase.from('restaurants').select('island_id'),
    supabase.from('photo_spots').select('island_id'),
  ])

  const richness: Record<string, number> = {}
  const tally = (rows: { island_id: string }[] | null) => {
    for (const row of rows ?? []) {
      richness[row.island_id] = (richness[row.island_id] ?? 0) + 1
    }
  }
  tally(restaurants.data)
  tally(photoSpots.data)

  return [...islands]
    .sort((a, b) => (richness[b.id] ?? 0) - (richness[a.id] ?? 0))
    .slice(0, limit)
}

export async function getIslandById(id: string): Promise<IslandDetail | null> {
  const { data, error } = await supabase
    .from('islands')
    .select(`
      *,
      attractions(* ),
      restaurants(*),
      accommodations(*),
      photo_spots(*)
    `)
    .eq('id', id)
    .single()

  if (error) return null

  return {
    ...data,
    attractions: (data.attractions ?? []).sort((a: Attraction, b: Attraction) => a.order_index - b.order_index),
    restaurants: (data.restaurants ?? []).sort((a: Restaurant, b: Restaurant) => a.order_index - b.order_index),
    accommodations: (data.accommodations ?? []).sort((a: Accommodation, b: Accommodation) => a.order_index - b.order_index),
    photo_spots: (data.photo_spots ?? []).sort((a: PhotoSpot, b: PhotoSpot) => a.order_index - b.order_index),
  }
}
