import { AlertTriangle } from "lucide-react";
import { assessFerryRisk } from "../../lib/weatherService";

interface FerryRiskBannerProps {
  /** 다음날 예보의 최고 풍속(km/h) */
  windSpeed?: number;
  /** 다음날 예보의 최고 파고(m) */
  waveHeight?: number;
  /** 배지에 붙일 날짜 라벨(예: "8/2"). 없으면 "내일"만 표시 */
  dateLabel?: string;
  className?: string;
}

// safe면 렌더링 자체를 하지 않음 — 위험할 때만 알리고, 안전할 땐 침묵하는 게 이 프로젝트의 원칙.
export function FerryRiskBanner({ windSpeed, waveHeight, dateLabel, className = "" }: FerryRiskBannerProps) {
  if (windSpeed === undefined || waveHeight === undefined) return null;

  const risk = assessFerryRisk(windSpeed, waveHeight);
  if (risk === "safe") return null;

  const when = dateLabel ? `${dateLabel} ` : "내일 ";
  const message =
    risk === "danger" ? `${when}결항 가능성 있음 (예측, 확정 아님)` : `${when}기상 악화 가능 (예측, 확정 아님)`;

  const colorClasses =
    risk === "danger"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${colorClasses} ${className}`}>
      <AlertTriangle size={16} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}
