export function IslandCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-[4/3] bg-gray-200 animate-shimmer"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded w-2/3 mb-2 animate-shimmer"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-3 animate-shimmer"></div>
        <div className="flex gap-2 mb-3">
          <div className="h-6 bg-gray-200 rounded w-16 animate-shimmer"></div>
          <div className="h-6 bg-gray-200 rounded w-16 animate-shimmer"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-24 animate-shimmer"></div>
          <div className="h-8 bg-gray-200 rounded w-20 animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-shimmer"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-2 animate-shimmer"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
}

export function DetailHeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 animate-shimmer"></div>
      <div className="px-6 py-4">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2 animate-shimmer"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-shimmer"></div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {[...Array(count)].map((_, i) => (
        <IslandCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}
