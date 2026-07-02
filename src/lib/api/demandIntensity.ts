// 한국관광공사_지역별관광수요강도
// 한국관광공사_관광빅데이터정보서비스 (월별 수요 추세 용도 포함)
const DEMAND_URL  = 'https://apis.data.go.kr/B551011/TatsDmndItnsService/tatsDmndItnsList'
const BIGDATA_URL = 'https://apis.data.go.kr/B551011/TatsBigdataService/tatsBigdataList'
const API_KEY     = import.meta.env.VITE_FERRY_API_KEY as string

export interface DemandIntensity {
  areaCd:    string
  signguCd:  string
  signguNm:  string
  yyyymm:    string
  dmndIntns: number          // 0~1 정규화
  level:     'low' | 'medium' | 'high'
}

export interface BigdataMonthly {
  yyyymm:       string
  islandId:     string
  islandName:   string
  visitorIndex: number       // 수요강도 0~100 (방문자 수 대용)
}

// 섬 ID → [areaCd, signguCd, 키워드, 표시명]
const ISLAND_DEMAND_MAP: Record<string, [string, string, string, string]> = {
  baengnyeong: ['28', '28720', '백령', '백령도'],
  daecheong:   ['28', '28720', '대청', '대청도'],
  socheong:    ['28', '28720', '소청', '소청도'],
  yeonpyeong:  ['28', '28720', '연평', '연평도'],
  deokjeok:    ['28', '28720', '덕적', '덕적도'],
  jawol:       ['28', '28720', '자월', '자월도'],
  seungbong:   ['28', '28720', '승봉', '승봉도'],
  daeijak:     ['28', '28720', '대이작', '대이작도'],
  soijak:      ['28', '28720', '소이작', '소이작도'],
  yeonghung:   ['28', '28720', '영흥', '영흥도'],
  pungdo:      ['41', '41390', '풍', '풍도'],
  yukdo:       ['41', '41390', '육', '육도'],
  guleop:      ['28', '28720', '굴업', '굴업도'],
}

const MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function getLevel(v: number): 'low' | 'medium' | 'high' {
  if (v >= 0.65) return 'high'
  if (v >= 0.35) return 'medium'
  return 'low'
}

function currentYYYYMM(): string {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
}

function prevYYYYMM(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
}

// 지역별 세션 캐시
const demandCache: Record<string, DemandIntensity[]> = {}

/** 특정 지역의 수요강도 조회 (최근 N개월) */
export async function getRegionalDemandIntensity(
  areaCd:   string,
  signguCd: string,
  months    = 12,
): Promise<DemandIntensity[]> {
  const key = `${areaCd}-${signguCd}-${months}`
  if (demandCache[key]) return demandCache[key]

  const startYm = prevYYYYMM(months - 1)
  const endYm   = currentYYYYMM()

  const params = new URLSearchParams({
    serviceKey: API_KEY,
    MobileOS:   'ETC',
    MobileApp:  'sumtagi',
    _type:      'json',
    numOfRows:  String(months + 5),
    pageNo:     '1',
    areaCd,
    signguCd,
    startYm,
    endYm,
  })

  try {
    const res  = await fetch(`${DEMAND_URL}?${params}`)
    const json = await res.json()
    const raw  = json?.response?.body?.items?.item
    const list: any[] = Array.isArray(raw) ? raw : raw ? [raw] : []

    const result: DemandIntensity[] = list.map((item) => {
      const raw = parseFloat(item.dmndIntns ?? item.dmnd_intns ?? '0')
      const v   = raw > 1 ? raw / 100 : raw
      return {
        areaCd:   item.areaCd   ?? areaCd,
        signguCd: item.signguCd ?? signguCd,
        signguNm: item.signguNm ?? '',
        yyyymm:   item.baseYm   ?? item.yyyymm ?? '',
        dmndIntns: Math.min(Math.max(v, 0), 1),
        level:     getLevel(v),
      }
    }).sort((a, b) => a.yyyymm.localeCompare(b.yyyymm))

    demandCache[key] = result
    return result
  } catch {
    return []
  }
}

/** 섬 ID 기준 현재 수요강도 레벨 반환 */
export async function getIslandDemandLevel(
  islandId: string,
): Promise<'low' | 'medium' | 'high' | null> {
  const config = ISLAND_DEMAND_MAP[islandId]
  if (!config) return null
  const [areaCd, signguCd] = config
  const data = await getRegionalDemandIntensity(areaCd, signguCd, 1)
  return data.length ? data[data.length - 1].level : null
}

/** 모든 섬의 현재 수요강도를 병렬 조회 */
export async function getAllIslandsDemand(): Promise<Record<string, 'low' | 'medium' | 'high'>> {
  // 지역별로 중복 없이 조회
  const regionKeys = [...new Set(
    Object.values(ISLAND_DEMAND_MAP).map(([a, s]) => `${a}-${s}`)
  )]

  await Promise.allSettled(
    regionKeys.map((key) => {
      const [areaCd, signguCd] = key.split('-')
      return getRegionalDemandIntensity(areaCd, signguCd, 1)
    })
  )

  const result: Record<string, 'low' | 'medium' | 'high'> = {}
  for (const [islandId, [areaCd, signguCd, , ]] of Object.entries(ISLAND_DEMAND_MAP)) {
    const key  = `${areaCd}-${signguCd}-1`
    const data = demandCache[key] ?? []
    if (data.length) result[islandId] = data[data.length - 1].level
  }
  return result
}

/**
 * 관광빅데이터 기반 월별 방문 지수 (VisitorTrendsChart 용)
 * 관광빅데이터 API 응답이 없을 경우 수요강도 지수로 대체
 */
export async function getMonthlyVisitorIndex(
  islandIds: string[],
): Promise<{ month: string; [islandName: string]: number | string }[]> {
  // 최근 12개월 수요강도 데이터를 섬별로 조회
  const islandData = await Promise.allSettled(
    islandIds.map(async (id) => {
      const cfg  = ISLAND_DEMAND_MAP[id]
      if (!cfg) return { id, name: id, data: [] as DemandIntensity[] }
      const [areaCd, signguCd, , name] = cfg
      const data = await getRegionalDemandIntensity(areaCd, signguCd, 12)
      return { id, name, data }
    })
  )

  // 최근 12개월 레이블 생성
  const months: { label: string; yyyymm: string }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push({
      label:  MONTHS_KO[d.getMonth()],
      yyyymm: `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`,
    })
  }

  return months.map(({ label, yyyymm }) => {
    const row: { month: string; [k: string]: number | string } = { month: label }
    for (const entry of islandData) {
      if (entry.status !== 'fulfilled') continue
      const { name, data } = entry.value
      const point = data.find((d) => d.yyyymm === yyyymm)
      row[name] = point ? Math.round(point.dmndIntns * 100) : 0
    }
    return row
  })
}

/** 빅데이터 API 직접 호출 (관광빅데이터정보서비스) */
export async function fetchTourBigdata(areaCd: string, signguCd: string): Promise<object[]> {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    MobileOS:   'ETC',
    MobileApp:  'sumtagi',
    _type:      'json',
    numOfRows:  '12',
    pageNo:     '1',
    areaCd,
    signguCd,
  })
  try {
    const res  = await fetch(`${BIGDATA_URL}?${params}`)
    const json = await res.json()
    const raw  = json?.response?.body?.items?.item
    return Array.isArray(raw) ? raw : raw ? [raw] : []
  } catch {
    return []
  }
}
