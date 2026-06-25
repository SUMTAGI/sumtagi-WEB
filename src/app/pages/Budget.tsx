import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Plus, DollarSign, TrendingUp, TrendingDown, Ship, Hotel, UtensilsCrossed, Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { budgetService } from "../../lib/budgetService";

type Category = "교통" | "숙박" | "식사" | "체험" | "기타";

interface Expense {
  id: string;
  category: Category;
  amount: number;
  description: string;
  created_at: string;
}

export function Budget() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalBudget, setTotalBudget] = useState(500000);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: "식사" as Category, amount: "", description: "" });

  useEffect(() => {
    budgetService.getExpenses().then(data => setExpenses(data as Expense[]));
  }, []);

  const addExpense = async () => {
    if (!newExpense.amount || !newExpense.description) { toast.error("모든 항목을 입력해주세요"); return; }
    await budgetService.addExpense(newExpense.category, parseInt(newExpense.amount), newExpense.description);
    const data = await budgetService.getExpenses();
    setExpenses(data as Expense[]);
    setNewExpense({ category: "식사", amount: "", description: "" });
    setShowAddExpense(false);
    toast.success("지출이 추가됐어요");
  };

  const deleteExpense = async (id: string) => {
    await budgetService.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success("지출이 삭제됐어요");
  };

  const updateBudget = (newB: number) => {
    setTotalBudget(newB);
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalBudget - totalExpense;
  const progress = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;

  const categoryExpenses = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const getCategoryIcon = (category: Expense["category"]) => {
    const icons = {
      교통: <Ship className="w-5 h-5" strokeWidth={2} />,
      숙박: <Hotel className="w-5 h-5" strokeWidth={2} />,
      식사: <UtensilsCrossed className="w-5 h-5" strokeWidth={2} />,
      체험: <Camera className="w-5 h-5" strokeWidth={2} />,
      기타: <DollarSign className="w-5 h-5" strokeWidth={2} />,
    };
    return icons[category];
  };

  const getCategoryColor = (category: Expense["category"]) => {
    const colors = {
      교통: "bg-blue-100 text-blue-700",
      숙박: "bg-purple-100 text-purple-700",
      식사: "bg-orange-100 text-orange-700",
      체험: "bg-green-100 text-green-700",
      기타: "bg-gray-100 text-gray-700",
    };
    return colors[category];
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">여행 경비 관리</h1>
          <p className="text-xs text-gray-500">지출을 기록하고 예산을 관리하세요</p>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="px-6 py-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <div className="mb-4">
          <div className="text-sm text-blue-100 mb-1">총 예산</div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={totalBudget}
              onChange={(e) => updateBudget(parseInt(e.target.value) || 0)}
              className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-2xl font-bold text-white w-full focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <span className="text-xl font-bold">원</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-blue-100 mb-1">총 지출</div>
            <div className="text-2xl font-bold">{totalExpense.toLocaleString()}원</div>
          </div>
          <div>
            <div className="text-sm text-blue-100 mb-1">남은 예산</div>
            <div className={`text-2xl font-bold flex items-center gap-1 ${
              remaining >= 0 ? "text-white" : "text-red-200"
            }`}>
              {remaining >= 0 ? (
                <TrendingUp className="w-5 h-5" strokeWidth={2} />
              ) : (
                <TrendingDown className="w-5 h-5" strokeWidth={2} />
              )}
              {Math.abs(remaining).toLocaleString()}원
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-blue-100">사용률</span>
            <span className="font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progress > 100 ? "bg-red-400" : "bg-white"
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryExpenses).length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">카테고리별 지출</h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(categoryExpenses) as [Expense["category"], number][]).map(([category, amount]) => (
              <div key={category} className={`p-3 rounded-lg ${getCategoryColor(category)}`}>
                <div className="flex items-center gap-2 mb-1">
                  {getCategoryIcon(category)}
                  <span className="text-sm font-medium">{category}</span>
                </div>
                <div className="text-lg font-bold">{amount.toLocaleString()}원</div>
                <div className="text-xs opacity-80">
                  {totalBudget > 0 ? Math.round((amount / totalBudget) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">지출 내역</h3>
          <button
            onClick={() => setShowAddExpense(!showAddExpense)}
            className="flex items-center gap-1 text-blue-600 font-medium text-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            추가
          </button>
        </div>

        {/* Add Expense Form */}
        {showAddExpense && (
          <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100">
            <h4 className="font-semibold text-gray-900 mb-3">지출 추가</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">카테고리</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as Expense["category"] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="교통">교통</option>
                  <option value="숙박">숙박</option>
                  <option value="식사">식사</option>
                  <option value="체험">체험</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">금액</label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">내용</label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="점심 식사"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addExpense}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowAddExpense(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expenses */}
        <div className="space-y-3">
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={2} />
              <p className="text-gray-500 mb-4">아직 지출 내역이 없어요</p>
              <button
                onClick={() => setShowAddExpense(true)}
                className="text-blue-600 font-semibold"
              >
                첫 지출 추가하기
              </button>
            </div>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(expense.category)}`}>
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <div className="font-semibold text-gray-900">{expense.description}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(expense.created_at).toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="p-1 text-gray-400 hover:text-red-600 active:scale-95 transition-all ml-2"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                      <div className="text-lg font-bold text-gray-900">
                        {expense.amount.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
