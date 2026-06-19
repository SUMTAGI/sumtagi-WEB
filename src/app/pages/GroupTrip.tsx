import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Plus, Users, Calendar, Share2, Check, LogIn, Loader2, Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { groupTripService } from "../../lib/groupTripService";
import type { GroupTripData, GroupExpense, GroupPoll } from "../../lib/groupTripService";
import { useAuth } from "../../lib/useAuth";

export type { GroupTripData };

export function GroupTrip() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id ?? "";

  const [groups, setGroups] = useState<GroupTripData[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", destination: "", startDate: "", endDate: "" });

  const loadGroups = useCallback(async () => {
    const data = await groupTripService.getMyGroups();
    setGroups(data);
    if (data.length > 0 && !activeGroupId) setActiveGroupId(data[0].id);
    setLoading(false);
  }, [activeGroupId]);

  useEffect(() => { loadGroups(); }, []);

  const refreshGroup = useCallback(async (groupId: string) => {
    const updated = await groupTripService.getGroupById(groupId);
    if (updated) setGroups(prev => prev.map(g => g.id === groupId ? updated : g));
  }, []);

  const createGroup = async () => {
    if (!newGroup.name || !newGroup.destination || !newGroup.startDate || !newGroup.endDate) {
      toast.error("모든 항목을 입력해주세요");
      return;
    }
    setCreating(true);
    const group = await groupTripService.createGroup(
      newGroup.name,
      newGroup.destination.split(",").map(s => s.trim()),
      newGroup.startDate,
      newGroup.endDate,
    );
    setCreating(false);
    if (!group) { toast.error("그룹 생성에 실패했어요"); return; }
    setGroups(prev => [group, ...prev]);
    setActiveGroupId(group.id);
    setShowCreateGroup(false);
    setNewGroup({ name: "", destination: "", startDate: "", endDate: "" });
    toast.success("그룹이 생성됐어요!");
  };

  const shareInvite = (code: string) => {
    const url = `${window.location.origin}/group-join/${code}`;
    navigator.clipboard?.writeText(url);
    toast.success("초대 링크가 복사됐어요");
  };

  const joinByCode = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) { toast.error("코드를 입력해주세요"); return; }
    setJoining(true);
    const group = await groupTripService.getGroupByInviteCode(code);
    if (!group) {
      setJoining(false);
      toast.error("유효하지 않은 초대 코드예요");
      return;
    }
    if (groups.some(g => g.id === group.id)) {
      setJoining(false);
      setActiveGroupId(group.id);
      setShowJoinModal(false);
      setJoinCodeInput("");
      toast.info("이미 참여한 그룹이에요");
      return;
    }
    const ok = await groupTripService.joinGroup(group.id);
    setJoining(false);
    if (!ok) { toast.error("참여에 실패했어요"); return; }
    const joined = await groupTripService.getGroupById(group.id);
    if (joined) {
      setGroups(prev => [joined, ...prev]);
      setActiveGroupId(joined.id);
    }
    setShowJoinModal(false);
    setJoinCodeInput("");
    toast.success(`${group.name} 그룹에 참여했어요!`);
  };

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const isOwner = activeGroup?.members.find(m => m.id === currentUserId)?.isOwner ?? false;

  const handleDeleteGroup = async () => {
    if (!activeGroup) return;
    if (!window.confirm(`"${activeGroup.name}" 그룹을 삭제할까요? 모든 데이터가 사라져요.`)) return;
    const ok = await groupTripService.deleteGroup(activeGroup.id);
    if (!ok) { toast.error("삭제에 실패했어요"); return; }
    const remaining = groups.filter(g => g.id !== activeGroup.id);
    setGroups(remaining);
    setActiveGroupId(remaining.length > 0 ? remaining[0].id : null);
    toast.success("그룹이 삭제됐어요");
  };

  const handleLeaveGroup = async () => {
    if (!activeGroup) return;
    if (!window.confirm(`"${activeGroup.name}" 그룹에서 나갈까요?`)) return;
    const ok = await groupTripService.leaveGroup(activeGroup.id);
    if (!ok) { toast.error("나가기에 실패했어요"); return; }
    const remaining = groups.filter(g => g.id !== activeGroup.id);
    setGroups(remaining);
    setActiveGroupId(remaining.length > 0 ? remaining[0].id : null);
    toast.success("그룹에서 나왔어요");
  };

  if (showCreateGroup) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setShowCreateGroup(false)} className="active:scale-95 transition-transform">
            <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">그룹 만들기</h1>
        </div>
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
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
          <button
            onClick={createGroup}
            disabled={creating}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {creating && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
            그룹 만들기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white relative">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-3 text-blue-100 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          <span className="text-sm">뒤로</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold mb-1">그룹 여행</h1>
            <p className="text-sm text-blue-100">친구들과 함께 계획하세요</p>
          </div>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium active:scale-95 transition-transform"
          >
            <LogIn className="w-4 h-4" strokeWidth={2} />
            코드 참여
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" strokeWidth={2} />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center w-full max-w-xs">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
            <p className="text-gray-500 mb-6">아직 참여한 그룹이 없어요</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium active:scale-95 transition-transform"
              >
                <Plus className="w-5 h-5" strokeWidth={2} />
                새 그룹 만들기
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-medium active:scale-95 transition-transform"
              >
                <LogIn className="w-5 h-5" strokeWidth={2} />
                초대 코드로 참여
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setActiveGroupId(group.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    activeGroupId === group.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
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

          {activeGroup && (
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-bold text-gray-900 mb-1">{activeGroup.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" strokeWidth={2} />
                      <span>
                        {new Date(activeGroup.startDate).toLocaleDateString("ko-KR")} -{" "}
                        {new Date(activeGroup.endDate).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => shareInvite(activeGroup.inviteCode)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
                  >
                    <Share2 className="w-4 h-4" strokeWidth={2} />
                    초대 링크
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-500">초대 코드</span>
                  <span
                    className="px-2 py-0.5 bg-white border border-blue-200 rounded text-sm font-mono font-bold text-blue-600 tracking-widest cursor-pointer"
                    onClick={() => { navigator.clipboard?.writeText(activeGroup.inviteCode); toast.success("코드가 복사됐어요"); }}
                  >
                    {activeGroup.inviteCode}
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-2">참여자 ({activeGroup.members.length}명)</div>
                    <div className="flex gap-2 flex-wrap">
                      {activeGroup.members.map(member => (
                        <div key={member.id} className="flex flex-col items-center">
                          <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full border-2 border-white shadow" />
                          <span className="text-xs text-gray-700 mt-1">{member.name}</span>
                          {member.isOwner && <span className="text-xs text-blue-500">방장</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {isOwner ? (
                    <button
                      onClick={handleDeleteGroup}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium active:scale-95 transition-transform"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                      그룹 삭제
                    </button>
                  ) : (
                    <button
                      onClick={handleLeaveGroup}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium active:scale-95 transition-transform"
                    >
                      <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
                      나가기
                    </button>
                  )}
                </div>
              </div>

              <ExpenseSection
                group={activeGroup}
                currentUserId={currentUserId}
                onRefresh={() => refreshGroup(activeGroup.id)}
              />
              <PollSection
                group={activeGroup}
                currentUserId={currentUserId}
                onRefresh={() => refreshGroup(activeGroup.id)}
              />
            </div>
          )}
        </>
      )}

      {showJoinModal && (
        <div
          className="absolute inset-0 bg-black/50 flex items-end z-50"
          onClick={() => setShowJoinModal(false)}
        >
          <div className="bg-white rounded-t-2xl p-6 w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">초대 코드로 참여</h3>
            <p className="text-sm text-gray-500 mb-4">친구에게 받은 6자리 코드를 입력하세요</p>
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinByCode()}
              placeholder="XXXXXX"
              maxLength={6}
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowJoinModal(false); setJoinCodeInput(""); }}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 active:scale-95 transition-transform"
              >
                취소
              </button>
              <button
                onClick={joinByCode}
                disabled={joining}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {joining && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                참여하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpenseSection({
  group,
  currentUserId,
  onRefresh,
}: {
  group: GroupTripData;
  currentUserId: string;
  onRefresh: () => Promise<void>;
}) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "" });
  const [saving, setSaving] = useState(false);

  const addExpense = async () => {
    if (!newExpense.description || !newExpense.amount) { toast.error("모든 항목을 입력해주세요"); return; }
    setSaving(true);
    const ok = await groupTripService.addExpense(group.id, newExpense.description, parseInt(newExpense.amount));
    setSaving(false);
    if (!ok) { toast.error("저장에 실패했어요"); return; }
    setNewExpense({ description: "", amount: "" });
    setShowAddExpense(false);
    toast.success("지출이 추가됐어요");
    await onRefresh();
  };

  const totalExpense = group.expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = group.members.length > 0 ? Math.ceil(totalExpense / group.members.length) : 0;

  const getPaidByName = (paidBy: string) => {
    if (paidBy === currentUserId) return "나";
    return group.members.find(m => m.id === paidBy)?.name ?? "멤버";
  };

  return (
    <div className="px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">비용 분담</h3>
        <button onClick={() => setShowAddExpense(!showAddExpense)} className="text-sm text-blue-600 font-medium">
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
              disabled={saving}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />}
              추가
            </button>
          </div>
        </div>
      )}

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

      {group.expenses.length > 0 && (
        <div className="space-y-2">
          {group.expenses.map((expense: GroupExpense) => (
            <div key={expense.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="text-gray-700">{expense.description}</span>
                <span className="text-xs text-gray-400 ml-2">{getPaidByName(expense.paidBy)} 결제</span>
              </div>
              <span className="font-semibold text-gray-900">{expense.amount.toLocaleString()}원</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PollSection({
  group,
  currentUserId,
  onRefresh,
}: {
  group: GroupTripData;
  currentUserId: string;
  onRefresh: () => Promise<void>;
}) {
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: "", option1: "", option2: "" });
  const [saving, setSaving] = useState(false);

  const createPoll = async () => {
    if (!newPoll.question || !newPoll.option1 || !newPoll.option2) { toast.error("모든 항목을 입력해주세요"); return; }
    setSaving(true);
    const ok = await groupTripService.addPoll(group.id, newPoll.question, [
      { id: "opt1", text: newPoll.option1, votes: [] },
      { id: "opt2", text: newPoll.option2, votes: [] },
    ]);
    setSaving(false);
    if (!ok) { toast.error("저장에 실패했어요"); return; }
    setNewPoll({ question: "", option1: "", option2: "" });
    setShowCreatePoll(false);
    toast.success("투표가 생성됐어요");
    await onRefresh();
  };

  const vote = async (poll: GroupPoll, optionId: string) => {
    const result = await groupTripService.vote(poll.id, optionId, poll.options);
    if (result === "already_voted") { toast.error("이미 투표했어요"); return; }
    if (result === "error") { toast.error("투표에 실패했어요"); return; }
    toast.success("투표했어요");
    await onRefresh();
  };

  return (
    <div className="px-6 py-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">투표</h3>
        <button onClick={() => setShowCreatePoll(!showCreatePoll)} className="text-sm text-blue-600 font-medium">
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
              disabled={saving}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />}
              만들기
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {group.polls.map((poll: GroupPoll) => (
          <div key={poll.id} className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="font-semibold text-gray-900 mb-3">{poll.question}</div>
            <div className="space-y-2">
              {poll.options.map(option => {
                const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
                const percentage = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
                const hasVoted = option.votes.includes(currentUserId);
                return (
                  <button
                    key={option.id}
                    onClick={() => vote(poll, option.id)}
                    className={`w-full relative overflow-hidden rounded-lg border-2 transition-all ${
                      hasVoted ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="absolute inset-0 bg-blue-100 transition-all" style={{ width: `${percentage}%` }} />
                    <div className="relative px-3 py-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{option.text}</span>
                      <div className="flex items-center gap-2">
                        {hasVoted && <Check className="w-4 h-4 text-blue-600" strokeWidth={2} />}
                        <span className="text-xs font-semibold text-gray-600">{Math.round(percentage)}%</span>
                        <span className="text-xs text-gray-400">{option.votes.length}표</span>
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
