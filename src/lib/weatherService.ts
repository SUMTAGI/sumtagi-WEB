const INCHEON_LAT = 37.4563;
const INCHEON_LON = 126.7052;
const CACHE_KEY = 'incheon_weather_v1';
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
}

export interface WeatherResult {
  current: CurrentWeather;
  forecast: ForecastDay[];
  fetchedAt: number;
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
  // 캐시 확인
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const data: WeatherResult = JSON.parse(cached);
      if (Date.now() - data.fetchedAt < CACHE_DURATION_MS) return data;
    }
  } catch {}

  try {
    const [forecastRes, marineRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${INCHEON_LAT}&longitude=${INCHEON_LON}` +
        `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=Asia%2FSeoul&forecast_days=6`
      ),
      fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${INCHEON_LAT}&longitude=${INCHEON_LON}` +
        `&hourly=wave_height&timezone=Asia%2FSeoul&forecast_days=1`
      ),
    ]);

    if (!forecastRes.ok) return null;

    const forecastJson = await forecastRes.json();
    const current = forecastJson.current;
    const daily = forecastJson.daily;

    let waveHeight = 0.5;
    if (marineRes.ok) {
      const marineJson = await marineRes.json();
      const hour = new Date().getHours();
      waveHeight = marineJson.hourly.wave_height[hour] ?? 0.5;
    }

    const dates: string[] = daily.time;
    const forecast: ForecastDay[] = dates.slice(1, 6).map((dateStr, i) => {
      const date = new Date(dateStr + 'T00:00:00');
      return {
        day: WEEKDAYS[date.getDay()],
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        condition: wmoToCondition(daily.weather_code[i + 1]),
        high: Math.round(daily.temperature_2m_max[i + 1]),
        low: Math.round(daily.temperature_2m_min[i + 1]),
        rainChance: Math.round(daily.precipitation_probability_max[i + 1] ?? 0),
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

    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch {}
    return result;
  } catch {
    return null;
  }
}
