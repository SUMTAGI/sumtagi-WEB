// 여행 기간 중 여객선 결항·기상 악화 위험을 감지한다.
// 정부 실시간 결항 데이터(B554035)는 "오늘" 하루치만 제공하므로, 오늘이 여행 기간에
// 포함될 때만 "결항 확정"으로 판단한다. 그 외 날짜는 Open-Meteo 예보(최대 6일)로
// 강수확률이 높으면 "결항 가능성"으로만 표기한다(확정 아님, 과신 금지).
import { supabase } from './supabase'
import { getHomeFerryStatus } from './api/ferry'
import { fetchWeatherForIsland } from './weatherService'
import { ISLAND_ID_TO_KOR } from '../app/utils/itineraryGenerator'

const KOR_TO_ISLAND_ID: Record<string, string> = Object.fromEntries(
  Object.entries(ISLAND_ID_TO_KOR).map(([id, name]) => [name, id])
)

// 다리로 연결돼 여객선 자체가 없는 섬(CreateTrip.tsx의 "육로 이동" 매핑과 동일) — 결항 위험 대상에서 제외
const BRIDGE_CONNECTED = new Set(['영흥도', '선재도', '시도', '모도', '소야도'])

export interface TripRisk {
  island: string
  date: string       // "YYYY-MM-DD"
  level: 'cancelled' | 'forecast'
  message: string
}

function todayKstDateStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }) // "YYYY-MM-DD"
}

function daysFromToday(dateStr: string): number {
  const today = new Date(todayKstDateStr() + 'T00:00:00+09:00')
  const target = new Date(dateStr + 'T00:00:00+09:00')
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

/** islands: 여행에 포함된 섬(한국어 이름), startDate/endDate: "YYYY-MM-DD" */
export async function checkTripRisks(
  islands: string[],
  startDate: string,
  endDate: string,
): Promise<TripRisk[]> {
  const risks: TripRisk[] = []
  const ferryIslands = islands.filter(name => !BRIDGE_CONNECTED.has(name))
  if (ferryIslands.length === 0 || !startDate || !endDate) return risks

  const today = todayKstDateStr()
  const tripStartOffset = daysFromToday(startDate)
  const tripEndOffset = daysFromToday(endDate)

  // 여행 기간이 이미 끝났거나(과거) 6일보다 뒤에 시작하면 확인 가능한 데이터가 없음
  if (tripEndOffset < 0 || tripStartOffset > 5) return risks

  // 1) 오늘이 여행 기간에 포함되면 실시간 결항 여부 확인
  if (tripStartOffset <= 0 && tripEndOffset >= 0) {
    const statuses = await getHomeFerryStatus()
    for (const island of ferryIslands) {
      const s = statuses.find(x => x.islandName === island)
      if (s?.status === '결항') {
        risks.push({ island, date: today, level: 'cancelled', message: `${island} 여객선이 오늘 결항됐어요` })
      }
    }
  }

  // 2) 내일~5일 후 중 여행 기간과 겹치는 날짜는 강수 예보로 위험만 추정
  const forecastOffsets = [1, 2, 3, 4, 5].filter(o => o >= tripStartOffset && o <= tripEndOffset)
  if (forecastOffsets.length === 0) return risks

  const islandIds = ferryIslands.map(name => KOR_TO_ISLAND_ID[name]).filter((v): v is string => !!v)
  if (islandIds.length === 0) return risks

  const { data: coords } = await supabase.from('islands').select('id, lat, lng').in('id', islandIds)
  const coordMap = new Map((coords ?? []).map((c: any) => [c.id, c]))

  for (const islandId of islandIds) {
    const coord = coordMap.get(islandId)
    const weather = await fetchWeatherForIsland(islandId, coord?.lat, coord?.lng)
    if (!weather) continue
    for (const offset of forecastOffsets) {
      const forecastDay = weather.forecast[offset - 1] // forecast[0] = 내일(offset 1)
      if (!forecastDay) continue
      if (forecastDay.rainChance >= 70 || forecastDay.condition === '비') {
        const island = ISLAND_ID_TO_KOR[islandId]
        const date = new Date(today + 'T00:00:00+09:00')
        date.setDate(date.getDate() + offset)
        risks.push({
          island,
          date: date.toISOString().slice(0, 10),
          level: 'forecast',
          message: `${island} ${forecastDay.date} 강수확률 ${forecastDay.rainChance}%로 결항 가능성이 있어요`,
        })
      }
    }
  }

  return risks
}
