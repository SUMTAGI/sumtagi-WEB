import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ChevronLeft, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { communityService } from "../../lib/communityService";

const ISLANDS = ['강화도', '영흥도', '자월도', '덕적도', '백령도', '대청도', '연평도'];
const MAX_IMAGES = 5;

export function CommunityWrite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const type = (searchParams.get('type') ?? 'feed') as 'feed' | 'qna';
  const editId = searchParams.get('editId');
  const isEdit = !!editId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [island, setIsland] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(isEdit);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const post = await communityService.getPost(editId);
        if (post) {
          setTitle(post.title ?? '');
          setContent(post.content ?? '');
          setIsland(post.island_name ?? '');
          if (Array.isArray(post.images) && post.images.length > 0) {
            setExistingImages(post.images);
          } else if (post.image_url) {
            setExistingImages([post.image_url]);
          }
        } else {
          toast.error('글을 찾을 수 없어요');
          navigate('/community', { replace: true });
        }
      } catch {
        toast.error('글을 불러오지 못했어요');
        navigate('/community', { replace: true });
      } finally {
        setIsLoadingPost(false);
      }
    })();
  }, [editId, navigate]);

  const imageCount = existingImages.length + newFiles.length;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const remaining = MAX_IMAGES - imageCount;
    const picked = files.slice(0, remaining);
    setNewFiles(prev => [...prev, ...picked]);
    setNewPreviews(prev => [...prev, ...picked.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeExisting = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNew = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const uploaded = newFiles.length > 0 ? await communityService.uploadImages(newFiles) : [];
      const images = [...existingImages, ...uploaded];
      const finalTitle = title || content.substring(0, 30);
      if (isEdit) {
        await communityService.updatePost({
          id: editId!,
          title: finalTitle,
          content,
          islandName: island || undefined,
          images,
        });
        toast.success('수정됐어요');
      } else {
        await communityService.createPost({
          title: finalTitle,
          content,
          islandName: island || undefined,
          type,
          images,
        });
        toast.success('등록됐어요');
      }
      navigate('/community', { replace: true });
    } catch {
      toast.error(isEdit ? '수정에 실패했어요' : '등록에 실패했어요');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPost) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="px-4 py-4 bg-white border-b border-gray-200 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="active:scale-95 transition-transform">
          <ChevronLeft className="w-6 h-6 text-gray-700" strokeWidth={2} />
        </button>
        <h1 className="flex-1 text-lg font-bold text-gray-900">
          {isEdit ? (type === 'feed' ? '리뷰 수정' : '질문 수정') : (type === 'feed' ? '리뷰 작성' : '질문하기')}
        </h1>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40 active:scale-95 transition-transform"
        >
          {isSubmitting ? '처리 중...' : (isEdit ? '수정' : '등록')}
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

        {/* Images */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            사진 <span className="text-gray-400 font-normal text-xs">({imageCount}/{MAX_IMAGES}, 선택)</span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((src, i) => (
              <div key={`existing-${i}`} className="relative aspect-square">
                <img src={src} alt="" className="w-full h-full rounded-xl object-cover" />
                <button
                  onClick={() => removeExisting(i)}
                  className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1 active:scale-95"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
            {newPreviews.map((src, i) => (
              <div key={`new-${i}`} className="relative aspect-square">
                <img src={src} alt="" className="w-full h-full rounded-xl object-cover" />
                <button
                  onClick={() => removeNew(i)}
                  className="absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1 active:scale-95"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
            {imageCount < MAX_IMAGES && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square flex flex-col items-center justify-center gap-1 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:text-blue-500 transition-colors active:scale-95"
              >
                <ImageIcon className="w-6 h-6" strokeWidth={1.5} />
                <span className="text-xs">추가</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
