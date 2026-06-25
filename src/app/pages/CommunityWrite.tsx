import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronLeft, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { communityService } from "../../lib/communityService";

const ISLANDS = ['강화도', '영흥도', '자월도', '덕적도', '백령도', '대청도', '연평도'];

export function CommunityWrite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const type = (searchParams.get('type') ?? 'feed') as 'feed' | 'qna';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [island, setIsland] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await communityService.uploadImage(imageFile);
      }
      await communityService.createPost({
        title: title || content.substring(0, 30),
        content,
        islandName: island || undefined,
        type,
        imageUrl,
      });
      toast.success('등록됐어요');
      navigate('/community', { replace: true });
    } catch {
      toast.error('등록에 실패했어요');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-4 py-4 bg-white border-b border-gray-200 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <h1 className="flex-1 text-lg font-bold text-gray-900">
          {type === 'feed' ? '리뷰 작성' : '질문하기'}
        </h1>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40 active:scale-95 transition-transform"
        >
          {isSubmitting ? '등록 중...' : '등록'}
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Island selector */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            섬 선택 <span className="text-gray-400 font-normal text-xs">(선택)</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {ISLANDS.map(i => (
              <button
                key={i}
                onClick={() => setIsland(island === i ? '' : i)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
                  island === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            제목 <span className="text-gray-400 font-normal text-xs">(선택)</span>
          </p>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={type === 'feed' ? '어떤 섬을 다녀오셨나요?' : '무엇이 궁금한가요?'}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            내용 <span className="text-red-500 text-xs">*</span>
          </p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={
              type === 'feed'
                ? '다녀온 섬에 대한 솔직한 리뷰를 남겨보세요'
                : '섬 여행에 대해 궁금한 점을 자유롭게 물어보세요'
            }
            rows={8}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Image */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            사진 <span className="text-gray-400 font-normal text-xs">(선택)</span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt=""
                className="w-full rounded-xl max-h-64 object-cover"
              />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 active:scale-95"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl w-full py-10 hover:border-blue-400 hover:text-blue-500 transition-colors active:scale-95"
            >
              <ImageIcon className="w-8 h-8" strokeWidth={1.5} />
              <span className="text-sm">사진을 추가하세요</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
