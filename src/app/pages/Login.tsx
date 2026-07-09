import { supabase } from "../lib/supabase";
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import { Ship, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath =
    (location.state as { from?: string } | null)?.from ?? "/";
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("이메일과 비밀번호를 입력해주세요");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("로그인 성공!");
    navigate(returnPath, { replace: true });
  };

  const handleKakaoLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/`,
        scopes: "profile_nickname profile_image",
      },
    });

    if (error) {
      toast.error(error.message);
      console.error("카카오 로그인 실패:", error.message);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast.error(error.message);
      console.error("구글 로그인 실패:", error.message);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden relative bg-gradient-to-b from-blue-50 via-white to-white">
      {/* 절제된 장식 요소 — 섬·바다 느낌의 은은한 블러만 사용 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-80 h-80 bg-blue-100/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-24 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen lg:h-screen flex flex-col items-center justify-center px-4 py-10 lg:py-4">
        <div className="w-full max-w-[420px] lg:max-w-[440px] lg:mt-8">
          {/* 홈 링크 + 로고를 한 줄로 묶은 간결한 미니 헤더 */}
          <div className="flex items-center justify-between mb-6 lg:mb-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              홈으로 돌아가기
            </Link>

            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Ship className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-gray-900 tracking-tight">섬타기</span>
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-[0_2px_10px_rgba(15,23,42,0.05)] p-6 lg:p-5">
            <div className="text-center mb-6 lg:mb-3.5">
              <h1 className="text-xl lg:text-lg font-bold text-gray-900 mb-1.5 lg:mb-1">여행을 이어가세요</h1>
              <p className="text-sm text-gray-500">로그인하고 나만의 섬 여행을 계획해보세요</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3.5 lg:mb-2.5">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2 lg:mb-1">
                  <Mail className="w-4 h-4" strokeWidth={2} />
                  이메일
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 lg:py-2.5 border border-gray-300 rounded-xl text-[15px] lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="mb-3.5 lg:mb-2.5">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2 lg:mb-1">
                  <Lock className="w-4 h-4" strokeWidth={2} />
                  비밀번호
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full px-4 py-3 lg:py-2.5 pr-12 border border-gray-300 rounded-xl text-[15px] lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 lg:w-4 lg:h-4" strokeWidth={2} />
                    ) : (
                      <Eye className="w-5 h-5 lg:w-4 lg:h-4" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm mb-2.5 lg:mb-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-gray-700">로그인 유지</span>
                </label>
                <button type="button" className="text-blue-600 font-medium">
                  비밀번호 찾기
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 lg:py-2.5 rounded-xl font-semibold text-[15px] lg:text-sm active:scale-95 transition-all"
              >
                로그인
              </button>
            </form>

            <div className="flex items-center gap-3 my-6 lg:my-3.5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-500">또는</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 lg:gap-2">
              <button
                type="button"
                onClick={handleKakaoLogin}
                className="bg-[#FEE500] hover:brightness-95 text-gray-900 py-3 lg:py-2.5 rounded-xl font-semibold text-[15px] lg:text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <img src="/icons/kakao.svg" alt="Kakao" className="w-5 h-5 lg:w-4 lg:h-4" />
                <span className="lg:hidden">카카오로 시작하기</span>
                <span className="hidden lg:inline">카카오</span>
              </button>

              <button
                type="button"
                onClick={() => toast.info("Apple 로그인은 추후 지원 예정입니다.")}
                className="bg-black hover:bg-gray-900 text-white py-3 lg:py-2.5 rounded-xl font-semibold text-[15px] lg:text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <img src="/icons/apple.svg" alt="Apple" className="w-5 h-5 lg:w-4 lg:h-4" />
                <span className="lg:hidden">Apple로 로그인</span>
                <span className="hidden lg:inline">Apple</span>
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-900 py-3 lg:py-2.5 rounded-xl font-semibold text-[15px] lg:text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <img src="/icons/google.svg" alt="Google" className="w-5 h-5 lg:w-4 lg:h-4" />
                <span className="lg:hidden">구글로 시작하기</span>
                <span className="hidden lg:inline">Google</span>
              </button>
            </div>

            <div className="mt-8 lg:mt-4 pt-6 lg:pt-3.5 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                아직 계정이 없나요?{" "}
                <Link to="/signup" className="text-blue-600 font-semibold">
                  회원가입
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
