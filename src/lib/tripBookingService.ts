// 여객선/숙박/식당 예약 준비 체크리스트.
// 앱이 실제로 예약(결제/좌석확보)을 대신 해주지 않는다 — 여객선 예매 시스템(가보고싶은섬)과
// 섬 펜션·식당 대부분이 전화 예약만 가능한 폐쇄형 구조라 외부 연동이 불가능하기 때문.
// 대신 연락처/딥링크를 안내하고, 사용자가 직접 예약한 뒤 "완료"로 표시하는 개인 기록용 체크리스트.
import { supabase } from './supabase'
import { ISLAND_ID_TO_KOR, type ItineraryDay } from '../app/utils/itineraryGenerator'

const uid = async () => (await supabase.auth.getUser()).data.user?.id

const KOR_TO_ISLAND_ID: Record<string, string> = Object.fromEntries(
  Object.entries(ISLAND_ID_TO_KOR).map(([id, name]) => [name, id])
)

// 한국해운조합이 운영하는 실제 여객선 예매 시스템. 노선별 딥링크 파라미터는 확인 불가해 메인 예매 페이지로 연결.
const FERRY_BOOKING_URL = 'https://island.theksa.co.kr/page/booking'

export type BookingCategory = 'ferry' | 'accommodation' | 'restaurant' | 'experience'

export interface TripBooking {
  id: string
  trip_id: string
  category: BookingCategory
  name: string
  island_id: string | null
  phone: string | null
  external_url: string | null
  is_done: boolean
  order_index: number
}

// 일정(days)의 활동에서 실제로 이름이 나온 숙소/식당 후보를 뽑음.
// AI 생성 일정은 activity.location에 실제 상호명이 들어있을 수 있지만(관광공사/DB 연동),
// 규칙 기반(빠른 생성) 일정은 "섬 이름"/일반 문구뿐이라 아래에서 DB 매칭이 그냥 실패하고
// 기존처럼 섬 대표 숙소·식당으로 자연스럽게 폴백됨.
function extractNamedCandidates(days: ItineraryDay[] | undefined, type: 'accommodation' | 'meal'): string[] {
  if (!days) return []
  const names = new Set<string>()
  for (const day of days) {
    for (const act of day.activities) {
      if (act.type === type && act.location) names.add(act.location)
    }
  }
  return [...names]
}

async function generateChecklist(
  tripId: string, userId: string, islands: string[], departurePort: string, days?: ItineraryDay[]
) {
  const rows: Omit<TripBooking, 'id'>[] = []

  if (departurePort && departurePort !== '육로 이동') {
    rows.push({
      trip_id: tripId, category: 'ferry', name: `${departurePort} 여객선 예매`,
      island_id: null, phone: null, external_url: FERRY_BOOKING_URL,
      is_done: false, order_index: 0,
    })
  }

  const islandIds = islands.map(name => KOR_TO_ISLAND_ID[name]).filter((v): v is string => !!v)
  const accomCandidates = extractNamedCandidates(days, 'accommodation')
  const mealCandidates = extractNamedCandidates(days, 'meal')

  for (const islandId of islandIds) {
    const [accMatched, restMatched] = await Promise.all([
      accomCandidates.length > 0
        ? supabase.from('accommodations').select('name, phone').eq('island_id', islandId).in('name', accomCandidates)
        : Promise.resolve({ data: [] as { name: string; phone: string | null }[] }),
      mealCandidates.length > 0
        ? supabase.from('restaurants').select('name, phone').eq('island_id', islandId).in('name', mealCandidates)
        : Promise.resolve({ data: [] as { name: string; phone: string | null }[] }),
    ])

    // 일정에 실제로 등장한 이름이 DB와 매칭되면 그걸 쓰고, 하나도 안 맞으면(규칙 기반 일정처럼
    // 일반 문구뿐인 경우) 섬 대표 숙소/식당 상위 2곳으로 폴백.
    const [{ data: accs }, { data: rests }] = await Promise.all([
      (accMatched.data && accMatched.data.length > 0)
        ? Promise.resolve(accMatched)
        : supabase.from('accommodations').select('name, phone').eq('island_id', islandId).order('order_index').limit(2),
      (restMatched.data && restMatched.data.length > 0)
        ? Promise.resolve(restMatched)
        : supabase.from('restaurants').select('name, phone').eq('island_id', islandId).order('order_index').limit(2),
    ])
    for (const [i, a] of (accs ?? []).entries()) {
      rows.push({
        trip_id: tripId, category: 'accommodation', name: a.name, island_id: islandId,
        phone: a.phone ?? null, external_url: null, is_done: false, order_index: 10 + i,
      })
    }
    for (const [i, r] of (rests ?? []).entries()) {
      rows.push({
        trip_id: tripId, category: 'restaurant', name: r.name, island_id: islandId,
        phone: r.phone ?? null, external_url: null, is_done: false, order_index: 20 + i,
      })
    }
  }

  if (rows.length === 0) return
  const { error } = await supabase.from('trip_bookings').insert(rows.map(r => ({ ...r, user_id: userId })))
  if (error) console.error('generateChecklist error:', error)
}

export const tripBookingService = {
  getChecklist: async (
    tripId: string, islands: string[], departurePort: string, days?: ItineraryDay[]
  ): Promise<TripBooking[]> => {
    const userId = await uid()
    if (!userId) return []

    const { data, error } = await supabase.from('trip_bookings').select().eq('trip_id', tripId).order('order_index')
    if (error) { console.error('getChecklist error:', error); return [] }
    if (data && data.length > 0) return data

    await generateChecklist(tripId, userId, islands, departurePort, days)
    const { data: seeded, error: reloadError } = await supabase.from('trip_bookings').select().eq('trip_id', tripId).order('order_index')
    if (reloadError) console.error('reload trip_bookings error:', reloadError)
    return seeded ?? []
  },

  toggle: async (bookingId: string, current: boolean) => {
    const { error } = await supabase.from('trip_bookings').update({ is_done: !current }).eq('id', bookingId)
    if (error) console.error('toggle trip_booking error:', error)
  },
}
