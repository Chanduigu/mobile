'use client';

export default function DriverSummary({
    totalStops,
    completedStops,
    pendingStops,
    totalCollected,
    totalCash,
    totalUpi,
    totalPending,
    todaysOrdersCount
}: {
    totalStops: number;
    completedStops: number;
    pendingStops: number;
    totalCollected: number;
    totalCash: number;
    totalUpi: number;
    totalPending: number;
    todaysOrdersCount: number;
}) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl shadow-sm border border-green-100 dark:border-gray-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="text-sm text-gray-500 font-medium">Route Status</div>
                <div className="text-3xl font-extrabold mt-1">
                    <span className="text-green-600">{completedStops}</span>
                    <span className="text-gray-400 text-lg font-normal"> / {totalStops}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">Stops Visited</div>
            </div>

            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-gray-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="text-sm text-gray-500 font-medium">Bills Created</div>
                <div className="text-3xl font-extrabold text-blue-600 mt-1">{todaysOrdersCount}</div>
                <div className="text-xs text-gray-400 mt-1">Invoices Today</div>
            </div>

            <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-gray-700 relative overflow-hidden">
                <div className="text-sm text-gray-500 font-medium">Total Collected</div>
                <div className="text-3xl font-extrabold text-emerald-600 mt-1">₹{totalCollected}</div>
                <div className="text-xs text-gray-400 mt-1">Cash + UPI</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Cash Received</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{totalCash}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">UPI Received</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">₹{totalUpi}</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pending Bal</div>
                <div className="text-2xl font-bold text-red-500 mt-1">₹{totalPending}</div>
            </div>
        </div>
    );
}
