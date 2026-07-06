import { supabase } from "../lib/supabase";
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import { Ship, Mail, Lock, Eye, EyeOff } from "lucide-react";
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
    <div className="bg-white flex-1 lg:flex">
      {/* Brand panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-white/20 to-transparent rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20">
            <Ship className="w-11 h-11 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">인천 도서 여행</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            여객선 운항 정보를 기반으로
            <br />
            실제 이동 가능한 여행 일정을 계획하세요
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 lg:px-16 lg:py-0">
        <div className="w-full max-w-sm mx-auto">
          <div className="text-center mb-8 lg:text-left">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:hidden">
              <Ship className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인</h1>
            <p className="text-sm text-gray-600">계정에 로그인하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" strokeWidth={2} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold active:scale-95 transition-all"
            >
              로그인
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-500">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleKakaoLogin}
              className="w-full bg-[#FEE500] hover:brightness-95 text-gray-900 py-3 rounded-xl font-semibold active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <img src="/icons/kakao.svg" alt="Kakao" className="w-5 h-5" />
              카카오로 시작하기
            </button>

            <button
              type="button"
              onClick={() => toast.info("Apple 로그인은 추후 지원 예정입니다.")}
              className="w-full bg-black hover:bg-gray-900 text-white py-3 rounded-xl font-semibold active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <img src="/icons/apple.svg" alt="Apple" className="w-5 h-5" />
              Apple로 로그인
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-900 py-3 rounded-xl font-semibold active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <img src="/icons/google.svg" alt="Google" className="w-5 h-5" />
              구글로 시작하기
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              아직 계정이 없으신가요?{" "}
              <Link to="/signup" className="text-blue-600 font-semibold">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
