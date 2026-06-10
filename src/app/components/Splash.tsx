import { useEffect, useState } from "react";
import { Ship, Waves } from "lucide-react";

interface SplashProps {
  onComplete: () => void;
}

export function Splash({ onComplete }: SplashProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="relative">
        {/* Floating waves background */}
        <div className="absolute -left-20 -top-20 w-40 h-40 bg-white/10 rounded-full animate-float"></div>
        <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-white/10 rounded-full animate-floatSlow"></div>

        {/* Main logo container */}
        <div className="relative">
          {/* Outer ring */}
          <div className="absolute inset-0 w-32 h-32 border-4 border-white/30 rounded-full animate-spinSlow"></div>

          {/* Inner ring */}
          <div className="absolute inset-2 w-28 h-28 border-2 border-white/20 rounded-full animate-pulse-glow"></div>

          {/* Icon container */}
          <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl animate-scaleIn">
            <Ship className="w-16 h-16 text-blue-600 animate-iconBounce" strokeWidth={2} />
          </div>

          {/* Sparkles */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full animate-pulse-glow opacity-80"></div>
          <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-yellow-200 rounded-full animate-pulse-glow opacity-60" style={{ animationDelay: "0.3s" }}></div>
        </div>

        {/* App name */}
        <div className="mt-8 text-center animate-slideUp" style={{ animationDelay: "0.2s" }}>
          <h1 className="text-3xl font-bold text-white mb-2">섬여행</h1>
          <p className="text-blue-100 text-sm flex items-center justify-center gap-2">
            <Waves className="w-4 h-4" strokeWidth={2} />
            당신의 완벽한 섬 여행 파트너
          </p>
        </div>

        {/* Loading indicator */}
        <div className="mt-8 flex justify-center animate-fadeIn" style={{ animationDelay: "0.4s" }}>
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
