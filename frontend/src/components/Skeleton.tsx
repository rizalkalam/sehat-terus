export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-[8px] bg-black/10 ${className ?? ""}`} />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="flex-1 bg-white rounded-[12px] p-[22px] flex flex-col gap-[10px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.08)] min-w-0">
      <SkeletonBlock className="h-5 w-3/4" />
      <SkeletonBlock className="h-10 w-2/5" />
      <div className="flex gap-[8px]">
        <SkeletonBlock className="h-4 w-16" />
        <SkeletonBlock className="h-4 w-20" />
      </div>
    </div>
  );
}

export function SkeletonBanner() {
  return (
    <div className="bg-white rounded-[12px] p-[20px] flex items-start gap-[16px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.08)]">
      <SkeletonBlock className="size-[37px] rounded-full shrink-0" />
      <div className="flex flex-col gap-[8px] flex-1">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center justify-between rounded-[18px] px-[14px] py-[16px] bg-[rgba(195,247,255,0.2)] border border-white/20">
      <div className="flex items-center gap-[12px] flex-1 min-w-0">
        <SkeletonBlock className="size-[28px] rounded-full shrink-0" />
        <div className="flex flex-col gap-[8px] flex-1">
          <SkeletonBlock className="h-5 w-3/4" />
          <SkeletonBlock className="h-4 w-1/2" />
        </div>
      </div>
      <SkeletonBlock className="h-9 w-24 rounded-full shrink-0 ml-4" />
    </div>
  );
}

export function ContentSkeleton() {
  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex gap-[18px]">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </div>
      <SkeletonBanner />
      <div className="flex flex-col gap-[10px]">
        <SkeletonBlock className="h-7 w-64 mb-1" />
        <SkeletonListItem />
        <SkeletonListItem />
      </div>
      <div className="rounded-[18px] p-[20px] bg-[rgba(195,247,255,0.2)] border border-white/20 h-[280px] flex flex-col gap-3">
        <SkeletonBlock className="h-6 w-48" />
        <div className="flex-1 animate-pulse bg-black/5 rounded-[8px]" />
      </div>
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="px-[41px] py-[29px] flex flex-col gap-[16px] w-full max-w-[1163px] mx-auto">
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col gap-[8px]">
          <SkeletonBlock className="h-5 w-44" />
          <SkeletonBlock className="h-10 w-36 mt-1" />
        </div>
        <div className="flex items-center gap-[16px]">
          <SkeletonBlock className="size-6 rounded-full" />
          <SkeletonBlock className="size-[60px] rounded-full" />
          <SkeletonBlock className="h-6 w-28" />
        </div>
      </div>
      <ContentSkeleton />
    </div>
  );
}
