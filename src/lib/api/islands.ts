import { supabase } from '../supabase'

export interface Island {
  id: string
  name: string
  description: string
  features: string[]
  ferry_time: string
  ferry_price: number
  popularity_trend: 'up' | 'down' | 'stable'
  congestion: 'low' | 'medium' | 'high'
  best_season: string
  image: string
  ports: string[]
  lat?: number
  lng?: number
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
