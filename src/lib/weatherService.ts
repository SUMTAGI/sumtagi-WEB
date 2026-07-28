const INCHEON_LAT = 37.4563;
const INCHEON_LON = 126.7052;
const CACHE_DURATION_MS = 30 * 60 * 1000;

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export type WeatherCondition = '맑음' | '구름조금' | '흐림' | '비';
export type FerryStatus = '정상' | '지연' | '결항';

export interface CurrentWeather {
  temp: number;
  apparentTemp: number;
  condition: WeatherCondition;
  windSpeed: number;
  waveHeight: number;
  ferryStatus: FerryStatus;
}

export interface ForecastDay {
  day: string;
  date: string;
  condition: WeatherCondition;
  high: number;
  low: number;
  rainChance: number;
  /** 해당 일자 최고 파고(m). 확보 실패 시 undefined */
  waveHeight?: number;
  /** 해당 일자 최고 풍속(km/h). 확보 실패 시 undefined */
  windSpeed?: number;
}

export interface WeatherResult {
  current: CurrentWeather;
  forecast: ForecastDay[];
  fetchedAt: number;
}

export type FerryRisk = 'safe' | 'caution' | 'danger';

/** 파고/풍속 기준 결항 위험도 평가. APP(weather_service.dart)의 assessFerryRisk와 임계값 동일하게 유지할 것. */
export function assessFerryRisk(windSpeed: number, waveHeight: number): FerryRisk {
  if (windSpeed >= 50 || waveHeight >= 2.5) return 'danger';
  if (windSpeed >= 36 || waveHeight >= 1.5) return 'caution';
  return 'safe';
}

function wmoToCondition(code: number): WeatherCondition {
  if (code === 0) return '맑음';
  if (code <= 2) return '구름조금';
  if (code <= 3) return '흐림';
  if (code <= 48) return '흐림';
  if (code <= 67) return '비';
  if (code <= 77) return '흐림';
  if (code <= 82) return '비';
  return '비';
}

function waveToFerryStatus(wave: number): FerryStatus {
  if (wave >= 2.0) return '결항';
  if (wave >= 1.0) return '지연';
  return '정상';
}

export async function fetchIncheonWeather(): Promise<WeatherResult | null> {
  return fetchWeatherForLocation(INCHEON_LAT, INCHEON_LON, 'incheon_weather_v2');
}

/** 섬 좌표 기준 날씨 조회. 좌표 없는 섬은 인천 대표 좌표로 대체 */
export async function fetchWeatherForIsland(
  islandId: string,
  lat?: number | null,
  lng?: number | null,
): Promise<WeatherResult | null> {
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';
  return fetchWeatherForLocation(
    hasCoords ? lat : INCHEON_LAT,
    hasCoords ? lng : INCHEON_LON,
    `island_weather_v2_${islandId}`,
  );
}

/** marine hourly wave_height 배열에서 특정 날짜(YYYY-MM-DD)의 최고 파고를 찾는다 */
function maxWaveForDate(times: string[], waveHeights: number[], dateStr: string): number | undefined {
  let max: number | undefined;
  for (let i = 0; i < times.length; i++) {
    if (times[i].startsWith(dateStr) && (max === undefined || waveHeights[i] > max)) {
      max = waveHeights[i];
    }
  }
  return max;
}

async function fetchWeatherForLocation(
  lat: number,
  lon: number,
  cacheKey: string,
): Promise<WeatherResult | null> {
  // 캐시 확인
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const data: WeatherResult = JSON.parse(cached);
      if (Date.now() - data.fetchedAt < CACHE_DURATION_MS) return data;
    }
  } catch {}

  try {
    const [forecastRes, marineRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
        `&timezone=Asia%2FSeoul&forecast_days=6`
      ),
      fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}` +
        `&hourly=wave_height&timezone=Asia%2FSeoul&forecast_days=6`
      ),
    ]);

    if (!forecastRes.ok) return null;

    const forecastJson = await forecastRes.json();
    const current = forecastJson.current;
    const daily = forecastJson.daily;

    let waveHeight = 0.5;
    let waveTimes: string[] = [];
    let waveHeights: number[] = [];
    if (marineRes.ok) {
      const marineJson = await marineRes.json();
      waveTimes = marineJson.hourly.time ?? [];
      waveHeights = marineJson.hourly.wave_height ?? [];
      const hour = new Date().getHours();
      waveHeight = waveHeights[hour] ?? 0.5;
    }

    const dates: string[] = daily.time;
    const windMaxList: (number | null)[] | undefined = daily.wind_speed_10m_max;
    const forecast: ForecastDay[] = dates.slice(1, 6).map((dateStr, i) => {
      const date = new Date(dateStr + 'T00:00:00');
      return {
        day: WEEKDAYS[date.getDay()],
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        condition: wmoToCondition(daily.weather_code[i + 1]),
        high: Math.round(daily.temperature_2m_max[i + 1]),
        low: Math.round(daily.temperature_2m_min[i + 1]),
        rainChance: Math.round(daily.precipitation_probability_max[i + 1] ?? 0),
        waveHeight: maxWaveForDate(waveTimes, waveHeights, dateStr),
        windSpeed: windMaxList?.[i + 1] ?? undefined,
      };
    });

    const result: WeatherResult = {
      current: {
        temp: Math.round(current.temperature_2m),
        apparentTemp: Math.round(current.apparent_temperature),
        condition: wmoToCondition(current.weather_code),
        windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
        waveHeight: Math.round(waveHeight * 10) / 10,
        ferryStatus: waveToFerryStatus(waveHeight),
      },
      forecast,
      fetchedAt: Date.now(),
    };

    try { sessionStorage.setItem(cacheKey, JSON.stringify(result)); } catch {}
    return result;
  } catch {
    return null;
  }
}
