import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Ship, MapPin, Calendar, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";

const slides = [
  {
    id: 1,
    icon: Ship,
    title: "인천 섬 여행의 시작",
    description: "여객선 운항 정보를 기반으로\n실제 이동 가능한 여행 일정을\n자동으로 생성합니다",
    gradient: "from-blue-400 to-blue-600",
    bgPattern: "from-blue-50 via-blue-100 to-blue-50",
    particleColor: "bg-blue-400",
    emoji: "⛴️",
  },
  {
    id: 2,
    icon: Calendar,
    title: "맞춤형 일정 생성",
    description: "여행 기간, 인원, 취향을 입력하면\nAI가 최적의 일정을\n자동으로 계획해드립니다",
    gradient: "from-purple-400 to-purple-600",
    bgPattern: "from-purple-50 via-purple-100 to-purple-50",
    particleColor: "bg-purple-400",
    emoji: "✨",
  },
  {
    id: 3,
    icon: MapPin,
    title: "스마트 관광지 추천",
    description: "혼잡도 분석과 날씨 정보로\n가장 쾌적한 시간대와 장소를\n추천해드립니다",
    gradient: "from-green-400 to-green-600",
    bgPattern: "from-green-50 via-green-100 to-green-50",
    particleColor: "bg-green-400",
    emoji: "🗺️",
  },
  {
    id: 4,
    icon: Sparkles,
    title: "통합 예약 관리",
    description: "여객선, 숙박, 체험까지\n모든 예약을 한 곳에서\n간편하게 관리하세요",
    gradient: "from-orange-400 to-orange-600",
    bgPattern: "from-orange-50 via-orange-100 to-orange-50",
    particleColor: "bg-orange-400",
    emoji: "🎉",
  },
];

export function Onboarding() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection("next");
      setCurrentSlide(currentSlide + 1);
    } else {
      // Show confetti on final click
      setShowConfetti(true);
      setTimeout(() => {
        localStorage.setItem("hasSeenOnboarding", "true");
        navigate("/login");
      }, 800);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection("prev");
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    navigate("/login");
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentSlide ? "next" : "prev");
    setCurrentSlide(index);
  };

  // Swipe gesture handling
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-white relative overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-10%",
                backgroundColor: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${Math.random() * 2 + 2}s`,
              }}
            />
          ))}
        </div>
      )}
      {/* Animated Background Pattern */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgPattern} transition-all duration-700 ease-in-out`}>
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full ${slide.particleColor} opacity-20 animate-float`}
              style={{
                width: `${Math.random() * 60 + 20}px`,
                height: `${Math.random() * 60 + 20}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${Math.random() * 10 + 10}s`,
              }}
            />
          ))}

          {/* Floating emojis */}
          {[...Array(5)].map((_, i) => (
            <div
              key={`emoji-${i}`}
              className="absolute text-4xl opacity-10 animate-float"
              style={{
                left: `${Math.random() * 90}%`,
                top: `${Math.random() * 90}%`,
                animationDelay: `${i * 1}s`,
                animationDuration: `${Math.random() * 15 + 15}s`,
              }}
            >
              {slide.emoji}
            </div>
          ))}
        </div>

        {/* Gradient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-white/30 to-transparent rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse-slow" style={{ animationDelay: "1.5s" }}></div>
      </div>

      {/* Top Navigation */}
      <div className="relative z-10 px-6 py-4 flex justify-between items-center flex-shrink-0">
        {/* Back Button */}
        {currentSlide > 0 ? (
          <button
            onClick={handlePrev}
            className="flex items-center gap-1.5 text-sm text-gray-500 font-semibold px-4 py-2.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white hover:text-gray-700 active:scale-95 transition-all shadow-md hover:shadow-lg border border-gray-200"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
            이전
          </button>
        ) : (
          <div className="w-20"></div>
        )}

        {/* Skip Button */}
        {currentSlide < slides.length - 1 && (
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 font-semibold px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white hover:text-gray-700 active:scale-95 transition-all shadow-md hover:shadow-lg border border-gray-200"
          >
            건너뛰기
          </button>
        )}
      </div>

      {/* Slide Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Icon with advanced animations */}
        <div
          key={`icon-${currentSlide}`}
          className={`mb-8 ${
            direction === "next" ? "animate-slide-in-right" : "animate-slide-in-left"
          }`}
        >
          <div className="relative">
            {/* Outer glow ring */}
            <div className={`absolute inset-0 w-40 h-40 rounded-full bg-gradient-to-br ${slide.gradient} opacity-30 blur-2xl animate-pulse-glow`}></div>

            {/* Main icon container */}
            <div className={`relative w-40 h-40 rounded-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-2xl animate-float-slow`}>
              {/* Inner glow */}
              <div className="absolute inset-2 rounded-full bg-white/10"></div>

              {/* Icon */}
              <Icon className="w-20 h-20 text-white relative z-10 animate-icon-bounce drop-shadow-lg" strokeWidth={2} />

              {/* Rotating rings */}
              <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-spin-slow"></div>
              <div className="absolute inset-3 rounded-full border-2 border-white/20 animate-spin-slow" style={{ animationDirection: "reverse", animationDuration: "15s" }}></div>

              {/* Corner sparkles */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full opacity-80 animate-ping"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-white rounded-full opacity-60 animate-ping" style={{ animationDelay: "0.5s" }}></div>
            </div>

            {/* Emoji decoration */}
            <div className="absolute -bottom-4 -right-4 text-5xl animate-bounce-slow filter drop-shadow-lg">
              {slide.emoji}
            </div>
          </div>
        </div>

        {/* Title with slide animation */}
        <h1
          key={`title-${currentSlide}`}
          className={`text-3xl font-bold text-gray-900 mb-4 ${
            direction === "next" ? "animate-slide-up" : "animate-slide-down"
          }`}
        >
          {slide.title}
        </h1>

        {/* Description with stagger animation */}
        <div
          key={`desc-${currentSlide}`}
          className={`${
            direction === "next" ? "animate-fade-in-delayed" : "animate-fade-in-delayed"
          }`}
        >
          <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line mb-6">
            {slide.description}
          </p>
        </div>

        {/* Special message on last slide */}
        {currentSlide === slides.length - 1 && (
          <div className="mt-4 animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
              <span className="text-2xl animate-bounce">🎉</span>
              <p className="text-sm font-bold text-gray-800">
                준비 완료! 지금 바로 시작하세요
              </p>
              <span className="text-2xl animate-bounce" style={{ animationDelay: "0.2s" }}>✨</span>
            </div>
          </div>
        )}

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-8 w-16 h-16 border-4 border-blue-200 rounded-full opacity-30 animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-8 w-12 h-12 border-4 border-purple-200 rounded-full opacity-30 animate-pulse-slow" style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Navigation */}
      <div className="relative z-10 px-6 pb-8 flex-shrink-0">
        {/* Interactive Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((s, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? `w-10 bg-gradient-to-r ${slide.gradient} shadow-lg`
                  : "w-2.5 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Next/Start Button */}
        <button
          onClick={handleNext}
          className={`w-full bg-gradient-to-r ${slide.gradient} text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl hover:shadow-2xl relative overflow-hidden group py-4`}
        >
          {/* Button shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

          {currentSlide === slides.length - 1 && (
            <Sparkles className="w-6 h-6 relative z-10 animate-pulse" strokeWidth={2.5} />
          )}
          <span className="relative z-10">
            {currentSlide < slides.length - 1 ? "다음" : "시작하기"}
          </span>
          <ChevronRight className="w-6 h-6 relative z-10" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
