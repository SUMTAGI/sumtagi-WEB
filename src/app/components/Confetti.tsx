import { useEffect, useState } from "react";

interface ConfettiProps {
  onComplete?: () => void;
  duration?: number;
}

export function Confetti({ onComplete, duration = 3000 }: ConfettiProps) {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; color: string; delay: number }>>([]);

  useEffect(() => {
    const colors = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];
    const newPieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
    }));
    setPieces(newPieces);

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 animate-confetti"
          style={{
            left: `${piece.left}%`,
            top: "-10px",
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
