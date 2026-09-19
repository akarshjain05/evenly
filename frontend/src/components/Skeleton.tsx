export function Skeleton({ className }: { className?: string }) {
  const hasRounded = className?.includes('rounded');
  return (
    <div
      className={`skeleton-premium ${hasRounded ? '' : 'rounded-md'} ${
        className || ""
      }`}
    />
  );
}

export function GroupViewSkeleton() {
  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-48 sm:w-64" />
          <Skeleton className="h-4 w-32 sm:w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-9 h-9 rounded-full hidden sm:block" />
          <Skeleton className="w-9 h-9 rounded-full hidden sm:block" />
          <Skeleton className="w-9 h-9 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action buttons */}
          <div className="flex gap-4">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
          </div>

          <div className="bg-paper rounded-2xl border border-line-paper overflow-hidden">
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-line-paper flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Skeleton className="h-6 w-24" />
              <div className="flex bg-bg-soft rounded-full p-1 gap-1 w-full sm:w-auto min-w-[220px] border border-line-dark shadow-sm">
                <Skeleton className="flex-1 h-[32px] rounded-full" />
                <Skeleton className="flex-1 h-[32px] rounded-full" />
              </div>
            </div>
            <div className="divide-y divide-line-dark">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 sm:p-6 flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48 max-w-[70%]" />
                    <Skeleton className="h-4 w-32 max-w-[50%]" />
                  </div>
                  <div className="flex items-start gap-2 shrink-0">
                    <div className="text-right space-y-2">
                       <Skeleton className="h-4 w-16" />
                       <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="w-6 h-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-paper rounded-2xl border border-line-paper p-5 sm:p-6 overflow-hidden">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-paper rounded-2xl border border-line-paper p-5 sm:p-6 overflow-hidden">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="p-4 bg-bg rounded-xl border border-line-dark flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-2 px-3 py-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-10 w-full rounded-[10px]" />
      ))}
    </div>
  );
}
