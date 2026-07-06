import { Waves } from "lucide-react";

interface IslandImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
}

/** 섬 사진이 없을 때(관광공사 API에 실사진이 없는 섬) 깨진 이미지 대신 표시하는 플레이스홀더 */
export function IslandImage({ src, alt, className }: IslandImageProps) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 ${className ?? ""}`}>
        <Waves className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} />;
}
