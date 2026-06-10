import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Ship, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("이메일과 비밀번호를 입력해주세요");
      return;
    }

    // Mock login
    const user = {
      id: "1",
      name: "홍길동",
      email: formData.email,
      phone: "010-1234-5678",
      joinDate: new Date().toISOString(),
    };

    localStorage.setItem("user", JSON.stringify(user));
    toast.success("로그인됐어요! 반가워요");
    navigate("/");
  };

  const handleSocialLogin = (provider: "kakao" | "naver" | "google") => {
    // 소셜 로그인 시 회원가입 페이지로 이동
    navigate(`/signup?method=${provider}`);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-8 text-center flex-shrink-0">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Ship className="w-10 h-10 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">인천 도서 여행</h1>
        <p className="text-sm text-gray-600">계정에 로그인하세요</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4" strokeWidth={2} />
              이메일
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              onFocus={(e) => e.target.classList.add("animate-input-focus")}
              onBlur={(e) => e.target.classList.remove("animate-input-focus")}
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
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                onFocus={(e) => e.target.classList.add("animate-input-focus")}
                onBlur={(e) => e.target.classList.remove("animate-input-focus")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={2} /> : <Eye className="w-5 h-5" strokeWidth={2} />}
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
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform"
          >
            로그인
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-500">또는</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <button
            onClick={() => handleSocialLogin("kakao")}
            className="w-full bg-[#FEE500] text-gray-900 py-3 rounded-xl font-semibold active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <div className="w-5 h-5 bg-gray-900 rounded-full" />
            카카오로 시작하기
          </button>
          <button
            onClick={() => handleSocialLogin("naver")}
            className="w-full bg-[#03C75A] text-white py-3 rounded-xl font-semibold active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <div className="w-5 h-5 bg-white rounded-sm" />
            네이버로 시작하기
          </button>
          <button
            onClick={() => handleSocialLogin("google")}
            className="w-full bg-white border-2 border-gray-300 text-gray-900 py-3 rounded-xl font-semibold active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <div className="w-5 h-5 bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500 rounded-full" />
            구글로 시작하기
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 border-t border-gray-200 flex-shrink-0 text-center">
        <p className="text-sm text-gray-600">
          아직 계정이 없으신가요?{" "}
          <Link to="/signup" className="text-blue-600 font-semibold">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
