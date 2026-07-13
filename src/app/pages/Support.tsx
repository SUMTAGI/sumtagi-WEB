import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronLeft, MessageCircle, Phone, Mail, ChevronDown, ChevronUp, Send, Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { askIslandChat, type ChatMessage } from "../../lib/api/islandChat";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQ[] = [
  {
    id: "1",
    category: "예약",
    question: "예약을 취소하고 싶어요",
    answer: "예약 취소는 '내 여행' > '일정 관리'에서 가능해요. 취소 수수료는 출발일 기준 3일 전까지 무료, 1-2일 전 30%, 당일 50%예요.",
  },
  {
    id: "2",
    category: "예약",
    question: "예약 확인은 어떻게 하나요?",
    answer: "'내 여행' 탭에서 확정된 일정을 확인할 수 있어요. 예약 완료 시 알림도 전송돼요.",
  },
  {
    id: "3",
    category: "운항",
    question: "여객선 운항이 취소되면 어떻게 되나요?",
    answer: "기상 악화로 운항이 취소되면 앱 알림으로 즉시 안내드려요. 전액 환불 또는 일정 변경이 가능해요.",
  },
  {
    id: "4",
    category: "운항",
    question: "실시간 운항 정보는 어디서 확인하나요?",
    answer: "홈 화면의 날씨 위젯에서 실시간 운항 상태를 확인할 수 있어요. '교통 시간표' 페이지에서도 상세 정보를 볼 수 있어요.",
  },
  {
    id: "5",
    category: "결제",
    question: "결제 수단은 무엇이 있나요?",
    answer: "신용카드, 체크카드, 계좌이체, 간편결제(카카오페이, 네이버페이) 등을 지원해요.",
  },
  {
    id: "7",
    category: "기타",
    question: "그룹 여행은 어떻게 만드나요?",
    answer: "'그룹 여행' 페이지에서 새 그룹을 만들고 초대 코드를 공유하면 친구들이 참여할 수 있어요.",
  },
];

