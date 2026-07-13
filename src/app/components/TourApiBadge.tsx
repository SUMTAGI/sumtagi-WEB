// 한국관광공사 OpenAPI 데이터를 쓰는 화면 요소에 붙이는 출처 배지.
// CreateTrip.tsx의 여행스타일 카드에 쓰던 초록 pill과 동일한 톤으로 통일.
export function TourApiBadge({ label = "관광공사", className = "" }: { label?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  );
}
