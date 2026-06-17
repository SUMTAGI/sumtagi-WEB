import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/useAuth";

export function ProfileEdit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [nickname, setNickname] = useState(user?.user_metadata?.nickname as string ?? '');
  const [pw, setPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) { toast.error("닉네임을 입력해주세요"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { nickname } });
    setSaving(false);
    if (error) { toast.error("저장에 실패했어요"); return; }
    toast.success("프로필이 수정됐어요");
    navigate("/my");
  };

  const handlePwChange = async () => {
    if (pw.length < 6) { toast.error("비밀번호는 6자 이상이어야 해요"); return; }
    if (pw !== pwConfirm) { toast.error("비밀번호가 일치하지 않아요"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) { toast.error("비밀번호 변경에 실패했어요"); return; }
    setPw(""); setPwConfirm(""); setShowPwForm(false);
    toast.success("비밀번호가 변경됐어요");
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate("/my")} className="active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">프로필 수정</h1>
      </div>

      <div className="px-6 py-6 flex flex-col items-center flex-shrink-0">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-12 h-12 text-blue-600" strokeWidth={2} />
        </div>
      </div>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4" strokeWidth={2} />닉네임
          </label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4" strokeWidth={2} />이메일
          </label>
          <input
            type="email"
            value={user.email ?? ''}
            readOnly
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
          />
        </div>

        {/* 비밀번호 변경 토글 */}
        <button
          type="button"
          onClick={() => setShowPwForm(!showPwForm)}
          className="flex items-center gap-2 text-sm text-blue-600 font-medium"
        >
          <Lock className="w-4 h-4" strokeWidth={2} />
          비밀번호 변경 {showPwForm ? '▲' : '▼'}
        </button>

        {showPwForm && (
          <div className="space-y-3 bg-gray-50 rounded-xl p-4">
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="새 비밀번호 (6자 이상)"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <input
              type="password"
              value={pwConfirm}
              onChange={e => setPwConfirm(e.target.value)}
              placeholder="비밀번호 확인"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handlePwChange}
              disabled={saving}
              className="w-full bg-gray-800 text-white py-3 rounded-xl font-semibold disabled:opacity-60"
            >
              비밀번호 변경
            </button>
          </div>
        )}
      </form>

      <div className="p-6 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-60"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}
