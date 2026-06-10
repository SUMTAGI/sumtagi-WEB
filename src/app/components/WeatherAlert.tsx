import { Cloud, AlertTriangle, CheckCircle } from "lucide-react";

export function WeatherAlert() {
  const alerts = [
    {
      island: "백령도",
      status: "normal" as const,
      message: "정상 운항",
    },
    {
      island: "덕적도",
      status: "normal" as const,
      message: "정상 운항",
    },
    {
      island: "영흥도",
      status: "normal" as const,
      message: "정상 운항",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Cloud className="w-5 h-5 text-blue-600" strokeWidth={2} />
        <h3 className="text-lg font-semibold text-gray-900">실시간 운항 현황</h3>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.island}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                alert.status === "normal" ? "bg-green-500" :
                alert.status === "warning" ? "bg-yellow-500" : "bg-red-500"
              }`} />
              <span className="font-medium text-gray-900">{alert.island}</span>
            </div>
            <div className="flex items-center gap-2">
              {alert.status === "normal" ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" strokeWidth={2} />
                  <span className="text-sm text-green-700">{alert.message}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-600" strokeWidth={2} />
                  <span className="text-sm text-yellow-700">{alert.message}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-4">
        마지막 업데이트: {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}
