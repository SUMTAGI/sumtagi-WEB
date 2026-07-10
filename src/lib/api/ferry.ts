const FERRY_API_KEY = import.meta.env.VITE_FERRY_API_KEY as string;
const BASE_URL = 'https://apis.data.go.kr/B554035/ferry-route-info-v4/get-ferry-route-info-v4';

export interface FerrySchedule {
  ferryName: string;
  routeName: string;
  departureTime: string;
  status: string;
}

// 섬 ID → 항로명에 포함된 키워드
// 신도/장봉도는 "장봉-삼목" 한 면허항로로 묶여 있어 같은 키워드 사용(신도는 그 항로의 중간 기항지).
// 문갑도/백아도는 별도 면허항로가 확인되지 않아 완행선이 겹치는 "인천-덕적"(덕적 키워드) 재사용.
// 시도/모도/소야도는 다리로 연결돼 있어 별도 항로가 없음(ROUTE_KEYWORDS 미등록 → 상시 '운항없음').
const ROUTE_KEYWORDS: Record<string, string> = {
  baengnyeong: '백령',
  daecheong: '대청',
  socheong: '소청',
  yeonpyeong: '연평',
  deokjeok: '덕적',
  jawol: '자월',
  seungbong: '승봉',
  daeijak: '이작',
  soijak: '이작',
  pungdo: '풍',
  yukdo: '육',
  yeonghung: '영흥',
  seonjae: '선재',
  guleop: '굴업',
  sindo: '장봉',
  jangbongdo: '장봉',
  mungap: '덕적',
  baegado: '덕적',
  uldo: '울도',
};

