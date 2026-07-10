import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";

export function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-3 text-blue-100 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          <span className="text-sm">뒤로</span>
        </button>
        <h1 className="text-xl font-bold mb-1">개인정보처리방침</h1>
        <p className="text-sm text-blue-100">시행일: 2026년 7월 11일</p>
      </div>

      <div className="px-6 py-6 space-y-8 text-sm text-gray-700 leading-relaxed">
        <p>
          섬타기(이하 "서비스")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수합니다.
          본 방침은 서비스가 어떤 개인정보를 수집하고, 어떻게 이용·보관·제공하는지 안내합니다.
        </p>

        <Section title="1. 수집하는 개인정보 항목">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>이메일 회원가입 시</b>: 이메일 주소, 비밀번호(암호화 저장), 닉네임, 선호 여행 스타일</li>
            <li><b>소셜 로그인(구글, 카카오 등) 시</b>: 해당 소셜 계정이 제공하는 이메일, 프로필 이름 등 기본 정보</li>
            <li><b>서비스 이용 중</b>: 프로필 사진(사진 라이브러리·카메라 접근 시), 여행 일정·즐겨찾기·커뮤니티 게시물 등 이용자가 직접 입력한 정보</li>
            <li><b>자동 수집 정보</b>: 기기 정보, 접속 로그, 서비스 이용 기록(오류 진단 및 품질 개선 목적)</li>
          </ul>
        </Section>

        <Section title="2. 개인정보의 수집 및 이용 목적">
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 가입 의사 확인, 본인 식별·인증, 회원 관리</li>
            <li>맞춤형 여행 일정 추천 및 콘텐츠 제공</li>
            <li>커뮤니티·그룹 여행 등 부가 서비스 제공</li>
            <li>서비스 오류 대응, 부정 이용 방지, 고객 문의 응대</li>
          </ul>
        </Section>

        <Section title="3. 개인정보의 보유 및 이용 기간">
          <p>
            원칙적으로 회원 탈퇴 시 지체 없이 파기합니다. 다만 관계 법령에 따라 보존이 필요한 경우
            해당 법령에서 정한 기간 동안 보관합니다.
          </p>
        </Section>

        <Section title="4. 개인정보 처리 위탁">
          <p>
            서비스는 안정적인 데이터 보관·인증을 위해 아래와 같이 개인정보 처리를 위탁하고 있습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><b>Supabase Inc.</b> — 회원 데이터베이스 호스팅, 인증(로그인) 처리</li>
          </ul>
        </Section>

        <Section title="5. 개인정보의 제3자 제공">
          <p>
            서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만 법령에 근거하거나
            수사 목적으로 관계 기관이 요청하는 경우는 예외로 합니다.
          </p>
        </Section>

        <Section title="6. 이용자의 권리와 행사 방법">
          <p>
            이용자는 언제든지 앱 내 마이페이지에서 본인의 개인정보를 조회·수정할 수 있으며,
            회원 탈퇴를 통해 개인정보 삭제를 요청할 수 있습니다.
          </p>
        </Section>

        <Section title="7. 개인정보의 파기 절차 및 방법">
          <p>
            수집 목적이 달성된 개인정보는 전자적 파일 형태의 경우 복구 불가능한 방법으로 즉시 삭제합니다.
          </p>
        </Section>

        <Section title="8. 개인정보 보호책임자">
          <p>
            개인정보 관련 문의 및 불만 처리는 아래 연락처로 접수해 주시기 바랍니다.
          </p>
          <p className="mt-2">이메일: kimsungil322@gmail.com</p>
        </Section>

        <Section title="9. 고지의 의무">
          <p>
            본 방침의 내용이 변경되는 경우 시행 최소 7일 전에 서비스 내 공지사항을 통해 안내합니다.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
      {children}
    </div>
  );
}
