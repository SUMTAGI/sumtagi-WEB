import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Plus, Calendar, MapPin, Image, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { diaryService } from "../../lib/diaryService";

interface DiaryEntry {
  id: string;
  date: string;
  island: string;
  title: string;
  content: string;
  created_at: string;
}

export function Diary() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    island: "",
    title: "",
    content: "",
  });

  const load = async () => {
    const data = await diaryService.getEntries();
    setEntries(data as DiaryEntry[]);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!newEntry.title || !newEntry.content || !newEntry.island) {
      toast.error("모든 항목을 입력해주세요");
      return;
    }
    if (editingId) {
      await diaryService.updateEntry(editingId, newEntry.date, newEntry.island, newEntry.title, newEntry.content);
      toast.success("다이어리가 수정됐어요");
    } else {
      await diaryService.addEntry(newEntry.date, newEntry.island, newEntry.title, newEntry.content);
      toast.success("다이어리가 저장됐어요");
    }
    await load();
    setNewEntry({ date: new Date().toISOString().split('T')[0], island: "", title: "", content: "" });
    setIsWriting(false);
    setEditingId(null);
  };

  const handleEdit = (entry: DiaryEntry) => {
    setNewEntry({ date: entry.date, island: entry.island, title: entry.title, content: entry.content });
    setEditingId(entry.id);
    setIsWriting(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("정말 삭제하시겠어요?")) {
      await diaryService.deleteEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success("다이어리가 삭제됐어요");
    }
  };

  const groupedEntries = entries.reduce((acc, entry) => {
    const month = new Date(entry.date + 'T00:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(entry);
    return acc;
  }, {} as Record<string, DiaryEntry[]>);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-shrink-0">
        <button
          onClick={() => {
            if (isWriting) {
              setIsWriting(false);
              setEditingId(null);
            } else {
              navigate(-1);
            }
          }}
          className="flex items-center gap-2 mb-3 text-blue-100 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
          <span className="text-sm">뒤로</span>
        </button>
        <h1 className="text-xl font-bold mb-1">여행 다이어리</h1>
        <p className="text-sm text-blue-100">소중한 추억을 기록하세요</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!isWriting ? (
          <>
            {/* Empty State */}
            {entries.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
                <p className="text-gray-500 mb-4">아직 작성한 다이어리가 없어요</p>
                <button
                  onClick={() => setIsWriting(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium active:scale-95 transition-transform"
                >
                  <Plus className="w-5 h-5" strokeWidth={2} />
                  첫 다이어리 작성하기
                </button>
              </div>
            ) : (
              <>
                {/* Timeline */}
                <div className="px-6 py-4">
                  {Object.entries(groupedEntries).map(([month, monthEntries]) => (
                    <div key={month} className="mb-6">
                      <div className="text-sm font-semibold text-gray-500 mb-3">{month}</div>
                      <div className="space-y-3">
                        {monthEntries.map(entry => (
                          <DiaryCard
                            key={entry.id}
                            entry={entry}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Write Button */}
                <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
                  <button
                    onClick={() => setIsWriting(true)}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Plus className="w-5 h-5" strokeWidth={2} />
                    새 다이어리 작성
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          /* Writing Form */
          <div className="px-6 py-4">
            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">날짜</label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Island */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">섬</label>
                <input
                  type="text"
                  value={newEntry.island}
                  onChange={(e) => setNewEntry({ ...newEntry, island: e.target.value })}
                  placeholder="예: 백령도"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">제목</label>
                <input
                  type="text"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  placeholder="제목을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">내용</label>
                <textarea
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  placeholder="오늘의 추억을 기록하세요..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition-transform"
                >
                  {editingId ? "수정 완료" : "저장하기"}
                </button>
                <button
                  onClick={() => {
                    setIsWriting(false);
                    setEditingId(null);
                    setNewEntry({ date: new Date().toISOString().split('T')[0], island: "", title: "", content: "" });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DiaryCard({
  entry,
  onEdit,
  onDelete
}: {
  entry: DiaryEntry;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">{entry.title}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" strokeWidth={2} />
                <span>{new Date(entry.date).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" strokeWidth={2} />
                <span>{entry.island}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(entry)}
              className="p-1.5 text-gray-400 hover:text-blue-600 active:scale-95 transition-all"
            >
              <Edit2 className="w-4 h-4" strokeWidth={2} />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Content */}
        <p className={`text-sm text-gray-700 whitespace-pre-wrap ${!isExpanded && "line-clamp-3"}`}>
          {entry.content}
        </p>

        {/* Expand Button */}
        {entry.content.length > 100 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 font-medium mt-2"
          >
            {isExpanded ? "접기" : "더보기"}
          </button>
        )}
      </div>
    </div>
  );
}
