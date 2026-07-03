// 한국관광공사_관광지별 연관관광지정보
// 특정 관광지와 거리·카테고리 기반으로 연관된 인근 관광지를 제공
const BASE_URL = 'https://apis.data.go.kr/B551011/TatsAtsRlatService/tatsAtsRlatList'
const API_KEY  = import.meta.env.VITE_FERRY_API_KEY as string

export interface RelatedAttraction {
  contentId:      string // 원본 관광지 contentId
  contentTypeId:  string
  tAtsNm:         string // 원본 관광지명
  rlatContentId:  string // 연관 관광지 contentId
  rlatAtsNm:      string // 연관 관광지명
  rlatContentType: string
  rlatDist:       number // 거리 (m)
  rlatAddr:       string
  rlatImage?:     string
}

// 섬 이름 → TourAPI contentId 매핑 (최초 조회 후 캐시)
// 실제 contentId는 KorService1/areaBasedList1 에서 가져와야 함
const ISLAND_CONTENT_IDS: Record<string, string> = {
  baengnyeong: '126508', // 백령도
  daecheong:   '126514', // 대청도
  socheong:    '126518', // 소청도
  yeonpyeong:  '126520', // 연평도
  deokjeok:    '126528', // 덕적도
  jawol:       '126534', // 자월도
  seungbong:   '126538', // 승봉도
  daeijak:     '126542', // 대이작도
  soijak:      '126544', // 소이작도
  yeonghung:   '126550', // 영흥도
  pungdo:      '128899', // 풍도
  guleop:      '126546', // 굴업도
  seonjae:     '127851', // 선재도(선재도 어촌체험마을)
  jangbongdo:  '128005', // 장봉도
  soya:        '2782222', // 소야도
  uldo:        '128004', // 울도
  // yukdo, sindo, sido, modo, mungap, baegado: 관광공사 API에 섬 단위 contentId가 없어(관광지 자체가 없거나 동명이인 지역과 혼동) 미등록
}

const cache: Record<string, RelatedAttraction[]> = {}

function normalizeItems(raw: unknown): any[] {
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

/** contentId 기준 연관관광지 조회 */
export async function getRelatedAttractions(contentId: string): Promise<RelatedAttraction[]> {
  if (cache[contentId]) return cache[contentId]

  const params = new URLSearchParams({
    serviceKey:  API_KEY,
    MobileOS:    'ETC',
    MobileApp:   'sumtagi',
    _type:       'json',
    numOfRows:   '10',
    pageNo:      '1',
    contentId,
  })

  const res  = await fetch(`${BASE_URL}?${params}`)
  const json = await res.json()
  const raw  = json?.response?.body?.items?.item

  const result: RelatedAttraction[] = normalizeItems(raw).map((item: any) => ({
    contentId:       item.contentid       ?? contentId,
    contentTypeId:   item.contenttypeid   ?? '',
    tAtsNm:          item.tAtsNm          ?? item.title ?? '',
    rlatContentId:   item.rlatContentId   ?? item.rlatcontentid ?? '',
    rlatAtsNm:       item.rlatAtsNm       ?? item.rlattitle ?? '',
    rlatContentType: item.rlatContentType ?? '',
    rlatDist:        parseFloat(item.rlatDist ?? item.dist ?? '0'),
    rlatAddr:        item.rlatAddr        ?? item.addr1 ?? '',
    rlatImage:       item.rlatFirstimage  || undefined,
  }))

  cache[contentId] = result
  return result
}

/** 섬 ID 기준 연관관광지 조회 (ISLAND_CONTENT_IDS 매핑 사용) */
export async function getRelatedByIslandId(islandId: string): Promise<RelatedAttraction[]> {
  const contentId = ISLAND_CONTENT_IDS[islandId]
  if (!contentId) return []
  return getRelatedAttractions(contentId)
}

/**
 * 여러 섬의 연관관광지를 병렬 조회해 일정 생성 엔진용 코스 힌트를 반환
 * 반환값: { [islandId]: [연관관광지명, ...] }
 */
export async function buildRoutingHints(islandIds: string[]): Promise<Record<string, string[]>> {
  const entries = await Promise.allSettled(
    islandIds.map(async (id) => {
      const related = await getRelatedByIslandId(id)
      return [id, related.map((r) => r.rlatAtsNm)] as [string, string[]]
    })
  )
  const hints: Record<string, string[]> = {}
  for (const entry of entries) {
    if (entry.status === 'fulfilled') {
      const [id, names] = entry.value
      hints[id] = names
    }
  }
  return hints
}
