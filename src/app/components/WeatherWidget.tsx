import { Sun, Cloud, CloudRain, Wind, Waves, Ship } from "lucide-react";

interface WeatherData {
  island: string;
  temp: number;
  condition: "맑음" | "구름조금" | "흐림" | "비";
  waveHeight: number;
  windSpeed: number;
  ferryStatus: "정상" | "지연" | "결항";
}

interface WeatherWidgetProps {
  data: WeatherData;
  compact?: boolean;
}

export function WeatherWidget({ data, compact = false }: WeatherWidgetProps) {
  const getWeatherIcon = () => {
    switch (data.condition) {
      case "맑음":
        return <Sun className="w-6 h-6 text-orange-500" strokeWidth={2} />;
      case "구름조금":
        return <Cloud className="w-6 h-6 text-gray-400" strokeWidth={2} />;
      case "흐림":
        return <Cloud className="w-6 h-6 text-gray-600" strokeWidth={2} />;
      case "비":
        return <CloudRain className="w-6 h-6 text-blue-600" strokeWidth={2} />;
      default:
        return <Sun className="w-6 h-6 text-orange-500" strokeWidth={2} />;
    }
  };

  const getFerryStatusColor = () => {
    switch (data.ferryStatus) {
      case "정상":
        return "bg-green-100 text-green-700";
      case "지연":
        return "bg-orange-100 text-orange-700";
      case "결항":
        return "bg-red-100 text-red-700";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1">
          {getWeatherIcon()}
          <span className="font-medium text-gray-900">{data.temp}°C</span>
        </div>
        <div className={`px-2 py-1 rounded font-medium text-xs ${getFerryStatusColor()}`}>
          {data.ferryStatus}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getWeatherIcon()}
          <div>
            <div className="font-bold text-gray-900 text-lg">{data.temp}°C</div>
            <div className="text-sm text-gray-600">{data.condition}</div>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg font-semibold text-sm ${getFerryStatusColor()}`}>
          <div className="flex items-center gap-1">
            <Ship className="w-4 h-4" strokeWidth={2} />
            {data.ferryStatus}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-blue-600" strokeWidth={2} />
          <div>
            <div className="text-xs text-gray-600">파고</div>
            <div className="font-semibold text-gray-900">{data.waveHeight}m</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-gray-500" strokeWidth={2} />
          <div>
            <div className="text-xs text-gray-600">풍속</div>
            <div className="font-semibold text-gray-900">{data.windSpeed}m/s</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WeeklyForecastDay {
  day: string;
  date: string;
  condition: "맑음" | "구름조금" | "흐림" | "비";
  high: number;
  low: number;
  rainChance: number;
}

interface WeeklyForecastProps {
  forecast: WeeklyForecastDay[];
}

export function WeeklyForecast({ forecast }: WeeklyForecastProps) {
  const getWeatherIcon = (condition: string) => {
    const className = "w-8 h-8";
    switch (condition) {
      case "맑음":
        return <Sun className={`${className} text-orange-500`} strokeWidth={2} />;
      case "구름조금":
        return <Cloud className={`${className} text-gray-400`} strokeWidth={2} />;
      case "흐림":
        return <Cloud className={`${className} text-gray-600`} strokeWidth={2} />;
      case "비":
        return <CloudRain className={`${className} text-blue-600`} strokeWidth={2} />;
      default:
        return <Sun className={`${className} text-orange-500`} strokeWidth={2} />;
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-3">주간 날씨</h3>
      <div className="space-y-3">
        {forecast.map((day, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-12 text-center">
              <div className="text-sm font-medium text-gray-900">{day.day}</div>
              <div className="text-xs text-gray-500">{day.date}</div>
            </div>
            <div className="flex-shrink-0">
              {getWeatherIcon(day.condition)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{day.high}°</span>
                <div className="flex-1 h-1 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-600">{day.low}°</span>
              </div>
            </div>
            <div className="w-12 text-right">
              <div className="text-xs text-blue-600 font-medium">{day.rainChance}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
