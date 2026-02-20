/* Skeleton card for friend list loading states */
export function FriendCardSkeleton() {
  return (
    <div className="relative p-5 rounded-xl border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm overflow-hidden">
      <div className="flex items-start gap-4 mb-3">
        <div className="skeleton-shimmer w-14 h-14 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="skeleton-shimmer h-4 w-3/4 rounded-lg" />
          <div className="skeleton-shimmer h-3 w-1/2 rounded-lg" />
          <div className="skeleton-shimmer h-4 w-20 rounded-full" />
        </div>
      </div>
      <div className="flex gap-1.5 mt-4">
        <div className="skeleton-shimmer h-5 w-14 rounded-full" />
        <div className="skeleton-shimmer h-5 w-20 rounded-full" />
        <div className="skeleton-shimmer h-5 w-12 rounded-full" />
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between">
        <div className="skeleton-shimmer h-4 w-20 rounded-lg" />
        <div className="skeleton-shimmer h-4 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function FriendListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <FriendCardSkeleton key={i} />
      ))}
    </div>
  );
}
