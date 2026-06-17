import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Plus, Users, DollarSign, Calendar, ThumbsUp, Share2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  isOwner: boolean;
}

interface GroupExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
}

interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: string[] }[];
  createdBy: string;
  isActive: boolean;
}

interface GroupTrip {
  id: string;
  name: string;
  destination: string[];
  startDate: string;
  endDate: string;
  members: GroupMember[];
  expenses: GroupExpense[];
  polls: Poll[];
  inviteCode: string;
}

export function GroupTrip() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupTrip[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    destination: "",
    startDate: "",
    endDate: "",
  });

  const saveGroups = (updatedGroups: GroupTrip[]) => {
    setGroups(updatedGroups);
  };

  const createGroup = () => {
    if (!newGroup.name || !newGroup.destination || !newGroup.startDate || !newGroup.endDate) {
      toast.error("모든 항목을 입력해주세요");
      return;
    }

    const group: GroupTrip = {
      id: `group-${Date.now()}`,
      name: newGroup.name,
      destination: newGroup.destination.split(",").map(s => s.trim()),
      startDate: newGroup.startDate,
      endDate: newGroup.endDate,
      members: [
        {
          id: "me",
          name: "나",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=me",
          isOwner: true,
        }
      ],
      expenses: [],
      polls: [],
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    };

    const updatedGroups = [group, ...groups];
    saveGroups(updatedGroups);
    setActiveGroupId(group.id);
    setShowCreateGroup(false);
    setNewGroup({ name: "", destination: "", startDate: "", endDate: "" });
    toast.success("그룹이 생성됐어요!");
  };

  const shareInvite = (code: string) => {
    navigator.clipboard?.writeText(code);
    toast.success("초대 코드가 복사됐어요");
  };

  const activeGroup = groups.find(g => g.id === activeGroupId);

  if (showCreateGroup) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setShowCreateGroup(false)}
            className="active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">그룹 만들기</h1>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">그룹 이름</label>
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="예: 여름 백령도 여행"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">목적지</label>
              <input
                type="text"
                value={newGroup.destination}
                onChange={(e) => setNewGroup({ ...newGroup, destination: e.target.value })}
                placeholder="예: 백령도, 대청도"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">출발일</label>
              <input
                type="date"
                value={newGroup.startDate}
                onChange={(e) => setNewGroup({ ...newGroup, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">귀가일</label>
              <input
                type="date"
                value={newGroup.endDate}
                onChange={(e) => setNewGroup({ ...newGroup, endDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Create Button */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
          <button
            onClick={createGroup}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition-transform"
          >
            그룹 만들기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-3 text-blue-100 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          <span className="text-sm">뒤로</span>
        </button>
        <h1 className="text-xl font-bold mb-1">그룹 여행</h1>
        <p className="text-sm text-blue-100">친구들과 함께 계획하세요</p>
      </div>

      {groups.length === 0 ? (
        /* Empty State */
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
            <p className="text-gray-500 mb-4">아직 참여한 그룹이 없어요</p>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" strokeWidth={2} />
              새 그룹 만들기
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Group Selector */}
          <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setActiveGroupId(group.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    activeGroupId === group.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {group.name}
                </button>
              ))}
              <button
                onClick={() => setShowCreateGroup(true)}
                className="px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 font-medium text-sm whitespace-nowrap active:scale-95 transition-transform"
              >
                + 새 그룹
              </button>
            </div>
          </div>

          {/* Group Content */}
          {activeGroup && (
            <div className="flex-1 overflow-y-auto">
              {/* Group Info */}
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-bold text-gray-900 mb-1">{activeGroup.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" strokeWidth={2} />
                      <span>
                        {new Date(activeGroup.startDate).toLocaleDateString('ko-KR')} - {new Date(activeGroup.endDate).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => shareInvite(activeGroup.inviteCode)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
                  >
                    <Share2 className="w-4 h-4" strokeWidth={2} />
                    초대
                  </button>
                </div>

                {/* Members */}
                <div>
                  <div className="text-xs text-gray-500 mb-2">참여자 ({activeGroup.members.length})</div>
                  <div className="flex gap-2">
                    {activeGroup.members.map(member => (
                      <div key={member.id} className="flex flex-col items-center">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-full border-2 border-white shadow"
                        />
                        <span className="text-xs text-gray-700 mt-1">{member.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expense Splitting */}
              <ExpenseSection group={activeGroup} onUpdate={(updated) => {
                saveGroups(groups.map(g => g.id === updated.id ? updated : g));
              }} />

              {/* Polls */}
              <PollSection group={activeGroup} onUpdate={(updated) => {
                saveGroups(groups.map(g => g.id === updated.id ? updated : g));
              }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ExpenseSection({ group, onUpdate }: { group: GroupTrip; onUpdate: (group: GroupTrip) => void }) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
  });

  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      toast.error("모든 항목을 입력해주세요");
      return;
    }

    const expense: GroupExpense = {
      id: `expense-${Date.now()}`,
      description: newExpense.description,
      amount: parseInt(newExpense.amount),
      paidBy: "me",
      date: new Date().toISOString(),
    };

    onUpdate({
      ...group,
      expenses: [...group.expenses, expense],
    });

    setNewExpense({ description: "", amount: "" });
    setShowAddExpense(false);
    toast.success("지출이 추가됐어요");
  };

  const totalExpense = group.expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = Math.ceil(totalExpense / group.members.length);

  return (
    <div className="px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">비용 분담</h3>
        <button
          onClick={() => setShowAddExpense(!showAddExpense)}
          className="text-sm text-blue-600 font-medium"
        >
          {showAddExpense ? "취소" : "+ 추가"}
        </button>
      </div>

      {showAddExpense && (
        <div className="bg-gray-50 rounded-xl p-3 mb-3">
          <div className="space-y-2">
            <input
              type="text"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              placeholder="지출 내용"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              placeholder="금액"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={addExpense}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium text-sm"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 mb-1">총 지출</div>
          <div className="text-lg font-bold text-blue-900">{totalExpense.toLocaleString()}원</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-xs text-green-600 mb-1">1인당</div>
          <div className="text-lg font-bold text-green-900">{perPerson.toLocaleString()}원</div>
        </div>
      </div>

      {/* Expense List */}
      {group.expenses.length > 0 && (
        <div className="space-y-2">
          {group.expenses.map(expense => (
            <div key={expense.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{expense.description}</span>
              <span className="font-semibold text-gray-900">{expense.amount.toLocaleString()}원</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PollSection({ group, onUpdate }: { group: GroupTrip; onUpdate: (group: GroupTrip) => void }) {
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: "",
    option1: "",
    option2: "",
  });

  const createPoll = () => {
    if (!newPoll.question || !newPoll.option1 || !newPoll.option2) {
      toast.error("모든 항목을 입력해주세요");
      return;
    }

    const poll: Poll = {
      id: `poll-${Date.now()}`,
      question: newPoll.question,
      options: [
        { id: "opt1", text: newPoll.option1, votes: [] },
        { id: "opt2", text: newPoll.option2, votes: [] },
      ],
      createdBy: "me",
      isActive: true,
    };

    onUpdate({
      ...group,
      polls: [...group.polls, poll],
    });

    setNewPoll({ question: "", option1: "", option2: "" });
    setShowCreatePoll(false);
    toast.success("투표가 생성됐어요");
  };

  const vote = (pollId: string, optionId: string) => {
    const updatedPolls = group.polls.map(poll => {
      if (poll.id !== pollId) return poll;

      const alreadyVoted = poll.options.some(opt => opt.votes.includes("me"));
      if (alreadyVoted) {
        toast.error("이미 투표했어요");
        return poll;
      }

      return {
        ...poll,
        options: poll.options.map(opt =>
          opt.id === optionId
            ? { ...opt, votes: [...opt.votes, "me"] }
            : opt
        ),
      };
    });

    onUpdate({ ...group, polls: updatedPolls });
    toast.success("투표했어요");
  };

  return (
    <div className="px-6 py-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">투표</h3>
        <button
          onClick={() => setShowCreatePoll(!showCreatePoll)}
          className="text-sm text-blue-600 font-medium"
        >
          {showCreatePoll ? "취소" : "+ 만들기"}
        </button>
      </div>

      {showCreatePoll && (
        <div className="bg-white rounded-xl p-3 mb-3 border border-gray-200">
          <div className="space-y-2">
            <input
              type="text"
              value={newPoll.question}
              onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
              placeholder="질문을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="text"
              value={newPoll.option1}
              onChange={(e) => setNewPoll({ ...newPoll, option1: e.target.value })}
              placeholder="선택지 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="text"
              value={newPoll.option2}
              onChange={(e) => setNewPoll({ ...newPoll, option2: e.target.value })}
              placeholder="선택지 2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={createPoll}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium text-sm"
            >
              만들기
            </button>
          </div>
        </div>
      )}

      {/* Poll List */}
      <div className="space-y-3">
        {group.polls.map(poll => (
          <div key={poll.id} className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="font-semibold text-gray-900 mb-3">{poll.question}</div>
            <div className="space-y-2">
              {poll.options.map(option => {
                const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
                const percentage = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
                const hasVoted = option.votes.includes("me");

                return (
                  <button
                    key={option.id}
                    onClick={() => vote(poll.id, option.id)}
                    className={`w-full relative overflow-hidden rounded-lg border-2 transition-all ${
                      hasVoted
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-blue-100 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative px-3 py-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{option.text}</span>
                      <div className="flex items-center gap-2">
                        {hasVoted && <Check className="w-4 h-4 text-blue-600" strokeWidth={2} />}
                        <span className="text-xs font-semibold text-gray-600">{Math.round(percentage)}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
