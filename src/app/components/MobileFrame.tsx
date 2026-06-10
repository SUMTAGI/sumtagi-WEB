import { ReactNode } from "react";
import { Battery, Signal, Wifi } from "lucide-react";

interface MobileFrameProps {
  children: ReactNode;
}

export function MobileFrame({ children }: MobileFrameProps) {
  const currentTime = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center p-8">
      <div className="relative">
        {/* Phone Frame */}
        <div className="relative bg-black rounded-[3rem] p-3 shadow-2xl">
          {/* Phone Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-[1.5rem] z-10"></div>

          {/* Screen */}
          <div className="relative bg-white rounded-[2.5rem] overflow-hidden w-[390px] h-[844px] shadow-inner" style={{ borderRadius: '2.5rem' }}>
            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-11 bg-white z-50 flex items-center justify-between px-8 pt-2">
              <span className="text-sm font-semibold">{currentTime}</span>
              <div className="flex items-center gap-1">
                <Signal className="w-4 h-4" strokeWidth={2} />
                <Wifi className="w-4 h-4" strokeWidth={2} />
                <Battery className="w-4 h-4" strokeWidth={2} />
              </div>
            </div>

            {/* App Content */}
            <div className="h-full pt-11 pb-8">
              {children}
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-900 rounded-full" style={{ borderRadius: '100px' }}></div>
          </div>
        </div>

        {/* Side Buttons */}
        <div className="absolute -left-2 top-24 w-1 h-12 bg-gray-800 rounded-l" style={{ borderRadius: '2px 0 0 2px' }}></div>
        <div className="absolute -left-2 top-40 w-1 h-16 bg-gray-800 rounded-l" style={{ borderRadius: '2px 0 0 2px' }}></div>
        <div className="absolute -left-2 top-60 w-1 h-16 bg-gray-800 rounded-l" style={{ borderRadius: '2px 0 0 2px' }}></div>
        <div className="absolute -right-2 top-32 w-1 h-20 bg-gray-800 rounded-r" style={{ borderRadius: '0 2px 2px 0' }}></div>
      </div>
    </div>
  );
}
