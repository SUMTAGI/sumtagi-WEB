// 한국관광공사 국문관광정보서비스 (KorService2)
// 기초지자체중심관광지정보 포함
const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2'
const BASE_GUN_URL = 'https://apis.data.go.kr/B551011/TourBasedList/TourBasedListByGun'
const API_KEY = import.meta.env.VITE_FERRY_API_KEY as string

// 인천광역시(2) > 옹진군(9)
const INCHEON_AREA_CODE = '2'
const ONGJIN_SIGUNGU_CODE = '9'

export const CONTENT_TYPE = {
  ATTRACTION:    '12', // 관광지
  CULTURE:       '14', // 문화시설
  FESTIVAL:      '15', // 축제·공연·행사
  COURSE:        '25', // 여행코스
  SPORTS:        '28', // 레포츠
  ACCOMMODATION: '32', // 숙박
  SHOPPING:      '38', // 쇼핑
  RESTAURANT:    '39', // 음식점
} as const

export type ContentTypeId = (typeof CONTENT_TYPE)[keyof typeof CONTENT_TYPE]

export interface TourItem {
  contentId: string
  contentTypeId: string
  title: string
  addr1: string
  addr2?: string
  tel?: string
  firstimage?: string
  firstimage2?: string
  cat1: string
  cat2: string
  cat3: string
  mapx?: number
  mapy?: number
  dist?: number
}

export interface LocalGovTourItem {
  contentId: string
  title: string
  addr1: string
  tel?: string
  firstimage?: string
  mapx?: number
  mapy?: number
  cat1: string
  cat3: string
}

function commonParams(extra: Record<string, string> = {}): URLSearchParams {
  return new URLSearchParams({
    serviceKey: API_KEY,
    MobileOS:   'ETC',
    MobileApp:  'sumtagi',
    _type:      'json',
    numOfRows:  '50',
    pageNo:     '1',
    ...extra,
  })
}

function normalizeItems(raw: unknown): any[] {
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

function mapTourItem(item: any): TourItem {
  return {
    contentId:     item.contentid   ?? '',
    contentTypeId: item.contenttypeid ?? '',
    title:         item.title       ?? '',
    addr1:         item.addr1       ?? '',
    addr2:         item.addr2       || undefined,
    tel:           item.tel         || undefined,
    firstimage:    item.firstimage  || undefined,
    firstimage2:   item.firstimage2 || undefined,
    cat1:          item.cat1        ?? '',
    cat2:          item.cat2        ?? '',
    cat3:          item.cat3        ?? '',
    mapx:          item.mapx  ? parseFloat(item.mapx)  : undefined,
    mapy:          item.mapy  ? parseFloat(item.mapy)  : undefined,
    dist:          item.dist  ? parseFloat(item.dist)  : undefined,
  }
}

/** 옹진군 지역 관광정보 목록 조회 */
export async function getIslandAttractions(
  contentTypeId?: ContentTypeId,
  areaCode    = INCHEON_AREA_CODE,
  sigunguCode = ONGJIN_SIGUNGU_CODE,
): Promise<TourItem[]> {
  const params = commonParams({
    areaCode,
    sigunguCode,
    arrange: 'P', // 인기순
    ...(contentTypeId ? { contentTypeId } : {}),
  })
  const res  = await fetch(`${BASE_URL}/areaBasedList2?${params}`)
  const json = await res.json()
  const raw  = json?.response?.body?.items?.item
  return normalizeItems(raw).map(mapTourItem)
}

/** 공통정보 상세 조회 */
export async function getAttractionDetail(contentId: string): Promise<TourItem | null> {
  const params = commonParams({ contentId })
  const res  = await fetch(`${BASE_URL}/detailCommon2?${params}`)
  const json = await res.json()
  const raw  = json?.response?.body?.items?.item
  const list = normalizeItems(raw)
  return list.length ? mapTourItem(list[0]) : null
}

/** 소개정보 상세 조회 (contentTypeId별 상세 항목) */
export async function getAttractionIntro(contentId: string, contentTypeId: ContentTypeId): Promise<object | null> {
  const params = commonParams({ contentId, contentTypeId })
  const res  = await fetch(`${BASE_URL}/detailIntro2?${params}`)
  const json = await res.json()
  const raw  = json?.response?.body?.items?.item
  const list = normalizeItems(raw)
  return list.length ? list[0] : null
}

/** 키워드 검색 */
export async function searchAttractions(keyword: string, contentTypeId?: ContentTypeId): Promise<TourItem[]> {
  const params = commonParams({
    keyword,
    areaCode:    INCHEON_AREA_CODE,
    sigunguCode: ONGJIN_SIGUNGU_CODE,
    ...(contentTypeId ? { contentTypeId } : {}),
  })
  const res  = await fetch(`${BASE_URL}/searchKeyword2?${params}`)
  const json = await res.json()
  const raw  = json?.response?.body?.items?.item
  return normalizeItems(raw).map(mapTourItem)
}

/** 행사/축제 목록 (이달의 행사) */
export async function getIslandFestivals(
  eventStartDate?: string,
  areaCode    = INCHEON_AREA_CODE,
  sigunguCode = ONGJIN_SIGUNGU_CODE,
): Promise<TourItem[]> {
  const today = new Date()
  const yyyymmdd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const params = commonParams({
    areaCode,
    sigunguCode,
    contentTypeId: CONTENT_TYPE.FESTIVAL,
    eventStartDate: eventStartDate ?? yyyymmdd,
    arrange: 'A',
  })
  const res  = await fetch(`${BASE_URL}/searchFestival2?${params}`)
  const json = await res.json()
  const raw  = json?.response?.body?.items?.item
  return normalizeItems(raw).map(mapTourItem)
}

/** 기초지자체중심관광지정보 (옹진군 군 단위 관광지) */
export async function getLocalGovTourList(gunCd = '28720'): Promise<LocalGovTourItem[]> {
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    MobileOS:   'ETC',
    MobileApp:  'sumtagi',
    _type:      'json',
    numOfRows:  '50',
    pageNo:     '1',
    gunCd,
  })
  const res  = await fetch(`${BASE_GUN_URL}?${params}`)
  const json = await res.json()
  const raw  = json?.response?.body?.items?.item
  return normalizeItems(raw).map((item: any) => ({
    contentId:  item.contentid  ?? '',
    title:      item.title      ?? '',
    addr1:      item.addr1      ?? '',
    tel:        item.tel        || undefined,
    firstimage: item.firstimage || undefined,
    mapx:       item.mapx  ? parseFloat(item.mapx)  : undefined,
    mapy:       item.mapy  ? parseFloat(item.mapy)  : undefined,
    cat1:       item.cat1  ?? '',
    cat3:       item.cat3  ?? '',
  }))
}
