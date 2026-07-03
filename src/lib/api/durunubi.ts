// 한국관광공사_두루누비정보서비스
// 섬 내 도보/트레킹 코스 정보 및 이동 소요시간 계산에 활용
const BASE_URL = 'https://apis.data.go.kr/B551011/Durunubi/courseList'
const API_KEY  = import.meta.env.VITE_FERRY_API_KEY as string

export interface DurunubiCourse {
  courseId:    string
  courseName:  string
  sido:        string
  gungu:       string
  theme:       string        // 코스 테마 (생태, 역사, 문화 등)
  distanceKm:  number        // 총 거리 (km)
  durationMin: number        // 예상 소요시간 (분)
  difficulty:  'easy' | 'medium' | 'hard'
  summary:     string
  waypoints:   CourseWaypoint[]
}

export interface CourseWaypoint {
  name:    string
  lat?:    number
  lng?:    number
  orderNo: number
}

// 인천광역시 시도코드 (두루누비 API 기준)
const INCHEON_SIDO = '인천광역시'
const ONGJIN_GUNGU = '옹진군'

// 섬 이름 → 두루누비 군구 검색 키워드
const ISLAND_GUNGU_KEYWORDS: Record<string, string> = {
  baengnyeong: '백령',
  daecheong:   '대청',
  socheong:    '소청',
  yeonpyeong:  '연평',
  deokjeok:    '덕적',
  jawol:       '자월',
  seungbong:   '승봉',
  daeijak:     '대이작',
  soijak:      '소이작',
  pungdo:      '풍도',
  yukdo:       '육도',
  yeonghung:   '영흥',
  seonjae:     '선재',
  guleop:      '굴업',
  sindo:       '신도',
  sido:        '시도',
  modo:        '모도',
  jangbongdo:  '장봉',
  soya:        '소야',
  mungap:      '문갑',
  baegado:     '백아',
  uldo:        '울도',
}

const courseCache: Record<string, DurunubiCourse[]> = {}

function parseDifficulty(raw: string | number): 'easy' | 'medium' | 'hard' {
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10)
  if (isNaN(n) || n <= 1) return 'easy'
  if (n <= 2) return 'medium'
  return 'hard'
}

function parseDistance(raw: string | number | undefined): number {
  if (raw === undefined || raw === null) return 0
  const s = String(raw).replace(/[^\d.]/g, '')
  return parseFloat(s) || 0
}

function parseDuration(raw: string | number | undefined): number {
  if (raw === undefined || raw === null) return 0
  // "120분", "2시간", "2:00" 등 다양한 형식 처리
  const s = String(raw)
  const hourMatch   = s.match(/(\d+)\s*시간/)
  const minuteMatch = s.match(/(\d+)\s*분/)
  const colonMatch  = s.match(/^(\d+):(\d+)$/)

  if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2])
  let total = 0
  if (hourMatch)   total += parseInt(hourMatch[1]) * 60
  if (minuteMatch) total += parseInt(minuteMatch[1])
  return total || (parseFloat(String(raw)) || 0)
}

function mapCourse(item: any): DurunubiCourse {
  const waypoints: CourseWaypoint[] = []

  // 경유지 파싱 (courseDetailInfo 배열 또는 단일 항목)
  const details = item.courseDetailInfo
  if (details) {
    const list = Array.isArray(details) ? details : [details]
    list.forEach((d: any, i: number) => {
      waypoints.push({
        name:    d.subName  ?? d.pointNm ?? `지점 ${i + 1}`,
        lat:     d.gpsY     ? parseFloat(d.gpsY)  : undefined,
        lng:     d.gpsX     ? parseFloat(d.gpsX)  : undefined,
        orderNo: d.orderNo  ? parseInt(d.orderNo) : i,
      })
    })
  }

  return {
    courseId:    item.courseId   ?? item.id            ?? '',
    courseName:  item.courseNm   ?? item.courseName    ?? item.title ?? '',
    sido:        item.sido       ?? INCHEON_SIDO,
    gungu:       item.gungu      ?? ONGJIN_GUNGU,
    theme:       item.theme      ?? item.courseTheme   ?? '일반',
    distanceKm:  parseDistance(item.courseDist ?? item.distance),
    durationMin: parseDuration(item.courseTime ?? item.duration),
    difficulty:  parseDifficulty(item.gpsDifficulty ?? item.difficulty ?? 1),
    summary:     item.summary    ?? item.courseSummary ?? '',
    waypoints,
  }
}

/** 인천 옹진군 두루누비 코스 전체 조회 */
export async function getIncheonIslandCourses(): Promise<DurunubiCourse[]> {
  if (courseCache['ongjin']) return courseCache['ongjin']

  const params = new URLSearchParams({
    serviceKey: API_KEY,
    MobileOS:   'ETC',
    MobileApp:  'sumtagi',
    _type:      'json',
    numOfRows:  '50',
    pageNo:     '1',
    sido:       INCHEON_SIDO,
    gungu:      ONGJIN_GUNGU,
  })

  try {
    const res  = await fetch(`${BASE_URL}?${params}`)
    const json = await res.json()
    const raw  = json?.response?.body?.items?.item
    const list = Array.isArray(raw) ? raw : raw ? [raw] : []
    const courses = list.map(mapCourse)
    courseCache['ongjin'] = courses
    return courses
  } catch {
    return []
  }
}

/** 특정 섬 관련 코스 필터링 */
export async function getCoursesForIsland(islandId: string): Promise<DurunubiCourse[]> {
  if (courseCache[islandId]) return courseCache[islandId]

  const all = await getIncheonIslandCourses()
  const keyword = ISLAND_GUNGU_KEYWORDS[islandId]

  const filtered = keyword
    ? all.filter((c) =>
        c.courseName.includes(keyword) ||
        c.gungu.includes(keyword) ||
        c.summary.includes(keyword)
      )
    : all

  courseCache[islandId] = filtered
  return filtered
}

/**
 * 도보 이동 소요시간 추정 (분)
 * 두루누비 코스 데이터 또는 거리 기반 계산
 * fallback: 평균 도보속도 4km/h 적용
 */
export function estimateWalkTime(distanceKm: number): number {
  return Math.ceil((distanceKm / 4) * 60)
}

/**
 * 섬 내 두 지점 간 예상 이동시간 반환 (분)
 * 두루누비 코스가 있으면 코스 시간, 없으면 거리 기반 추정
 */
export async function getInterPointTravelTime(
  islandId:      string,
  fromName:      string,
  toName:        string,
  fallbackDistKm = 2,
): Promise<number> {
  const courses = await getCoursesForIsland(islandId)

  // 출발지·도착지 모두 포함하는 코스 탐색
  const match = courses.find((c) => {
    const names = c.waypoints.map((w) => w.name)
    return (
      names.some((n) => n.includes(fromName) || fromName.includes(n)) &&
      names.some((n) => n.includes(toName)   || toName.includes(n))
    )
  })

  if (match && match.durationMin > 0) return match.durationMin

  // 코스 없으면 도보 추정
  return estimateWalkTime(fallbackDistKm)
}
