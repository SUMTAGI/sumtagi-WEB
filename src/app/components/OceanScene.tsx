import { Fish, Palmtree, Sailboat } from "lucide-react";

// 두 배 너비 SVG를 -50% 이동시켜 이음매 없이 반복되는 파도 레이어.
// duration이 짧을수록(앞 레이어) 빠르게, 길수록(뒤 레이어) 느리게 움직여 물결의 원근감을 만듦.
function WaveLayer({ color, opacity, duration, height = 40 }: { color: string; opacity: number; duration: number; height?: number }) {
  const unit = 1440;
  const path =
    `M0,20 C360,40 720,0 1080,20 C1260,32 1380,8 1440,20 ` +
    `C${unit + 360},40 ${unit + 720},0 ${unit + 1080},20 C${unit + 1260},32 ${unit + 1380},8 ${unit + 1440},20 ` +
    `L${unit * 2},${height} L0,${height} Z`;

  return (
    <div className="absolute bottom-0 left-0 w-full overflow-hidden" style={{ height }}>
      <svg
        className="absolute bottom-0 left-0 animate-wave-drift"
        style={{ width: "200%", height: "100%", animationDuration: `${duration}s` }}
        viewBox={`0 0 ${unit * 2} ${height}`}
        fill="none"
        preserveAspectRatio="none"
      >
        <path d={path} fill={color} fillOpacity={opacity} />
      </svg>
    </div>
  );
}

// 파도 사이에 걸쳐 앉은 작은 섬(언덕 + 야자수). 앞쪽 물결이 섬 밑동을 살짝 덮어
// 물에 떠 있는 것처럼 보이도록, 렌더링 순서상 뒷물결과 앞물결 사이에 배치한다.
function Island({ color, side, waveHeight }: { color: string; side: "left" | "right"; waveHeight: number }) {
  return (
    <div
      className={`absolute w-16 sm:w-20 animate-float-slow ${side === "left" ? "left-[8%]" : "right-[10%]"}`}
      style={{ bottom: Math.max(waveHeight - 26, 2) }}
    >
      <svg viewBox="0 0 100 34" className="w-full h-auto" fill="none">
        <path d="M0,34 C6,14 22,4 40,8 C54,11 60,2 76,6 C90,9 96,20 100,34 Z" fill={color} />
      </svg>
      <Palmtree
        className="absolute -top-5 left-1/2 -translate-x-1/2 w-6 h-6 sm:w-7 sm:h-7"
        style={{ color }}
        strokeWidth={1.75}
      />
    </div>
  );
}

interface OceanSceneProps {
  /** 파도가 맞닿는 바닥 색 (섹션 아래쪽 배경색과 맞춰야 이어져 보임) */
  waveColor?: string;
  /** 배/물고기 실루엣 색 (밝은 배경 위에선 어둡게, 어두운 배경 위에선 밝게) */
  creatureColor?: string;
  /** 섬 언덕/야자수 색 (초록 계열) */
  islandColor?: string;
  islandSide?: "left" | "right";
  waveHeight?: number;
  /** 하단에 콘텐츠가 붙는 레이아웃(items-end 등)에서는 물결이 겹쳐 보이므로 끔 */
  showWave?: boolean;
  /** 물결(수면선)이 없으면 섬을 앉힐 기준선이 없으므로 기본은 showWave를 따라감 */
  showIsland?: boolean;
  className?: string;
}

// 히어로 배너 안에 배치하는 장식용 바다 애니메이션(파도 + 배 + 물고기 + 물방울).
// 배경/콘텐츠 사이에 두는 순수 장식이라 클릭을 막지 않도록 pointer-events-none 처리.
export function OceanScene({
  waveColor = "#f5f6f8",
  creatureColor = "rgba(255,255,255,0.55)",
  islandColor = "#2f9e5c",
  islandSide = "right",
  waveHeight = 40,
  showWave = true,
  showIsland = showWave,
  className = "",
}: OceanSceneProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <div className="absolute inset-x-0 top-[16%] w-full animate-boat-drift">
        <Sailboat className="w-7 h-7" style={{ color: creatureColor }} strokeWidth={1.5} />
      </div>

      <div className="absolute inset-x-0 top-[42%] w-full animate-fish-swim">
        <Fish className="w-4 h-4" style={{ color: creatureColor }} strokeWidth={1.5} />
      </div>
      <div className="absolute inset-x-0 top-[58%] w-full animate-fish-swim-reverse" style={{ animationDelay: "-4s" }}>
        <Fish className="w-3 h-3" style={{ color: creatureColor, opacity: 0.7 }} strokeWidth={1.5} />
      </div>

      <div className="absolute bottom-8 left-[12%] w-1.5 h-1.5 rounded-full bg-white/40 animate-bubble-rise" />
      <div className="absolute bottom-5 left-[38%] w-1 h-1 rounded-full bg-white/30 animate-bubble-rise" style={{ animationDelay: "1.5s" }} />
      <div className="absolute bottom-10 left-[64%] w-2 h-2 rounded-full bg-white/30 animate-bubble-rise" style={{ animationDelay: "3s" }} />
      <div className="absolute bottom-4 left-[85%] w-1.5 h-1.5 rounded-full bg-white/25 animate-bubble-rise" style={{ animationDelay: "0.7s" }} />

      {showWave && <WaveLayer color={waveColor} opacity={0.55} duration={14} height={waveHeight} />}
      {showIsland && <Island color={islandColor} side={islandSide} waveHeight={waveHeight} />}
      {showWave && <WaveLayer color={waveColor} opacity={1} duration={9} height={waveHeight} />}
    </div>
  );
}
