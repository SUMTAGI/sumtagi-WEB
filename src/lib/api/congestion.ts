const BASE_URL = 'https://apis.data.go.kr/B551011/TatsCnctrRateService/tatsCnctrRatedList'
const API_KEY = import.meta.env.VITE_FERRY_API_KEY as string

export interface CongestionForecast {
  date: string
  dayLabel: string
  rate: number
  level: 'low' | 'medium' | 'high'
}

export interface IslandCongestionData {
  todayLevel: 'low' | 'medium' | 'high'
  forecast: CongestionForecast[]
}

// 섬 ID → [areaCd, signguCd, 매칭 키워드]
const ISLAND_CONFIG: Record<string, [string, string, string]> = {
  baengnyeong: ['28', '28720', '백령'],
  daecheong:   ['28', '28720', '대청'],
  socheong:    ['28', '28720', '소청'],
  yeonpyeong:  ['28', '28720', '연평'],
  deokjeok:    ['28', '28720', '덕적'],
  jawol:       ['28', '28720', '자월'],
  seungbong:   ['28', '28720', '승봉'],
  daeijak:     ['28', '28720', '대이작'],
  soijak:      ['28', '28720', '소이작'],
  yeonghung:   ['28', '28720', '영흥'],
  seonjae:     ['28', '28720', '선재'],
  guleop:      ['28', '28720', '굴업'],
  pungdo:      ['41', '41390', '풍도'],
  yukdo:       ['41', '41390', '육도'],
}

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

function getLevel(rate: number): 'low' | 'medium' | 'high' {
  if (rate >= 0.65) return 'high'
  if (rate >= 0.35) return 'medium'
  return 'low'
}

function getDayLabel(yyyyMMdd: string): string {
  try {
    const y = parseInt(yyyyMMdd.slice(0, 4))
    const m = parseInt(yyyyMMdd.slice(4, 6)) - 1
    const d = parseInt(yyyyMMdd.slice(6, 8))
    const date = new Date(y, m, d)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = Math.round((date.getTime() - today.getTime()) / 86400000)
    if (diff === 0) return '오늘'
    if (diff === 1) return '내일'
    return WEEKDAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]
  } catch {
    return ''
  }
}

// 세션 캐시 (areaCd-signguCd → items)
const cache: Record<string, object[]> = {}

async function fetchRegion(areaCd: string, signguCd: string): Promise<object[]> {
  const key = `${areaCd}-${signguCd}`
  if (cache[key]) return cache[key]

  const params = (extra: Record<string, string>) =>
    new URLSearchParams({
      serviceKey: API_KEY,
      MobileOS: 'ETC',
      MobileApp: 'sumtagi',
      _type: 'json',
      areaCd,
      signguCd,
      ...extra,
    })

  // totalCount 확인
  const countRes = await fetch(`${BASE_URL}?${params({ numOfRows: '1', pageNo: '1' })}`)
  const countJson = await countRes.json()
  const totalCount: number = countJson?.response?.body?.totalCount ?? 0
  if (totalCount === 0) { cache[key] = []; return [] }

  const pages = Math.ceil(totalCount / 500)
  const all: object[] = []
  for (let p = 1; p <= pages; p++) {
    const res = await fetch(`${BASE_URL}?${params({ numOfRows: '500', pageNo: String(p) })}`)
    const json = await res.json()
    const items = json?.response?.body?.items?.item
    if (!items) continue
    all.push(...(Array.isArray(items) ? items : [items]))
  }

  cache[key] = all
  return all
}

function processItems(items: object[], keyword: string): IslandCongestionData | null {
  const matched = items.filter((item: any) => (item.tAtsNm ?? '').includes(keyword))
  if (matched.length === 0) return null

  const byDate: Record<string, number[]> = {}
  for (const item of matched as any[]) {
    const raw = item.cnctrRate
    const rate = (typeof raw === 'number' ? raw : parseFloat(String(raw ?? '0'))) / 100
    const date: string = item.baseYmd ?? ''
    if (!date) continue
    ;(byDate[date] ??= []).push(Math.min(Math.max(rate, 0), 1))
  }

  const forecast: CongestionForecast[] = Object.entries(byDate)
    .map(([date, rates]) => {
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length
      return { date, dayLabel: getDayLabel(date), rate: avg, level: getLevel(avg) }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7)

  return {
    todayLevel: forecast[0]?.level ?? 'low',
    forecast,
  }
}

export async function getIslandCongestion(islandId: string): Promise<IslandCongestionData | null> {
  const config = ISLAND_CONFIG[islandId]
  if (!config) return null
  const [areaCd, signguCd, keyword] = config
  const items = await fetchRegion(areaCd, signguCd)
  return processItems(items, keyword)
}

export async function getAllIslandsCongestion(): Promise<Record<string, IslandCongestionData>> {
  // 지역별 중복 없이 병렬 fetch
  const regionKeys = [...new Set(Object.values(ISLAND_CONFIG).map(([a, s]) => `${a}-${s}`))]
  await Promise.all(regionKeys.map(key => {
    const [areaCd, signguCd] = key.split('-')
    return fetchRegion(areaCd, signguCd)
  }))

  const result: Record<string, IslandCongestionData> = {}
  for (const [islandId, [areaCd, signguCd, keyword]] of Object.entries(ISLAND_CONFIG)) {
    const items = cache[`${areaCd}-${signguCd}`] ?? []
    const data = processItems(items, keyword)
    if (data) result[islandId] = data
  }
  return result
}
