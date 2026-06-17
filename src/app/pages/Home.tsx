import { Link } from "react-router";
import { Ship, MapPin, Calendar, Sparkles, Shield, ChevronRight, Star, Heart, Bell, Camera, Users, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { WeatherWidget, WeeklyForecast } from "../components/WeatherWidget";
import { getOverallWeather, getOverallForecast } from "../utils/weatherData";
import { tripService } from "../../lib/tripService";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/useAuth";

export function Home() {
  const { user, displayName } = useAuth();
  const [unreadNotifications] = useState(0);
  const [confirmedItinerary, setConfirmedItinerary] = useState<any>(null);
  const [confirmedTripId, setConfirmedTripId] = useState<string | null>(null);

  useEffect(() => {
    tripService.getLatestConfirmedTrip().then(trip => {
      if (trip) {
        setConfirmedItinerary({ ...trip, startDate: trip.start_date, islands: trip.islands ?? [] });
        setConfirmedTripId(trip.id);
      }
    });
  }, []);

  const getDDay = (startDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate + 'T00:00:00');
    const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getDDayMessage = (dday: number) => {
    if (dday === 0) return "오늘 출발이에요! 🎉";
    if (dday === 1) return "내일 떠나요! 설레네요 ✨";
    if (dday <= 3) return "곧 출발이에요! 준비 다 되셨나요? 🌊";
    if (dday <= 7) return "설레는 여행이 다가와요 ⛴️";
    return "여행 준비 잘 하고 계신가요? 🏝️";
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Hero Section with Background */}
      <section className="relative bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-8 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1700621497504-d241a3803bbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-blue-700/80"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              인천 섬 여행
            </h1>
            <Link to="/notifications" className="relative active:scale-95 transition-transform">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Bell className="w-5 h-5 text-blue-600" strokeWidth={2} />
              </div>
              {unreadNotifications > 0 && (
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
              )}
            </Link>
          </div>

          {confirmedItinerary ? (
            <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Ship className="w-5 h-5 text-white" strokeWidth={2} />
                  <h3 className="font-bold text-white">오늘의 여행</h3>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const dday = getDDay(confirmedItinerary.startDate);
                    return dday >= 0 ? (
                      <div className="bg-white/20 px-3 py-1 rounded-full">
                        <span className="text-sm font-bold text-white">
                          {dday === 0 ? "D-Day" : `D-${dday}`}
                        </span>
                      </div>
                    ) : null;
                  })()}
                  <Link
                    to={`/itinerary/${confirmedTripId}`}
                    className="text-xs text-blue-100 underline"
                  >
                    전체보기
                  </Link>
                </div>
              </div>
              <h4 className="text-lg font-bold text-white mb-1">{confirmedItinerary.title}</h4>
              <p className="text-sm text-blue-100 mb-3">
                {getDDayMessage(getDDay(confirmedItinerary.startDate))}
              </p>
              <div className="space-y-1.5">
                {confirmedItinerary.days[0]?.activities.slice(0, 3).map((activity: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-blue-50">
                    <span className="text-blue-200">{activity.time}</span>
                    <span className="flex-1">{activity.title}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/20">
                <Ship className="w-4 h-4 text-blue-200" strokeWidth={2} />
                <span className="text-sm text-blue-100">{confirmedItinerary.departurePort || "인천항"}</span>
                <span className="text-blue-200">→</span>
                <MapPin className="w-4 h-4 text-blue-200" strokeWidth={2} />
                <span className="text-sm text-blue-100">{confirmedItinerary.islands.join(', ')}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl p-4 text-center">
                <Sparkles className="w-12 h-12 text-white mx-auto mb-2" strokeWidth={2} />
                <p className="text-white font-semibold mb-1">아직 계획이 없으신가요?</p>
                <p className="text-sm text-blue-100 mb-3">여객선 정보 기반으로 자동 일정을 생성해드려요</p>
              </div>
              <Link
                to="/create-trip"
                className="flex items-center justify-center gap-2 bg-white text-blue-600 px-6 py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform hover:shadow-xl"
              >
                <Calendar className="w-5 h-5" strokeWidth={2} />
                여행 계획 시작하기
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section className="px-6 py-4 bg-white">
        <div className="grid grid-cols-5 gap-2">
          <Link to="/packages">
            <FeatureCardMobile
              icon={<Sparkles className="w-5 h-5 text-blue-600" strokeWidth={2} />}
              title="패키지"
            />
          </Link>
          <Link to="/experiences">
            <FeatureCardMobile
              icon={<Camera className="w-5 h-5 text-blue-600" strokeWidth={2} />}
              title="체험"
            />
          </Link>
          <Link to="/community">
            <FeatureCardMobile
              icon={<Users className="w-5 h-5 text-blue-600" strokeWidth={2} />}
              title="커뮤니티"
            />
          </Link>
          <Link to="/checklist">
            <FeatureCardMobile
              icon={<Shield className="w-5 h-5 text-blue-600" strokeWidth={2} />}
              title="체크리스트"
            />
          </Link>
          <Link to="/budget">
            <FeatureCardMobile
              icon={<DollarSign className="w-5 h-5 text-blue-600" strokeWidth={2} />}
              title="경비관리"
            />
          </Link>
        </div>
      </section>

      {/* Quick Status */}
      <section className="px-6 py-4 bg-gray-50 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">실시간 운항 현황</h3>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <StatusItem island="백령도" status="정상" />
            <StatusItem island="덕적도" status="정상" />
            <StatusItem island="영흥도" status="정상" />
          </div>
        </div>

        {/* Weather Widget */}
        <WeatherWidget data={getOverallWeather()} />

        {/* Weekly Forecast */}
        <WeeklyForecast forecast={getOverallForecast()} />
      </section>

      {/* Popular Reviews */}
      <section className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">인기 리뷰</h2>
          <Link to="/reviews" className="flex items-center gap-1 text-sm text-blue-600 font-medium">
            전체보기
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory">
          <ReviewCardMobile
            id="1"
            author="김여행"
            location="백령도"
            rating={5}
            preview="두무진의 절경이 정말 압권이었어요. 일몰은 꼭 보세요!"
            image="https://images.unsplash.com/photo-1635355942488-a8bdb5a0803e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
            likes={124}
          />
          <ReviewCardMobile
            id="2"
            author="박바다"
            location="덕적도"
            rating={5}
            preview="서포리 해변의 투명한 바다에 감탄했어요. 가족 여행 최고!"
            image="https://images.unsplash.com/photo-1662898069390-badabf2d65df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
            likes={98}
          />
          <ReviewCardMobile
            id="3"
            author="이섬순"
            location="영흥도"
            rating={4}
            preview="당일치기로 다녀오기 딱 좋았어요. 해산물도 맛있고!"
            image="https://images.unsplash.com/photo-1628412071389-6e8f7a7a4e6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
            likes={87}
          />
        </div>
      </section>

    </div>
  );
}

function StatusItem({ island, status }: { island: string; status: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-700">{island}</span>
      <span className="text-green-600 font-medium">{status} 운항</span>
    </div>
  );
}

function ReviewCardMobile({ id, author, location, rating, preview, image, likes }: {
  id: string;
  author: string;
  location: string;
  rating: number;
  preview: string;
  image: string;
  likes: number;
}) {
  return (
    <Link to={`/review/${id}`} className="flex-shrink-0 w-64 snap-start">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:scale-98 transition-transform">
        <div className="relative h-32">
          <img
            src={image}
            alt={location}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < rating ? "fill-yellow-400 text-yellow-400" : "text-white/40"
                  }`}
                  strokeWidth={2}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/90">
              <MapPin className="w-3 h-3" strokeWidth={2} />
              <span>{location}</span>
            </div>
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">{author}</span>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Heart className="w-3 h-3" strokeWidth={2} />
              <span>{likes}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{preview}</p>
        </div>
      </div>
    </Link>
  );
}

function FeatureCardMobile({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shadow-sm border border-gray-100">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-700 text-center leading-tight">{title}</span>
    </div>
  );
}
