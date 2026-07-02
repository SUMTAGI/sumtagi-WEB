import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { getMonthlyVisitorIndex } from "../../lib/api/demandIntensity";

// 관광공사 수요강도 API 미연결 시 사용하는 정적 fallback
const FALLBACK_DATA = [
  { month: "1월",  백령도: 22, 덕적도: 38, 영흥도: 55 },
  { month: "2월",  백령도: 18, 덕적도: 33, 영흥도: 50 },
  { month: "3월",  백령도: 35, 덕적도: 52, 영흥도: 65 },
  { month: "4월",  백령도: 48, 덕적도: 66, 영흥도: 75 },
  { month: "5월",  백령도: 60, 덕적도: 74, 영흥도: 85 },
  { month: "6월",  백령도: 70, 덕적도: 80, 영흥도: 92 },
  { month: "7월",  백령도: 78, 덕적도: 88, 영흥도: 98 },
  { month: "8월",  백령도: 82, 덕적도: 91, 영흥도: 100 },
  { month: "9월",  백령도: 62, 덕적도: 72, 영흥도: 88 },
  { month: "10월", 백령도: 45, 덕적도: 58, 영흥도: 76 },
  { month: "11월", 백령도: 28, 덕적도: 42, 영흥도: 60 },
  { month: "12월", 백령도: 20, 덕적도: 36, 영흥도: 54 },
];

// 차트에 표시할 섬 설정 (islandId, 표시명, 색상)
const CHART_ISLANDS = [
  { id: 'baengnyeong', name: '백령도', color: '#3b82f6' },
  { id: 'deokjeok',    name: '덕적도', color: '#10b981' },
  { id: 'yeonghung',   name: '영흥도', color: '#f59e0b' },
] as const

export function VisitorTrendsChart() {
  const [chartData, setChartData] = useState<object[]>(FALLBACK_DATA)
  const [isLive,    setIsLive]    = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    getMonthlyVisitorIndex(CHART_ISLANDS.map((i) => i.id))
      .then((data) => {
        // 모든 섬 데이터가 0이면 API 미연결로 판단 → fallback 유지
        const hasRealData = data.some((row) =>
          CHART_ISLANDS.some((i) => (row as any)[i.name] > 0)
        )
        if (hasRealData) {
          setChartData(data)
          setIsLive(true)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">섬별 관광 수요 추이</h2>
          <p className="text-gray-600 mt-1 text-sm">
            {isLive
              ? "한국관광공사 지역별 관광수요강도 데이터 (최근 12개월)"
              : "최근 12개월 방문 수요 추이 기반 혼잡도 예측"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {loading ? (
            <span className="text-xs text-gray-400">로딩 중...</span>
          ) : isLive ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-600">관광공사 실시간</span>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <span className="text-xs text-gray-400">기본 데이터</span>
            </>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData as any[]}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis
            stroke="#6b7280"
            domain={[0, 100]}
            tickFormatter={(v) => isLive ? `${v}` : String(v)}
            label={isLive
              ? { value: '수요강도', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#9ca3af' } }
              : undefined
            }
          />
          <Tooltip
            contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px" }}
            formatter={(value: number, name: string) => [
              isLive ? `${value}점` : String(value),
              name,
            ]}
          />
          <Legend />
          {CHART_ISLANDS.map((island) => (
            <Line
              key={island.id}
              type="monotone"
              dataKey={island.name}
              stroke={island.color}
              strokeWidth={2}
              dot={{ fill: island.color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {isLive && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          출처: 한국관광공사_지역별관광수요강도 OpenAPI
        </p>
      )}
    </div>
  );
}
