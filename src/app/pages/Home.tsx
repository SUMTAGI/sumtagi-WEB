import { Link } from "react-router";
import { Ship, MapPin, Calendar, Sparkles, Shield, ChevronRight, Star, Heart, Bell, Camera, Users, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { WeatherWidget, WeeklyForecast } from "../components/WeatherWidget";
import { fetchIncheonWeather, type WeatherResult } from "../../lib/weatherService";
import { tripService } from "../../lib/tripService";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/useAuth";
import { getHomeFerryStatus, type FerryRouteStatus } from "../../lib/api/ferry";

interface ReviewData {
  id: string;
  author: string;
  location: string;
  rating: number;
  preview: string;
  image: string;
  likes: number;
}

export function Home() {
  const { user, displayName } = useAuth();
  const [unreadNotifications] = useState(0);
  const [confirmedItinerary, setConfirmedItinerary] = useState<any>(null);
  const [confirmedTripId, setConfirmedTripId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [popularReviews, setPopularReviews] = useState<ReviewData[]>([]);
  const [ferryStatus, setFerryStatus] = useState<FerryRouteStatus[]>([]);
  const [showFerryModal, setShowFerryModal] = useState(false);

  useEffect(() => {
    tripService.getLatestConfirmedTrip().then(trip => {
      if (trip) {
        setConfirmedItinerary({ ...trip, startDate: trip.start_date, islands: trip.islands ?? [] });
        setConfirmedTripId(trip.id);
      }
    });
    fetchIncheonWeather().then(setWeather);
    getHomeFerryStatus().then(setFerryStatus).catch(() => {});

    supabase
      .from('reviews')
      .select('id, rating, content, images, likes_count, profiles(nickname), islands(name, image)')
      .order('likes_count', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) {
          setPopularReviews(
            data.map((r: any) => ({
              id: r.id,
              author: r.profiles?.nickname ?? '여행자',
              location: r.islands?.name ?? '',
              rating: r.rating,
              preview: r.content ?? '',
              image: r.images?.[0] ?? r.islands?.image ?? '',
              likes: r.likes_count,
            }))
          );
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
    <div className="bg-white">
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
              title="리뷰"
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
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <button onClick={() => setShowFerryModal(true)} className="text-xs text-blue-600 font-medium">전체보기</button>
            </div>
          </div>
          <div className="space-y-2">
            {(ferryStatus.length > 0 ? ferryStatus.slice(0, 3) : ['백령도', '덕적도', '영흥도'].map(name => ({ islandName: name, status: '확인중' }))).map((s) => (
              <StatusItem key={s.islandName} island={s.islandName} status={s.status} />
            ))}
          </div>
        </div>

        {/* Weather Widget */}
        <WeatherWidget data={{
          island: '인천 앞바다',
          temp: weather?.current.temp ?? 22,
          condition: weather?.current.condition ?? '맑음',
          waveHeight: weather?.current.waveHeight ?? 0.5,
          windSpeed: weather?.current.windSpeed ?? 3,
          ferryStatus: weather?.current.ferryStatus ?? '정상',
        }} />

        {/* Weekly Forecast */}
        <WeeklyForecast forecast={weather?.forecast ?? []} />
      </section>

      {/* Popular Reviews */}
      <section className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">인기 리뷰</h2>
          <Link to="/community" className="flex items-center gap-1 text-sm text-blue-600 font-medium">
            전체보기
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory">
          {popularReviews.length > 0 ? (
            popularReviews.map(review => (
              <ReviewCardMobile key={review.id} {...review} />
            ))
          ) : (
            <p className="text-sm text-gray-400 py-4">아직 리뷰가 없어요.</p>
          )}
        </div>
      </section>

      {showFerryModal && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowFerryModal(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full bg-white rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">전체 운항 현황</h3>
              <button onClick={() => setShowFerryModal(false)} className="text-gray-400 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-3">
              {ferryStatus.map((s) => (
                <div key={s.islandName} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-800 font-medium">{s.islandName}</span>
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                    s.status === '결항' ? 'bg-red-100 text-red-700' :
                    s.status === '운항없음' ? 'bg-gray-100 text-gray-400' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {s.status === '정상' ? '정상 운항' : s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusItem({ island, status }: { island: string; status: string }) {
  const color = status === '결항' ? 'text-red-600' : status === '운항없음' ? 'text-gray-400' : status === '확인중' ? 'text-gray-400' : 'text-green-600';
  const label = status === '정상' ? '정상 운항' : status === '결항' ? '결항' : status === '운항없음' ? '운항없음' : '확인중...';
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-700">{island}</span>
      <span className={`font-medium ${color}`}>{label}</span>
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
    <div className="w-64 snap-start">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
    </div>
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
