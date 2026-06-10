import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Plus, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  category: string;
}

const DEFAULT_ITEMS: Omit<ChecklistItem, "id" | "completed">[] = [
  { text: "선크림", category: "필수품" },
  { text: "멀미약", category: "필수품" },
  { text: "모자", category: "필수품" },
  { text: "선글라스", category: "필수품" },
  { text: "우산 또는 우비", category: "필수품" },
  { text: "간편한 신발", category: "필수품" },
  { text: "수건", category: "필수품" },
  { text: "세면도구", category: "필수품" },
  { text: "상비약", category: "필수품" },
  { text: "보조배터리", category: "전자기기" },
  { text: "충전기", category: "전자기기" },
  { text: "카메라", category: "전자기기" },
  { text: "수영복", category: "선택사항" },
  { text: "스노클링 장비", category: "선택사항" },
  { text: "간식", category: "선택사항" },
  { text: "여객선 예매 확인", category: "예약 확인" },
  { text: "숙소 예약 확인", category: "예약 확인" },
  { text: "체험 예약 확인", category: "예약 확인" },
];

export function Checklist() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("필수품");

  useEffect(() => {
    const saved = localStorage.getItem("checklist");
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      const defaultItems = DEFAULT_ITEMS.map((item, index) => ({
        ...item,
        id: `default-${index}`,
        completed: false,
      }));
      setItems(defaultItems);
      localStorage.setItem("checklist", JSON.stringify(defaultItems));
    }
  }, []);

  const saveItems = (updatedItems: ChecklistItem[]) => {
    setItems(updatedItems);
    localStorage.setItem("checklist", JSON.stringify(updatedItems));
  };

  const toggleItem = (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveItems(updatedItems);
  };

  const deleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    saveItems(updatedItems);
    toast.success("항목이 삭제됐어요");
  };

  const addItem = () => {
    if (!newItemText.trim()) {
      toast.error("항목을 입력해주세요");
      return;
    }

    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      text: newItemText,
      completed: false,
      category: selectedCategory,
    };

    saveItems([...items, newItem]);
    setNewItemText("");
    toast.success("항목이 추가됐어요");
  };

  const resetChecklist = () => {
    const defaultItems = DEFAULT_ITEMS.map((item, index) => ({
      ...item,
      id: `default-${index}`,
      completed: false,
    }));
    saveItems(defaultItems);
    toast.success("체크리스트가 초기화됐어요");
  };

  const categories = Array.from(new Set(items.map(item => item.category)));
  const completedCount = items.filter(item => item.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">여행 체크리스트</h1>
          <p className="text-xs text-gray-500">
            {completedCount}/{items.length} 완료
          </p>
        </div>
        <button
          onClick={resetChecklist}
          className="text-sm text-blue-600 font-medium"
        >
          초기화
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 flex-shrink-0">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">준비 진행률</span>
          <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-white rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Add New Item */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="필수품">필수품</option>
            <option value="전자기기">전자기기</option>
            <option value="선택사항">선택사항</option>
            <option value="예약 확인">예약 확인</option>
            <option value="기타">기타</option>
          </select>
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            placeholder="항목 추가"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addItem}
            className="p-2 bg-blue-600 text-white rounded-lg active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {categories.map((category) => {
          const categoryItems = items.filter(item => item.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category} className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                {category}
                <span className="text-xs text-gray-500">
                  ({categoryItems.filter(i => i.completed).length}/{categoryItems.length})
                </span>
              </h3>
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all active-press ${
                        item.completed
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {item.completed && <Check className="w-4 h-4 text-white animate-checkmark" strokeWidth={3} />}
                    </button>
                    <span
                      className={`flex-1 transition-all ${
                        item.completed
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {item.text}
                    </span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 active:scale-95 transition-all"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">체크리스트가 비어있어요</p>
            <button
              onClick={resetChecklist}
              className="text-blue-600 font-semibold"
            >
              기본 항목 추가하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
