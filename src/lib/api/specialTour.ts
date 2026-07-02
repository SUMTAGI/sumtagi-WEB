// 한국관광공사_무장애여행정보
// 한국관광공사_반려동물_동반여행_데이터
// 생태관광: data.go.kr 미제공 → 국문관광정보 키워드 검색으로 대체
import { searchAttractions } from './tourApi'

const API_KEY = import.meta.env.VITE_FERRY_API_KEY as string

// 인천(areaCode=2) > 옹진군(sigunguCode=9)
const DEFAULT_AREA     = '2'
const DEFAULT_SIGUNGU  = '9'

export type SpecialTourType = 'eco' | 'barrier_free' | 'pet_friendly'

export interface SpecialTourItem {
  contentId:   string
  title:       string
  addr1:       string
  type:        SpecialTourType
  firstimage?: string
  mapx?:       number
  mapy?:       number
  tel?:        string
  tags:        string[]
}

const ENDPOINTS: Record<'barrier_free' | 'pet_friendly', string> = {
  barrier_free: 'https://apis.data.go.kr/B551011/KorWithService1/withList',
  pet_friendly: 'https://apis.data.go.kr/B551011/PetTourService1/petTourList',
}

function extractTags(type: SpecialTourType, item: any): string[] {
  const tags: string[] = []
  if (type === 'pet_friendly') {
    if (item.acmpyPsblCpam === 'Y')  tags.push('동반가능')
    if (item.relaFclty)              tags.push('반려동물 시설')
    if (item.acmpyTypeCd === '01')   tags.push('소형견')
    if (item.acmpyTypeCd === '02')   tags.push('중형견')
    if (item.acmpyTypeCd === '03')   tags.push('대형견')
  } else if (type === 'barrier_free') {
    if (item.wheelchair   === 'Y') tags.push('휠체어 가능')
    if (item.parking      === 'Y') tags.push('장애인 주차')
    if (item.elevator     === 'Y') tags.push('엘리베이터')
    if (item.toilet       === 'Y') tags.push('장애인 화장실')
    if (item.audioguide   === 'Y') tags.push('오디오가이드')
    if (item.brailleblock === 'Y') tags.push('점자블록')
  }
  return tags
}

const cache: Record<string, SpecialTourItem[]> = {}

// 무장애·반려동물 전용 API 호출
async function fetchSpecial(
  type:       'barrier_free' | 'pet_friendly',
  areaCode    = DEFAULT_AREA,
  sigunguCode = DEFAULT_SIGUNGU,
): Promise<SpecialTourItem[]> {
  const key = `${type}-${areaCode}-${sigunguCode}`
  if (cache[key]) return cache[key]

  const params = new URLSearchParams({
    serviceKey:  API_KEY,
    MobileOS:    'ETC',
    MobileApp:   'sumtagi',
    _type:       'json',
    numOfRows:   '30',
    pageNo:      '1',
    areaCode,
    sigunguCode,
    arrange:     'P',
  })

  try {
    const res  = await fetch(`${ENDPOINTS[type]}?${params}`)
    const json = await res.json()
    const raw  = json?.response?.body?.items?.item
    const list = Array.isArray(raw) ? raw : raw ? [raw] : []

    const result: SpecialTourItem[] = list.map((item: any) => ({
      contentId:  item.contentid  ?? '',
      title:      item.title      ?? '',
      addr1:      item.addr1      ?? '',
      type,
      firstimage: item.firstimage || undefined,
      mapx:       item.mapx  ? parseFloat(item.mapx)  : undefined,
      mapy:       item.mapy  ? parseFloat(item.mapy)  : undefined,
      tel:        item.tel   || undefined,
      tags:       extractTags(type, item),
    }))

    cache[key] = result
    return result
  } catch {
    return []
  }
}

// 생태관광: 국문관광정보 키워드 검색으로 대체 (생태·자연·탐방·트레킹)
async function fetchEcoTour(): Promise<SpecialTourItem[]> {
  const key = 'eco-keyword'
  if (cache[key]) return cache[key]

  try {
    const keywords = ['생태', '자연', '탐방', '트레킹']
    const results = await Promise.allSettled(keywords.map((kw) => searchAttractions(kw)))

    const seen = new Set<string>()
    const items: SpecialTourItem[] = []

    for (const r of results) {
      if (r.status !== 'fulfilled') continue
      for (const item of r.value) {
        if (seen.has(item.contentId)) continue
        seen.add(item.contentId)
        items.push({
          contentId:  item.contentId,
          title:      item.title,
          addr1:      item.addr1,
          type:       'eco',
          firstimage: item.firstimage,
          mapx:       item.mapx,
          mapy:       item.mapy,
          tel:        item.tel,
          tags:       ['자연생태'],
        })
      }
    }

    cache[key] = items
    return items
  } catch {
    return []
  }
}

/** 생태관광 장소 조회 */
export async function getEcoTourSpots(): Promise<SpecialTourItem[]> {
  return fetchEcoTour()
}

/** 무장애 여행 장소 조회 */
export async function getBarrierFreePlaces(
  areaCode?:    string,
  sigunguCode?: string,
): Promise<SpecialTourItem[]> {
  return fetchSpecial('barrier_free', areaCode, sigunguCode)
}

/** 반려동물 동반 가능 장소 조회 */
export async function getPetFriendlyPlaces(
  areaCode?:    string,
  sigunguCode?: string,
): Promise<SpecialTourItem[]> {
  return fetchSpecial('pet_friendly', areaCode, sigunguCode)
}

/** 여행 스타일에 맞는 특수 관광지 조회 */
export async function getSpecialTourByStyle(
  travelStyle: string,
  areaCode     = DEFAULT_AREA,
  sigunguCode  = DEFAULT_SIGUNGU,
): Promise<SpecialTourItem[]> {
  if (travelStyle === '생태')     return fetchEcoTour()
  if (travelStyle === '무장애')   return fetchSpecial('barrier_free', areaCode, sigunguCode)
  if (travelStyle === '반려동물') return fetchSpecial('pet_friendly', areaCode, sigunguCode)
  return []
}

/** 세 가지 특수 관광 유형 전체 병렬 조회 */
export async function getAllSpecialTour(
  areaCode    = DEFAULT_AREA,
  sigunguCode = DEFAULT_SIGUNGU,
): Promise<SpecialTourItem[]> {
  const [eco, bf, pet] = await Promise.allSettled([
    fetchEcoTour(),
    fetchSpecial('barrier_free', areaCode, sigunguCode),
    fetchSpecial('pet_friendly', areaCode, sigunguCode),
  ])
  return [
    ...(eco.status === 'fulfilled' ? eco.value : []),
    ...(bf.status  === 'fulfilled' ? bf.value  : []),
    ...(pet.status === 'fulfilled' ? pet.value : []),
  ]
}

/** 여행 스타일이 특수 여행 카테고리인지 확인 */
export function isSpecialTravelStyle(style: string): boolean {
  return ['생태', '무장애', '반려동물'].includes(style)
}

export const SPECIAL_STYLE_LABELS: Record<SpecialTourType, string> = {
  eco:          '생태관광',
  barrier_free: '무장애여행',
  pet_friendly: '반려동물동반',
}