export function Support() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [showContactForm, setShowContactForm] = useState(false);
  const [inquiry, setInquiry] = useState({
    category: "일반 문의",
    title: "",
    content: "",
  });

  const [showChatPanel, setShowChatPanel] = useState(searchParams.get("chat") === "1");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const nextMessages: ChatMessage[] = [...chatMessages, { role: "user", text }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const reply = await askIslandChat(nextMessages);
      setChatMessages([...nextMessages, { role: "assistant", text: reply }]);
    } catch {
      toast.error("지금은 답변이 어려워요. 잠시 후 다시 시도해주세요");
    } finally {
      setChatLoading(false);
    }
  };

  const categories = ["전체", "예약", "운항", "결제", "기타"];

  const filteredFAQs = selectedCategory === "전체"
    ? FAQS
    : FAQS.filter(faq => faq.category === selectedCategory);

  const handleSubmitInquiry = () => {
    if (!inquiry.title || !inquiry.content) {
      toast.error("제목과 내용을 입력해주세요");
      return;
    }
    toast.success("문의가 접수됐어요. 24시간 내에 답변드릴게요");
    setShowContactForm(false);
    setInquiry({ category: "일반 문의", title: "", content: "" });
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <button
          onClick={() => {
            if (showContactForm) {
              setShowContactForm(false);
            } else if (showChatPanel) {
              setShowChatPanel(false);
            } else {
              navigate(-1);
            }
          }}
          className="flex items-center gap-2 mb-3 text-blue-100 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          <span className="text-sm">뒤로</span>
        </button>
        <h1 className="text-xl font-bold mb-1">고객센터</h1>
        <p className="text-sm text-blue-100">무엇을 도와드릴까요?</p>
      </div>

      {showChatPanel ? (
        /* AI Chat Panel */
        <div className="flex flex-col" style={{ height: "calc(100vh - 116px)" }}>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center text-sm text-gray-400 mt-8">
                <Bot className="w-8 h-8 mx-auto mb-2 text-blue-300" strokeWidth={1.5} />
                예약, 취소, 섬 여행 정보 등 무엇이든 물어보세요
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  답변 작성 중...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-gray-200 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendChat();
              }}
              placeholder="궁금한 점을 물어보세요"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="w-10 h-10 shrink-0 bg-blue-600 text-white rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            >
              <Send className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      ) : !showContactForm ? (
        <>
          {/* Contact Options */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="grid grid-cols-4 gap-2">
              <ContactOption
                icon={<Phone className="w-5 h-5" strokeWidth={2} />}
                label="전화 상담"
                value="1588-0000"
                onClick={() => {
                  toast.success("전화 연결 중...");
                }}
              />
              <ContactOption
                icon={<Mail className="w-5 h-5" strokeWidth={2} />}
                label="이메일"
                value="kimsungil322@gmail.com"
                onClick={() => {
                  navigator.clipboard?.writeText("kimsungil322@gmail.com");
                  toast.success("이메일이 복사됐어요");
                }}
              />
              <ContactOption
                icon={<MessageCircle className="w-5 h-5" strokeWidth={2} />}
                label="1:1 문의"
                value="문의하기"
                onClick={() => setShowContactForm(true)}
              />
              <ContactOption
                icon={<Bot className="w-5 h-5" strokeWidth={2} />}
                label="AI 챗봇"
                value="바로 물어보기"
                onClick={() => setShowChatPanel(true)}
              />
            </div>
          </div>

          {/* FAQ Section */}
          <div className="">
            {/* Category Filter */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ List */}
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">자주 묻는 질문</h3>
              <div className="space-y-2">
                {filteredFAQs.map(faq => (
                  <FAQItem
                    key={faq.id}
                    faq={faq}
                    isExpanded={expandedId === faq.id}
                    onToggle={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  />
                ))}
              </div>
            </div>

            {/* Business Hours */}
            <div className="px-6 py-6 bg-gray-50 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">상담 가능 시간</h3>
              <p className="text-sm text-gray-600 mb-1">평일: 09:00 - 18:00</p>
              <p className="text-sm text-gray-600 mb-1">주말 및 공휴일: 10:00 - 17:00</p>
              <p className="text-xs text-gray-500 mt-2">* 점심시간 12:00 - 13:00 제외</p>
            </div>
          </div>
        </>
      ) : (
        /* Contact Form */
        <div className="px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">1:1 문의하기</h3>
          <div className="space-y-4">
            {/* Category */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">문의 유형</label>
              <select
                value={inquiry.category}
                onChange={(e) => setInquiry({ ...inquiry, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>일반 문의</option>
                <option>예약 문의</option>
                <option>결제 문의</option>
                <option>환불 문의</option>
                <option>기타</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">제목</label>
              <input
                type="text"
                value={inquiry.title}
                onChange={(e) => setInquiry({ ...inquiry, title: e.target.value })}
                placeholder="제목을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Content */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">문의 내용</label>
              <textarea
                value={inquiry.content}
                onChange={(e) => setInquiry({ ...inquiry, content: e.target.value })}
                placeholder="궁금하신 내용을 자세히 적어주세요"
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmitInquiry}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Send className="w-5 h-5" strokeWidth={2} />
              문의 보내기
            </button>

            <p className="text-xs text-gray-500 text-center">
              접수된 문의는 영업일 기준 24시간 내에 답변드려요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactOption({
  icon,
  label,
  value,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform"
    >
      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
        {icon}
      </div>
      <div className="text-xs font-medium text-gray-900">{label}</div>
      <div className="text-xs text-gray-500">{value}</div>
    </button>
  );
}

function FAQItem({
  faq,
  isExpanded,
  onToggle
}: {
  faq: FAQ;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-start justify-between gap-3 text-left active:bg-gray-50 transition-colors"
      >
        <div className="flex-1">
          <div className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded mb-1">
            {faq.category}
          </div>
          <p className="font-medium text-gray-900">{faq.question}</p>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" strokeWidth={2} />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" strokeWidth={2} />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}
