import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { month: "1월", 백령도: 120, 덕적도: 280, 영흥도: 450 },
  { month: "2월", 백령도: 100, 덕적도: 250, 영흥도: 420 },
  { month: "3월", 백령도: 180, 덕적도: 380, 영흥도: 550 },
  { month: "4월", 백령도: 280, 덕적도: 520, 영흥도: 680 },
  { month: "5월", 백령도: 450, 덕적도: 680, 영흥도: 820 },
  { month: "6월", 백령도: 580, 덕적도: 750, 영흥도: 950 },
  { month: "7월", 백령도: 720, 덕적도: 880, 영흥도: 1200 },
  { month: "8월", 백령도: 800, 덕적도: 920, 영흥도: 1350 },
  { month: "9월", 백령도: 520, 덕적도: 680, 영흥도: 900 },
  { month: "10월", 백령도: 380, 덕적도: 480, 영흥도: 720 },
  { month: "11월", 백령도: 200, 덕적도: 320, 영흥도: 520 },
  { month: "12월", 백령도: 150, 덕적도: 280, 영흥도: 480 },
];

export function VisitorTrendsChart() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">섬별 방문자 추이</h2>
      <p className="text-gray-600 mb-6 text-sm">
        최근 12개월 동안의 방문객 데이터를 기반으로 혼잡도를 예측합니다
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="백령도"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="덕적도"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="영흥도"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: "#f59e0b", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
