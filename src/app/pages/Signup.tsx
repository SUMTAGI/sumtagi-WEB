import { supabase } from "../lib/supabase";
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router";
import { Ship, Mail, Lock, User, Eye, EyeOff, ChevronLeft, Heart, Camera, UtensilsCrossed, Trees, Dog } from "lucide-react";
import { toast } from "sonner";

type SignupMethod = "email" | "kakao" | "google" | "naver" | null;

export function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [signupMethod, setSignupMethod] = useState<SignupMethod>(null);

  // URL 파라미터에서 소셜 로그인 방법 확인
  useEffect(() => {
    const method = searchParams.get("method") as SignupMethod;
    if (method && (method === "kakao" || method === "google" || method === "naver")) {
      setSignupMethod(method);
      setStep(2); // 바로 여행 스타일 선택으로 이동
    }
  }, [searchParams]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
    travelStyle: "",
    agreeTerms: false,
    agreePrivacy: false,
  });

  const handleMethodSelect = (method: SignupMethod) => {
    setSignupMethod(method);
    if (method === "kakao" || method === "google") {
      setStep(2); // Skip email form, go directly to travel preferences
    } else {
      setStep(1); // Go to email signup form
    }
  };

  const handleEmailSignup = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nickname || !formData.email || !formData.password) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("비밀번호가 일치하지 않아요");
      return;
    }

    if (!formData.agreeTerms || !formData.agreePrivacy) {
      toast.error("약관에 동의해주세요");
      return;
    }

    setStep(2); // Go to travel preferences
  };

  const handleComplete = async () => {
    if (!formData.travelStyle) {
      toast.error("여행 스타일을 선택해주세요");
      return;
    }

    if (signupMethod !== "email" && !formData.nickname) {
      toast.error("닉네임을 입력해주세요");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      nickname: formData.nickname,
      travelStyle: formData.travelStyle,
      signupMethod: signupMethod,
    },
  },
});

if (error) {
  toast.error(error.message);
  return;
}

localStorage.setItem("user", JSON.stringify(data.user));
localStorage.setItem("isLoggedIn", "true");
toast.success("회원가입이 완료됐어요! 로그인해주세요.");
navigate("/login");
  };

  const travelStyles = [
    { id: "힐링", label: "힐링", icon: Heart, color: "from-pink-400 to-pink-600" },
    { id: "액티비티", label: "액티비티", icon: Camera, color: "from-purple-400 to-purple-600" },
    { id: "맛집탐방", label: "맛집 탐방", icon: UtensilsCrossed, color: "from-orange-400 to-orange-600" },
    { id: "자연관광", label: "자연 관광", icon: Trees, color: "from-green-400 to-green-600" },
    { id: "반려동물동반", label: "반려동물 동반", icon: Dog, color: "from-blue-400 to-blue-600" },
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => {
            if (step === 0) {
              navigate(-1);
            } else if (step === 1) {
              setStep(0);
              setSignupMethod(null);
            } else if (step === 2 && signupMethod === "email") {
              setStep(1);
            } else if (step === 2 && (signupMethod === "kakao" || signupMethod === "google" || signupMethod === "naver")) {
              navigate("/login");
            }
          }}
          className="flex items-center gap-2 text-gray-700 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          <span className="font-medium">뒤로</span>
        </button>
      </div>

      {/* Logo */}
      <div className="px-6 py-6 text-center flex-shrink-0">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Ship className="w-8 h-8 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {step === 2 && (signupMethod === "kakao" || signupMethod === "google" || signupMethod === "naver") ? "여행 스타일 선택" : "회원가입"}
        </h1>
        <p className="text-sm text-gray-600">
          {step === 0 && "가입 방법을 선택해주세요"}
          {step === 1 && "기본 정보를 입력해주세요"}
          {step === 2 && (signupMethod === "kakao" || signupMethod === "google" || signupMethod === "naver") && "선호하는 여행 스타일을 알려주세요"}
          {step === 2 && signupMethod === "email" && "여행 스타일을 선택해주세요"}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 overflow-y-auto">
        {/* Step 0: Method Selection */}
        {step === 0 && (
          <div className="space-y-3 pb-6">
            <button
              onClick={() => handleMethodSelect("email")}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Mail className="w-5 h-5" strokeWidth={2} />
              이메일로 시작하기
            </button>

            <div className="pt-4 text-center">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{" "}
                <Link to="/login" className="text-blue-600 font-semibold">
                  로그인
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Email Signup Form */}
        {step === 1 && signupMethod === "email" && (
          <form onSubmit={handleEmailSignup} className="space-y-4 pb-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4" strokeWidth={2} />
                닉네임
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="섬여행러"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="8자 이상 입력"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4" strokeWidth={2} />
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="비밀번호 재입력"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" strokeWidth={2} /> : <Eye className="w-5 h-5" strokeWidth={2} />}
                </button>
              </div>
            </div>

            {/* Agreements */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="mt-1 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">
                  <span className="font-medium text-gray-900">[필수]</span> 이용약관에 동의합니다
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.agreePrivacy}
                  onChange={(e) => setFormData({ ...formData, agreePrivacy: e.target.checked })}
                  className="mt-1 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">
                  <span className="font-medium text-gray-900">[필수]</span> 개인정보 처리방침에 동의합니다
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              다음
            </button>
          </form>
        )}

        {/* Step 2: Travel Preferences */}
        {step === 2 && (
          <div className="space-y-6 pb-6">
            {/* Nickname for social users */}
            {(signupMethod === "kakao" || signupMethod === "google" || signupMethod === "naver") && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4" strokeWidth={2} />
                  닉네임
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="섬여행러"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Travel Style Selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">선호 여행 스타일</h3>
              <div className="grid grid-cols-2 gap-3">
                {travelStyles.map((style) => {
                  const Icon = style.icon;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, travelStyle: style.id })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.travelStyle === style.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 bg-white active:scale-95"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${style.color} flex items-center justify-center mx-auto mb-2`}>
                        <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                      </div>
                      <div className={`text-sm font-medium ${
                        formData.travelStyle === style.id ? "text-blue-600" : "text-gray-900"
                      }`}>
                        {style.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              가입 완료
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
