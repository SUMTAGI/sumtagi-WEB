import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, CreditCard, Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  type: "card" | "bank";
  name: string;
  number: string;
  isDefault: boolean;
}

export function PaymentMethods() {
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "card",
      name: "신한카드",
      number: "**** **** **** 1234",
      isDefault: true,
    },
    {
      id: "2",
      type: "card",
      name: "국민카드",
      number: "**** **** **** 5678",
      isDefault: false,
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newMethod, setNewMethod] = useState({
    type: "card" as "card" | "bank",
    name: "",
    number: "",
  });

  const handleSetDefault = (id: string) => {
    setMethods(prev =>
      prev.map(method => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
    toast.success("기본 결제수단이 변경됐어요");
  };

  const handleDelete = (id: string) => {
    const method = methods.find(m => m.id === id);
    if (method?.isDefault) {
      toast.error("기본 결제수단은 삭제할 수 없어요");
      return;
    }
    setMethods(prev => prev.filter(m => m.id !== id));
    toast.success("결제수단이 삭제됐어요");
  };

  const handleAdd = () => {
    if (!newMethod.name || !newMethod.number) {
      toast.error("모든 정보를 입력해주세요");
      return;
    }

    const method: PaymentMethod = {
      id: Date.now().toString(),
      type: newMethod.type,
      name: newMethod.name,
      number: newMethod.number,
      isDefault: methods.length === 0,
    };

    setMethods(prev => [...prev, method]);
    setNewMethod({ type: "card", name: "", number: "" });
    setShowAddForm(false);
    toast.success("결제수단이 추가됐어요");
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/my")}
            className="active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">결제 수단</h1>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1 text-blue-600 text-sm font-medium"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          추가
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {methods.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              등록된 결제수단이 없어요
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              결제수단을 등록하면 더 빠르게 예약할 수 있어요
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium active:scale-95 transition-transform"
            >
              결제수단 추가
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                onSetDefault={handleSetDefault}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <h4 className="font-semibold text-blue-900 mb-2 text-sm">🔒 안전한 결제</h4>
          <ul className="space-y-1 text-xs text-blue-800">
            <li>• 모든 결제 정보는 암호화되어 안전하게 보관돼요</li>
            <li>• 카드 정보는 PG사를 통해 안전하게 처리돼요</li>
            <li>• 결제 시 별도의 인증 절차가 진행돼요</li>
          </ul>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="absolute inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">결제수단 추가</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 text-2xl"
              >
                ×
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">종류</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setNewMethod({ ...newMethod, type: "card" })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    newMethod.type === "card"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  신용/체크카드
                </button>
                <button
                  onClick={() => setNewMethod({ ...newMethod, type: "bank" })}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    newMethod.type === "bank"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  계좌이체
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                {newMethod.type === "card" ? "카드사" : "은행"}
              </label>
              <input
                type="text"
                value={newMethod.name}
                onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                placeholder={newMethod.type === "card" ? "예: 신한카드" : "예: 신한은행"}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                {newMethod.type === "card" ? "카드번호" : "계좌번호"}
              </label>
              <input
                type="text"
                value={newMethod.number}
                onChange={(e) => setNewMethod({ ...newMethod, number: e.target.value })}
                placeholder={newMethod.type === "card" ? "**** **** **** ****" : "계좌번호 입력"}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleAdd}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              추가하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentMethodCard({
  method,
  onSetDefault,
  onDelete
}: {
  method: PaymentMethod;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`bg-white rounded-xl p-4 border-2 transition-all ${
      method.isDefault ? "border-blue-600" : "border-gray-200"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          method.type === "card" ? "bg-blue-100" : "bg-green-100"
        }`}>
          <CreditCard className={`w-6 h-6 ${
            method.type === "card" ? "text-blue-600" : "text-green-600"
          }`} strokeWidth={2} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{method.name}</h3>
            {method.isDefault && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" strokeWidth={2} />
                기본
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{method.number}</p>

          <div className="flex gap-2 mt-3">
            {!method.isDefault && (
              <button
                onClick={() => onSetDefault(method.id)}
                className="text-sm text-blue-600 font-medium"
              >
                기본으로 설정
              </button>
            )}
            <button
              onClick={() => onDelete(method.id)}
              className="text-sm text-red-700 font-medium flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" strokeWidth={2} />
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
