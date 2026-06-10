import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, User, Mail, Phone, Camera } from "lucide-react";
import { toast } from "sonner";

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  profileImage?: string;
}

export function ProfileEdit() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    profileImage: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const userData = JSON.parse(stored);
      setUser(userData);
      setFormData({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        profileImage: userData.profileImage || "",
      });
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          profileImage: reader.result as string,
        });
        toast.success("프로필 사진이 선택됐어요");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }

    const updatedUser = {
      ...user!,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      profileImage: formData.profileImage,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));
    toast.success("프로필이 수정됐어요");
    navigate("/my");
  };

  if (!user) return null;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate("/my")}
          className="active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">프로필 수정</h1>
      </div>

      {/* Profile Photo */}
      <div className="px-6 py-6 flex flex-col items-center flex-shrink-0">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center overflow-hidden">
            {formData.profileImage ? (
              <img
                src={formData.profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-white" strokeWidth={2} />
            )}
          </div>
          <input
            type="file"
            id="profile-image"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <label
            htmlFor="profile-image"
            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
          >
            <Camera className="w-4 h-4 text-white" strokeWidth={2} />
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-3">프로필 사진 변경</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6">
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" strokeWidth={2} />
              이름
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4" strokeWidth={2} />
              전화번호
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2">
            <p className="text-sm text-gray-500 mb-2">회원 정보</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">가입일</span>
                <span className="text-gray-900">
                  {new Date(user.joinDate).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">회원 ID</span>
                <span className="text-gray-900">{user.id}</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Bottom Button */}
      <div className="p-6 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform"
        >
          저장하기
        </button>
      </div>
    </div>
  );
}
