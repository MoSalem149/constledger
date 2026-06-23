/**
 * ContractsSkeleton — layout placeholder while contracts load.
 *
 * Mirrors the structure of ContractsPage so the layout doesn't jump
 * when data arrives.
 */
export default function ContractsSkeleton() {
    return (
      <div className="bg-bg-main min-h-[calc(100vh-116px)] lg:pr-10 pr-0 animate-pulse">
        {/* Search bar */}
        <div className="mb-6">
          <div className="h-10 w-full max-w-xs bg-gray-200 rounded-full" />
        </div>
  
        {/* Contract cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-bg-cards1 rounded-lg shadow-[0px_2px_8px_0px_rgba(136,135,135,0.10)] overflow-hidden flex flex-col"
            >
              {/* Image placeholder */}
              <div className="h-[120px] bg-gray-200" />
              {/* Body */}
              <div className="p-3.5 flex flex-col gap-3">
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                  <div className="h-5 w-28 bg-gray-200 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="mt-auto pt-2 border-t border-gray-100">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }