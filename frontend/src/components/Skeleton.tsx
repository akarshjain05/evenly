export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`skeleton-premium rounded-md ${
        className || ""
      }`}
    />
  );
}

export function GroupViewSkeleton() {
  return (
    <div className="max-w-4xl mx-auto pb-20 p-6 sm:p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
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

          <div className="bg-paper rounded-2xl border border-line-dark overflow-hidden">
            <div className="px-6 py-5 border-b border-line-dark flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="divide-y divide-line-dark">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 sm:p-6 flex items-start gap-4">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-paper rounded-2xl border border-line-dark overflow-hidden">
            <div className="p-5 border-b border-line-dark">
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="p-5 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
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
