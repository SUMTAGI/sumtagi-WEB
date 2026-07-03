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

async function fetchAllToday(): Promise<any[]> {
  const params = new URLSearchParams({
    serviceKey: FERRY_API_KEY,
    pageNo: '1',
    numOfRows: '500',
    dataType: 'JSON',
    rlvtYmd: todayKst(),
  });
  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) return [];
  const json = await res.json();
  const raw = json?.response?.body?.items?.item ?? [];
  return Array.isArray(raw) ? raw : [raw];
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

export async function getFerryScheduleForIsland(islandId: string): Promise<FerrySchedule[]> {
  const keyword = ROUTE_KEYWORDS[islandId];
  if (!keyword) return [];

  const items = await fetchAllToday();

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
