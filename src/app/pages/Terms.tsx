import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";

export function Terms() {
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
        <h1 className="text-xl font-bold mb-1">이용약관</h1>
        <p className="text-sm text-blue-100">시행일: 2026년 7월 11일</p>
      </div>

      <div className="px-6 py-6 space-y-8 text-sm text-gray-700 leading-relaxed">
        <Section title="제1조 (목적)">
          <p>
            본 약관은 섬타기(이하 "서비스")가 제공하는 인천 도서 여행 정보·일정 설계 서비스의 이용과 관련하여
            서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </Section>

        <Section title="제2조 (용어의 정의)">
          <ul className="list-disc pl-5 space-y-1">
            <li>"이용자"란 본 약관에 따라 서비스가 제공하는 서비스를 이용하는 회원을 말합니다.</li>
            <li>"회원"이란 서비스에 개인정보를 제공하여 회원가입을 한 자로서, 서비스가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
          </ul>
        </Section>

        <Section title="제3조 (약관의 효력 및 변경)">
          <p>
            본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
            서비스는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며, 변경 시 사전 공지합니다.
          </p>
        </Section>

        <Section title="제4조 (회원가입 및 탈퇴)">
          <p>
            이용자는 이메일 또는 소셜 계정(구글, 카카오 등)을 통해 회원가입을 신청할 수 있으며,
            회원은 언제든지 마이페이지를 통해 탈퇴를 요청할 수 있습니다.
          </p>
        </Section>

        <Section title="제5조 (서비스의 제공 및 변경)">
          <p>
            서비스는 인천 도서 지역의 관광지·숙박·맛집 정보 제공, 여행 일정 자동 생성, 커뮤니티,
            그룹 여행 등의 기능을 제공합니다. 서비스는 운영상·기술상 필요에 따라 제공하는 서비스의
            내용을 변경할 수 있습니다.
          </p>
        </Section>

        <Section title="제6조 (회원의 의무)">
          <ul className="list-disc pl-5 space-y-1">
            <li>회원은 관계 법령과 본 약관을 준수하여야 합니다.</li>
            <li>회원은 타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.</li>
            <li>회원은 서비스를 이용하여 얻은 정보를 무단으로 복제·배포·상업적으로 이용할 수 없습니다.</li>
          </ul>
        </Section>

        <Section title="제7조 (면책조항)">
          <p>
            서비스는 여객선 운항 정보, 관광지 정보 등 외부 공공 API 및 제3자가 제공하는 정보를 기반으로
            콘텐츠를 제공하며, 실제 현지 상황과 차이가 있을 수 있습니다. 서비스는 이용자가 서비스 정보를
            신뢰하여 행한 여행 계획·예약 등으로 발생한 손해에 대해 고의 또는 중대한 과실이 없는 한
            책임을 지지 않습니다.
          </p>
        </Section>

        <Section title="제8조 (분쟁 해결)">
          <p>
            본 약관과 관련하여 분쟁이 발생한 경우 관련 법령 및 상관례에 따르며, 서비스와 이용자 간
            협의가 이루어지지 않을 경우 관할 법원에 소를 제기할 수 있습니다.
          </p>
        </Section>

        <Section title="문의">
          <p>이메일: kimsungil322@gmail.com</p>
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
