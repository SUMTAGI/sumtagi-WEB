import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { IslandCongestionData } from "../../lib/api/congestion";

interface Props {
  congestion: IslandCongestionData;
}

export function CongestionChart({ congestion }: Props) {
  return (
    <>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart
          data={congestion.forecast.map((f) => ({
            day: f.dayLabel,
            rate: Math.round(f.rate * 100),
            level: f.level,
          }))}
          margin={{ top: 10, right: 8, left: 8, bottom: 0 }}
        >
          <defs>
            <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null;
              const { day, rate, level } = payload[0].payload;
              const color = level === 'high' ? '#f87171' : level === 'medium' ? '#f59e0b' : '#34d399';
              const label = level === 'high' ? '혼잡' : level === 'medium' ? '보통' : '여유';
              return (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2">
                  <p className="text-xs text-gray-400 mb-0.5">{day}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-sm font-bold text-gray-800">{rate}%</span>
                    <span className="text-xs text-gray-400">{label}</span>
                  </div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#rateGradient)"
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              const color = payload.level === 'high' ? '#f87171' : payload.level === 'medium' ? '#f59e0b' : '#34d399';
              return (
                <g key={payload.day}>
                  <circle cx={cx} cy={cy} r={6} fill={color} stroke="white" strokeWidth={2.5} />
                </g>
              );
            }}
            activeDot={{ r: 7, strokeWidth: 2.5, stroke: 'white' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-2 mt-3">
        {([
          ['#34d399', '여유'],
          ['#f59e0b', '보통'],
          ['#f87171', '혼잡'],
        ] as const).map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5 bg-white/80 rounded-full px-2.5 py-1 border border-gray-100">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-xs text-gray-500 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
