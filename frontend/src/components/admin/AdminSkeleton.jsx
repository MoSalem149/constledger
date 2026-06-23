/**
 * AdminSkeleton — layout placeholder while admin data loads.
 *
 * Mirrors the structure of AdminPage so the layout doesn't jump
 * when data arrives.
 */
export default function AdminSkeleton() {
    return (
      <div className="bg-bg-main min-h-[calc(100vh-116px)] animate-pulse">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-56 bg-gray-200 rounded" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-full" />
        </div>
  
        {/* Table */}
        <div className="overflow-x-auto p-6 bg-bg-cards1 rounded-lg">
          <table className="table-auto w-full">
            <colgroup>
              <col className="w-1/2" />
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr className="bg-bg-grey">
                <th className="px-6 py-7">
                  <div className="h-3 w-12 bg-gray-200 rounded" />
                </th>
                <th className="px-6 py-7">
                  <div className="h-3 w-12 bg-gray-200 rounded" />
                </th>
                <th className="px-6 py-7">
                  <div className="h-3 w-12 bg-gray-200 rounded" />
                </th>
                <th className="px-6 py-7">
                  <div className="h-3 w-8 bg-gray-200 rounded" />
                </th>
                <th className="px-6 py-7">
                  <div className="h-3 w-8 bg-gray-200 rounded" />
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-6 py-7">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                  </td>
                  <td className="px-6 py-7">
                    <div className="h-4 w-40 bg-gray-200 rounded" />
                  </td>
                  <td className="px-6 py-7">
                    <div className="h-6 w-20 bg-gray-200 rounded-full" />
                  </td>
                  <td className="px-6 py-7">
                    <div className="h-4 w-8 bg-gray-200 rounded" />
                  </td>
                  <td className="px-6 py-7">
                    <div className="h-4 w-8 bg-gray-200 rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }