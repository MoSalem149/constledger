/**
 * DashboardSkeleton — layout placeholder while dashboard data loads.
 *
 * Mirrors the structure of DashboardPage so the layout doesn't jump
 * when data arrives.
 */
export default function DashboardSkeleton() {
    return (
      <div className="min-h-[calc(100vh-116px)] lg:pr-10 pr-0 flex flex-col gap-6 animate-pulse">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-3">
            <div className="h-3 w-48 bg-gray-200 rounded" />
            <div className="h-7 w-64 bg-gray-200 rounded" />
            <div className="h-3 w-40 bg-gray-200 rounded" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-full" />
        </div>
  
        {/* ── Overview Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-gray-200 rounded-lg" />
          <div className="h-28 bg-gray-200 rounded-lg" />
          <div className="h-28 bg-gray-200 rounded-lg" />
          <div className="h-28 bg-gray-200 rounded-lg" />
        </div>
  
        {/* ── Active Projects ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <div className="h-6 w-40 bg-gray-200 rounded" />
              <div className="h-3 w-56 bg-gray-200 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-9 bg-gray-200 rounded-full" />
              <div className="h-9 w-9 bg-gray-200 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="h-[280px] bg-gray-200 rounded-lg" />
            <div className="h-[280px] bg-gray-200 rounded-lg" />
            <div className="h-[280px] bg-gray-200 rounded-lg" />
          </div>
        </div>
  
        {/* ── Finance Strategy ── */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* Left: Strategy by Project */}
          <div className="xl:col-span-2 flex flex-col rounded-lg bg-bg-cards1 p-4 sm:p-6 shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] gap-4">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-36 bg-gray-200 rounded" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="h-2 w-2 bg-gray-200 rounded-full shrink-0" />
                  <div className="h-4 flex-1 bg-gray-200 rounded" />
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
  
          {/* Right: Planning Strategy Mix */}
          <div className="flex flex-col rounded-lg bg-bg-cards1 p-4 sm:p-6 shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] gap-4">
            <div className="space-y-2">
              <div className="h-6 w-44 bg-gray-200 rounded" />
              <div className="h-3 w-48 bg-gray-200 rounded" />
            </div>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-[180px] h-[180px] bg-gray-200 rounded-full" />
              <div className="flex flex-col gap-2 w-full">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 bg-gray-200 rounded-full shrink-0" />
                    <div className="h-4 flex-1 bg-gray-200 rounded" />
                    <div className="h-4 w-6 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
  
        {/* ── Projects Table ── */}
        <div className="flex bg-bg-cards1 rounded-lg shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] flex-col p-6 gap-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-6 w-40 bg-gray-200 rounded" />
              <div className="h-3 w-48 bg-gray-200 rounded" />
            </div>
            <div className="h-5 w-32 bg-gray-200 rounded" />
          </div>
          <div className="space-y-3">
            {/* Table header */}
            <div className="h-10 bg-gray-200 rounded" />
            {/* Table rows */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }