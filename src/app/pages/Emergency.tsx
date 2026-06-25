import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Phone, Hospital, Shield, Ship, AlertCircle, ChevronDown, ChevronUp, MapPin } from "lucide-react";

interface EmergencyContact {
  island: string;
  hospital?: { name: string; phone: string; address: string };
  pharmacy?: { name: string; phone: string; address: string };
  police: { name: string; phone: string; address: string };
  coastGuard: { name: string; phone: string };
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    island: "백령도",
    hospital: { name: "백령보건지소", phone: "032-899-3100", address: "백령면 백령리 328" },
    pharmacy: { name: "백령약국", phone: "032-836-3275", address: "백령면 백령리 505" },
    police: { name: "백령파출소", phone: "032-836-3112", address: "백령면 백령리 458" },
    coastGuard: { name: "백령해경", phone: "032-836-5117" },
  },
  {
    island: "덕적도",
    hospital: { name: "덕적보건지소", phone: "032-899-3200", address: "덕적면 진리 468-2" },
    pharmacy: { name: "덕적약국", phone: "032-831-8275", address: "덕적면 진리 489" },
    police: { name: "덕적파출소", phone: "032-831-3112", address: "덕적면 진리 453" },
    coastGuard: { name: "덕적파출소", phone: "032-832-0857" },
  },
  {
    island: "자월도",
    hospital: { name: "자월보건진료소", phone: "032-899-3300", address: "자월면 자월리 230" },
    police: { name: "자월파출소", phone: "032-832-3112", address: "자월면 자월리 195" },
    coastGuard: { name: "자월파출소", phone: "032-832-2857" },
  },
  {
    island: "대청도",
    hospital: { name: "대청보건지소", phone: "032-899-3150", address: "대청면 대청리 234" },
    police: { name: "대청파출소", phone: "032-836-3114", address: "대청면 대청리 189" },
    coastGuard: { name: "대청해경", phone: "032-836-5119" },
  },
  {
    island: "영흥도",
    hospital: { name: "영흥보건지소", phone: "032-899-3250", address: "영흥면 내리 391" },
    pharmacy: { name: "영흥약국", phone: "032-886-8275", address: "영흥면 내리 458" },
    police: { name: "영흥파출소", phone: "032-886-3112", address: "영흥면 내리 423" },
    coastGuard: { name: "영흥파출소", phone: "032-886-0857" },
  },
];

const FIRST_AID = [
  {
    id: "1",
    title: "해파리 쏘임",
    symptoms: "통증, 붉은 반점, 부종",
    treatment: [
      "즉시 바닷물로 씻어내기 (수돗물 사용 금지)",
      "촉수나 자포 제거",
      "식초나 베이킹소다로 중화",
      "얼음으로 냉찜질",
      "심한 경우 즉시 병원 방문"
    ]
  },
  {
    id: "2",
    title: "열사병",
    symptoms: "고열, 두통, 현기증, 구토",
    treatment: [
      "그늘진 곳으로 이동",
      "젖은 수건으로 몸 식히기",
      "물 또는 이온음료 섭취",
      "의식이 없으면 즉시 119 신고",
      "병원으로 신속 이송"
    ]
  },
  {
    id: "3",
    title: "멀미",
    symptoms: "메스꺼움, 구토, 어지러움",
    treatment: [
      "갑판 위 신선한 공기 쐬기",
      "멀리 수평선 바라보기",
      "멀미약 복용 (출항 30분 전)",
      "생강차나 박하사탕 섭취",
      "누워서 눈 감고 휴식"
    ]
  },
  {
    id: "4",
    title: "베임/찰과상",
    symptoms: "출혈, 상처",
    treatment: [
      "깨끗한 물로 상처 세척",
      "지혈 (거즈로 압박)",
      "소독약 바르기",
      "밴드나 붕대로 감기",
      "깊은 상처는 병원 방문"
    ]
  },
];