function todayKst(): string {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function formatTime(t: string | number): string {
  const padded = String(t).padStart(4, '0');
  return `${padded.slice(0, 2)}:${padded.slice(2)}`;
}

export interface FerryRouteStatus {
  islandName: string;
  status: '정상' | '결항' | '운항없음';
}

const ALL_ISLANDS = [
  { id: 'baengnyeong', name: '백령도' },
  { id: 'daecheong',   name: '대청도' },
  { id: 'socheong',    name: '소청도' },
  { id: 'yeonpyeong',  name: '연평도' },
  { id: 'deokjeok',    name: '덕적도' },
  { id: 'jawol',       name: '자월도' },
  { id: 'seungbong',   name: '승봉도' },
  { id: 'daeijak',     name: '대이작도' },
  { id: 'soijak',      name: '소이작도' },
  { id: 'pungdo',      name: '풍도' },
  { id: 'yukdo',       name: '육도' },
  { id: 'yeonghung',   name: '영흥도' },
  { id: 'seonjae',     name: '선재도' },
  { id: 'guleop',      name: '굴업도' },
  { id: 'sindo',       name: '신도' },
  { id: 'sido',        name: '시도' },
  { id: 'modo',        name: '모도' },
  { id: 'jangbongdo',  name: '장봉도' },
  { id: 'soya',        name: '소야도' },
  { id: 'mungap',      name: '문갑도' },
  { id: 'baegado',     name: '백아도' },
  { id: 'uldo',        name: '울도' },
];

const PAGE_SIZE = 1000;

// API가 429(쿼터 초과) 등 에러를 반환할 때 조용히 빈 배열로 삼키면 "오늘 결항"과
// "지금 정보를 못 가져옴"을 구분할 수 없게 됨 — 호출부에서 구분해 보여줄 수 있도록 던진다.
export class FerryApiError extends Error {
  constructor(public status: number, body: string) {
    super(`여객선 API 응답 실패 (HTTP ${status}): ${body.slice(0, 200)}`);
    this.name = 'FerryApiError';
  }
}

async function fetchPage(pageNo: number): Promise<{ items: any[]; totalCount: number }> {
  const params = new URLSearchParams({
    serviceKey: FERRY_API_KEY,
    pageNo: String(pageNo),
    numOfRows: String(PAGE_SIZE),
    dataType: 'JSON',
    rlvtYmd: todayKst(),
  });
  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new FerryApiError(res.status, await res.text().catch(() => ''));
  const json = await res.json();
  const raw = json?.response?.body?.items?.item ?? [];
  const totalCount = json?.response?.body?.totalCount ?? 0;
  return { items: Array.isArray(raw) ? raw : [raw], totalCount };
}

const CACHE_TTL_MS = 60_000;
let todayCache: { date: string; timestamp: number; items: any[] } | null = null;
let inFlight: Promise<any[]> | null = null;

// 하루 전체 항로 데이터가 numOfRows(페이지 크기)보다 많을 수 있어(예: 4000건 이상),
// 첫 페이지만 받으면 뒤쪽 항로가 누락되어 실제로는 운항했는데도 '운항없음'으로 잘못 표시됨.
// totalCount를 보고 남은 페이지를 모두 받아온다.
//
// Home/Schedule/IslandDetail 등 여러 화면이 짧은 시간 안에 각자 이 함수를 호출하면
// 그때마다 페이지 여러 개짜리 요청이 중복으로 나가 하루 쿼터를 금방 소진하게 된다.
// 같은 날짜 데이터는 60초 캐싱하고, 캐시가 없는 동안 동시에 여러 곳에서 호출돼도
// 실제 fetch는 한 번만 나가도록 진행 중인 요청(inFlight)도 공유한다.
async function fetchAllToday(): Promise<any[]> {
  const date = todayKst();
  if (todayCache && todayCache.date === date && Date.now() - todayCache.timestamp < CACHE_TTL_MS) {
    return todayCache.items;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const { items: firstItems, totalCount } = await fetchPage(1);
    const items = [...firstItems];
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    for (let pageNo = 2; pageNo <= totalPages; pageNo++) {
      const { items: nextItems } = await fetchPage(pageNo);
      items.push(...nextItems);
    }
    todayCache = { date, timestamp: Date.now(), items };
    return items;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export async function getHomeFerryStatus(): Promise<FerryRouteStatus[]> {
  const items = await fetchAllToday();
  return ALL_ISLANDS.map(({ id, name }) => {
    const keyword = ROUTE_KEYWORDS[id];
    const filtered = items.filter((item) =>
      (item.lcns_seawy_nm ?? item.nvg_seawy_nm ?? '').includes(keyword)
    );
    if (filtered.length === 0) return { islandName: name, status: '운항없음' };
    const hasCancelled = filtered.some((item) => (item.nvg_stts_nm ?? '').includes('결항'));
    return { islandName: name, status: hasCancelled ? '결항' : '정상' };
  });
}

function schedulesFromItems(items: any[], keyword: string): FerrySchedule[] {
  const filtered = items.filter((item) => {
    const route: string = item.lcns_seawy_nm ?? item.nvg_seawy_nm ?? '';
    return route.includes(keyword);
  });

  // 같은 출발(여객선+시각)에 상태 변경마다 row 추가됨 — 최신 상태만 유지
  const map = new Map<string, any>();
  for (const item of filtered) {
    const key = `${item.psnshp_nm}_${item.sail_tm}`;
    const existing = map.get(key);
    if (!existing || item.nvg_stts_chg_dt > existing.nvg_stts_chg_dt) {
      map.set(key, item);
    }
  }

  return Array.from(map.values())
    .map((item) => ({
      ferryName: item.psnshp_nm ?? '',
      routeName: item.lcns_seawy_nm ?? item.nvg_seawy_nm ?? '',
      departureTime: formatTime(item.sail_tm),
      status: item.nvg_stts_nm ?? '운항',
    }))
    .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
}

export async function getFerryScheduleForIsland(islandId: string): Promise<FerrySchedule[]> {
  const keyword = ROUTE_KEYWORDS[islandId];
  if (!keyword) return [];

  const items = await fetchAllToday();
  return schedulesFromItems(items, keyword);
}

export interface IslandFerrySchedule {
  islandId: string;
  islandName: string;
  schedules: FerrySchedule[];
}

// 홈 화면의 '교통시간표'에서 섬 하나씩 getFerryScheduleForIsland를 반복 호출하면
// 매번 fetchAllToday()가 다시 실행돼 API를 섬 개수만큼 중복 호출하게 됨.
// 전체 배편을 보여줄 땐 오늘자 데이터를 한 번만 받아서 섬별로 나눠준다.
export async function getFerryScheduleForAllIslands(): Promise<IslandFerrySchedule[]> {
  const items = await fetchAllToday();
  return ALL_ISLANDS.map(({ id, name }) => ({
    islandId: id,
    islandName: name,
    schedules: ROUTE_KEYWORDS[id] ? schedulesFromItems(items, ROUTE_KEYWORDS[id]) : [],
  })).filter((entry) => entry.schedules.length > 0);
}
