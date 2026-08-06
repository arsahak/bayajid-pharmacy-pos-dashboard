"use client";

interface WebOrdersListSkeletonProps {
  isDarkMode: boolean;
}

export default function WebOrdersListSkeleton({ isDarkMode }: WebOrdersListSkeletonProps) {
  return (
    <div className="p-6 animate-pulse">
      <div className="max-w-[1920px] mx-auto">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className={`h-8 w-64 rounded-lg mb-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
          <div className={`h-4 w-96 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        </div>

        {/* Filters Skeleton */}
        <div
          className={`p-4 rounded-2xl border mb-6 ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className={`flex-1 h-11 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`w-40 h-11 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`w-24 h-11 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
          </div>
        </div>

        {/* Table Skeleton */}
        <div
          className={`rounded-2xl overflow-hidden shadow-xl border ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? "bg-gray-900/50" : "bg-gray-50/80"}>
                <tr>
                  {["Order No", "Date", "Customer", "Items", "Total", "Status", "Actions"].map((label, i) => (
                    <th key={label} className={`px-6 py-4 ${i === 6 ? "text-center" : i === 4 ? "text-right" : "text-left"}`}>
                      <div
                        className={`h-4 rounded mx-auto ${i === 6 ? "w-20" : i === 4 ? "w-16 ml-auto mr-0" : "w-20"} ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        }`}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-100"}`}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className={`h-4 w-28 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    </td>
                    <td className="px-6 py-4">
                      <div className={`h-4 w-20 rounded mb-1.5 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                      <div className={`h-3 w-16 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    </td>
                    <td className="px-6 py-4">
                      <div className={`h-4 w-24 rounded mb-1.5 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                      <div className={`h-3 w-20 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    </td>
                    <td className="px-6 py-4">
                      <div className={`h-4 w-16 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`h-5 w-16 rounded ml-auto ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    </td>
                    <td className="px-6 py-4">
                      <div className={`h-6 w-24 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`h-8 w-8 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                        <div className={`h-8 w-8 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