export function Emergency() {
  const navigate = useNavigate();
  const [selectedIsland, setSelectedIsland] = useState<string>("백령도");
  const [expandedAid, setExpandedAid] = useState<string | null>(null);

  const currentContact = EMERGENCY_CONTACTS.find(c => c.island === selectedIsland);

  const handleCall = (phone: string, name: string) => {
    if (window.confirm(`${name}(${phone})로 전화하시겠습니까?`)) {
      window.location.href = `tel:${phone}`;
    }
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-3 text-blue-100 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          <span className="text-sm">뒤로</span>
        </button>
        <h1 className="text-xl font-bold mb-1">긴급 연락처</h1>
        <p className="text-sm text-blue-100">위급한 상황에 대비하세요</p>
      </div>

      {/* 119/112 Quick Access */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleCall("119", "소방서")}
            className="bg-white border-2 border-blue-500 text-blue-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm"
          >
            <AlertCircle className="w-6 h-6" strokeWidth={2} />
            <div>
              <div className="text-xs">화재·응급</div>
              <div className="text-xl">119</div>
            </div>
          </button>
          <button
            onClick={() => handleCall("112", "경찰서")}
            className="bg-white border-2 border-blue-500 text-blue-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm"
          >
            <Shield className="w-6 h-6" strokeWidth={2} />
            <div>
              <div className="text-xs">범죄·사고</div>
              <div className="text-xl">112</div>
            </div>
          </button>
        </div>
      </div>

      {/* Island Selector */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-2">섬 선택</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {EMERGENCY_CONTACTS.map(contact => (
            <button
              key={contact.island}
              onClick={() => setSelectedIsland(contact.island)}
              className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                selectedIsland === contact.island
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {contact.island}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="">
        {/* Emergency Contacts */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">{selectedIsland} 연락처</h3>
          <div className="space-y-3">
            {/* Hospital */}
            {currentContact?.hospital && (
              <ContactCard
                icon={<Hospital className="w-5 h-5 text-blue-600" strokeWidth={2} />}
                title={currentContact.hospital.name}
                subtitle="병원"
                phone={currentContact.hospital.phone}
                address={currentContact.hospital.address}
                onCall={handleCall}
              />
            )}

            {/* Pharmacy */}
            {currentContact?.pharmacy && (
              <ContactCard
                icon={<Hospital className="w-5 h-5 text-green-600" strokeWidth={2} />}
                title={currentContact.pharmacy.name}
                subtitle="약국"
                phone={currentContact.pharmacy.phone}
                address={currentContact.pharmacy.address}
                onCall={handleCall}
              />
            )}

            {/* Police */}
            <ContactCard
              icon={<Shield className="w-5 h-5 text-blue-600" strokeWidth={2} />}
              title={currentContact?.police.name || ""}
              subtitle="경찰서"
              phone={currentContact?.police.phone || ""}
              address={currentContact?.police.address}
              onCall={handleCall}
            />

            {/* Coast Guard */}
            <ContactCard
              icon={<Ship className="w-5 h-5 text-indigo-600" strokeWidth={2} />}
              title={currentContact?.coastGuard.name || ""}
              subtitle="해양경찰"
              phone={currentContact?.coastGuard.phone || ""}
              onCall={handleCall}
            />
          </div>
        </div>

        {/* First Aid Guide */}
        <div className="px-6 py-4 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-3">응급처치 가이드</h3>
          <div className="space-y-2">
            {FIRST_AID.map(aid => (
              <div key={aid.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedAid(expandedAid === aid.id ? null : aid.id)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 mb-1">{aid.title}</div>
                    <div className="text-xs text-gray-500">{aid.symptoms}</div>
                  </div>
                  {expandedAid === aid.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" strokeWidth={2} />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" strokeWidth={2} />
                  )}
                </button>

                {expandedAid === aid.id && (
                  <div className="px-4 pb-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="text-sm font-semibold text-blue-900 mb-2">응급처치 방법</div>
                      <ol className="space-y-2 text-sm text-blue-800">
                        {aid.treatment.map((step, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="font-semibold">{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Return Info */}
        <div className="px-6 py-4 bg-orange-50 border-t border-orange-100">
          <div className="bg-white rounded-xl p-4 border border-orange-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-orange-600" strokeWidth={2} />
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">긴급 귀항 안내</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• 기상 악화 시 여객선 결항 가능</li>
                  <li>• 헬기 긴급 수송: 119 또는 해경 연락</li>
                  <li>• 응급 환자는 최우선 이송</li>
                  <li>• 여행자 보험 가입 권장</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactCard({
  icon,
  title,
  subtitle,
  phone,
  address,
  onCall
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  phone: string;
  address?: string;
  onCall: (phone: string, name: string) => void;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg border border-gray-200">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900">{title}</div>
          <div className="text-xs text-gray-500 mb-2">{subtitle}</div>
          {address && (
            <div className="flex items-start gap-1 text-xs text-gray-600 mb-2">
              <MapPin className="w-3 h-3 mt-0.5" strokeWidth={2} />
              <span>{address}</span>
            </div>
          )}
          <button
            onClick={() => onCall(phone, title)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
          >
            <Phone className="w-4 h-4" strokeWidth={2} />
            {phone}
          </button>
        </div>
      </div>
    </div>
  );
}
