"use client";

interface WebOrderDetailsSkeletonProps {
  isDarkMode: boolean;
}

export default function WebOrderDetailsSkeleton({ isDarkMode }: WebOrderDetailsSkeletonProps) {
  const cardClass = `rounded-2xl shadow-sm border p-6 ${
    isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
  }`;

  return (
    <div className="p-6 animate-pulse">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <div>
              <div className={`h-6 w-40 rounded mb-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
              <div className={`h-3 w-32 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            </div>
          </div>
          <div className={`h-8 w-24 rounded-full ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        </div>

        {/* Actions card */}
        <div className={cardClass}>
          <div className={`h-3 w-16 rounded mb-3 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
          <div className="flex gap-3">
            <div className={`h-11 w-40 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`h-11 w-36 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
          </div>
        </div>

        {/* Customer card */}
        <div className={cardClass}>
          <div className={`h-3 w-20 rounded mb-3 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-5 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            ))}
          </div>
        </div>

        {/* Items card */}
        <div className={cardClass}>
          <div className={`h-3 w-14 rounded mb-3 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div>
                  <div className={`h-4 w-40 rounded mb-1.5 ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                  <div className={`h-3 w-24 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                </div>
                <div className={`h-4 w-16 rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
              </div>
            ))}
          </div>
          <div
            className={`mt-4 pt-4 border-t border-dashed space-y-2 ${
              isDarkMode ? "border-gray-700" : "border-gray-300"
            }`}
          >
            <div className={`h-4 w-full rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`h-6 w-full rounded ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
