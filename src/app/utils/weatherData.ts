export interface WeatherData {
  island: string;
  temp: number;
  condition: "맑음" | "구름조금" | "흐림" | "비";
  waveHeight: number;
  windSpeed: number;
  ferryStatus: "정상" | "지연" | "결항";
}

export interface WeeklyForecastDay {
  day: string;
  date: string;
  condition: "맑음" | "구름조금" | "흐림" | "비";
  high: number;
  low: number;
  rainChance: number;
}

const ISLAND_WEATHER: Record<string, WeatherData> = {
  "백령도": {
    island: "백령도",
    temp: 18,
    condition: "구름조금",
    waveHeight: 1.5,
    windSpeed: 8,
    ferryStatus: "정상",
  },
  "덕적도": {
    island: "덕적도",
    temp: 21,
    condition: "맑음",
    waveHeight: 0.8,
    windSpeed: 5,
    ferryStatus: "정상",
  },
  "자월도": {
    island: "자월도",
    temp: 22,
    condition: "맑음",
    waveHeight: 0.7,
    windSpeed: 4,
    ferryStatus: "정상",
  },
  "대청도": {
    island: "대청도",
    temp: 17,
    condition: "흐림",
    waveHeight: 1.8,
    windSpeed: 9,
    ferryStatus: "지연",
  },
  "영흥도": {
    island: "영흥도",
    temp: 23,
    condition: "맑음",
    waveHeight: 0.5,
    windSpeed: 3,
    ferryStatus: "정상",
  },
  "선재도": {
    island: "선재도",
    temp: 22,
    condition: "구름조금",
    waveHeight: 0.6,
    windSpeed: 4,
    ferryStatus: "정상",
  },
  "굴업도": {
    island: "굴업도",
    temp: 20,
    condition: "흐림",
    waveHeight: 1.2,
    windSpeed: 7,
    ferryStatus: "정상",
  },
};

const ISLAND_FORECAST: Record<string, WeeklyForecastDay[]> = {
  "백령도": [
    { day: "월", date: "6/2", condition: "구름조금", high: 20, low: 15, rainChance: 10 },
    { day: "화", date: "6/3", condition: "맑음", high: 22, low: 16, rainChance: 0 },
    { day: "수", date: "6/4", condition: "맑음", high: 24, low: 17, rainChance: 0 },
    { day: "목", date: "6/5", condition: "흐림", high: 21, low: 16, rainChance: 30 },
    { day: "금", date: "6/6", condition: "비", high: 19, low: 15, rainChance: 80 },
  ],
  "덕적도": [
    { day: "월", date: "6/2", condition: "맑음", high: 23, low: 18, rainChance: 0 },
    { day: "화", date: "6/3", condition: "맑음", high: 25, low: 19, rainChance: 0 },
    { day: "수", date: "6/4", condition: "구름조금", high: 24, low: 19, rainChance: 10 },
    { day: "목", date: "6/5", condition: "흐림", high: 22, low: 18, rainChance: 20 },
    { day: "금", date: "6/6", condition: "구름조금", high: 23, low: 18, rainChance: 10 },
  ],
  "자월도": [
    { day: "월", date: "6/2", condition: "맑음", high: 24, low: 19, rainChance: 0 },
    { day: "화", date: "6/3", condition: "맑음", high: 25, low: 20, rainChance: 0 },
    { day: "수", date: "6/4", condition: "맑음", high: 26, low: 20, rainChance: 0 },
    { day: "목", date: "6/5", condition: "구름조금", high: 24, low: 19, rainChance: 10 },
    { day: "금", date: "6/6", condition: "흐림", high: 22, low: 18, rainChance: 30 },
  ],
  "대청도": [
    { day: "월", date: "6/2", condition: "흐림", high: 19, low: 14, rainChance: 40 },
    { day: "화", date: "6/3", condition: "비", high: 17, low: 13, rainChance: 70 },
    { day: "수", date: "6/4", condition: "흐림", high: 18, low: 14, rainChance: 50 },
    { day: "목", date: "6/5", condition: "구름조금", high: 20, low: 15, rainChance: 20 },
    { day: "금", date: "6/6", condition: "맑음", high: 21, low: 16, rainChance: 0 },
  ],
  "영흥도": [
    { day: "월", date: "6/2", condition: "맑음", high: 25, low: 20, rainChance: 0 },
    { day: "화", date: "6/3", condition: "맑음", high: 26, low: 21, rainChance: 0 },
    { day: "수", date: "6/4", condition: "맑음", high: 27, low: 21, rainChance: 0 },
    { day: "목", date: "6/5", condition: "구름조금", high: 25, low: 20, rainChance: 10 },
    { day: "금", date: "6/6", condition: "구름조금", high: 24, low: 19, rainChance: 10 },
  ],
  "선재도": [
    { day: "월", date: "6/2", condition: "구름조금", high: 24, low: 19, rainChance: 10 },
    { day: "화", date: "6/3", condition: "맑음", high: 25, low: 20, rainChance: 0 },
    { day: "수", date: "6/4", condition: "맑음", high: 26, low: 20, rainChance: 0 },
    { day: "목", date: "6/5", condition: "흐림", high: 23, low: 19, rainChance: 30 },
    { day: "금", date: "6/6", condition: "구름조금", high: 24, low: 19, rainChance: 10 },
  ],
  "굴업도": [
    { day: "월", date: "6/2", condition: "흐림", high: 22, low: 17, rainChance: 30 },
    { day: "화", date: "6/3", condition: "구름조금", high: 23, low: 18, rainChance: 10 },
    { day: "수", date: "6/4", condition: "맑음", high: 24, low: 19, rainChance: 0 },
    { day: "목", date: "6/5", condition: "흐림", high: 21, low: 17, rainChance: 40 },
    { day: "금", date: "6/6", condition: "비", high: 19, low: 16, rainChance: 80 },
  ],
};

export const getWeatherForIsland = (islandName: string): WeatherData => {
  return ISLAND_WEATHER[islandName] || ISLAND_WEATHER["덕적도"]; // Default fallback
};

export const getForecastForIsland = (islandName: string): WeeklyForecastDay[] => {
  return ISLAND_FORECAST[islandName] || ISLAND_FORECAST["덕적도"]; // Default fallback
};

// Get overall weather summary (used in Home page)
export const getOverallWeather = (): WeatherData => {
  // Return average/representative weather for main port area
  return {
    island: "인천",
    temp: 21,
    condition: "맑음",
    waveHeight: 0.9,
    windSpeed: 5,
    ferryStatus: "정상",
  };
};

export const getOverallForecast = (): WeeklyForecastDay[] => {
  return [
    { day: "월", date: "6/2", condition: "맑음", high: 23, low: 18, rainChance: 5 },
    { day: "화", date: "6/3", condition: "맑음", high: 24, low: 19, rainChance: 0 },
    { day: "수", date: "6/4", condition: "구름조금", high: 25, low: 19, rainChance: 10 },
    { day: "목", date: "6/5", condition: "흐림", high: 22, low: 18, rainChance: 30 },
    { day: "금", date: "6/6", condition: "비", high: 20, low: 17, rainChance: 70 },
  ];
};
