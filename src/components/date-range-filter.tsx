'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Filter, X } from 'lucide-react';
import { format } from 'date-fns';

export default function DateRangeFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialFrom = searchParams.get('from') || '';
    const initialTo = searchParams.get('to') || '';
    const currentRange = searchParams.get('range') || 'today';

    const [startDate, setStartDate] = useState(initialFrom);
    const [endDate, setEndDate] = useState(initialTo);
    const [isOpen, setIsOpen] = useState(false);

    // Sync state with URL params
    useEffect(() => {
        setStartDate(searchParams.get('from') || '');
        setEndDate(searchParams.get('to') || '');
    }, [searchParams]);

    const applyFilter = () => {
        if (!startDate || !endDate) {
            alert('Please select both From and To dates');
            return;
        }

        const params = new URLSearchParams(searchParams.toString());
        params.set('range', 'custom');
        params.set('from', startDate);
        params.set('to', endDate);

        router.push(`?${params.toString()}`);
        setIsOpen(false);
    };

    const clearFilter = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('from');
        params.delete('to');
        params.set('range', 'today'); // Default back to today

        setStartDate('');
        setEndDate('');
        router.push(`?${params.toString()}`);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Toggle Button for Mobile / Desktop */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${currentRange === 'custom' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
            >
                <Calendar className="w-4 h-4" />
                {currentRange === 'custom' && startDate && endDate
                    ? `${format(new Date(startDate), 'dd MMM')} - ${format(new Date(endDate), 'dd MMM')}`
                    : 'Custom Range'
                }
            </button>

            {/* Dropdown / Modal */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 w-[300px] z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white">Select Date Range</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={applyFilter}
                                className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Filter className="w-4 h-4" /> Apply
                            </button>
                            {currentRange === 'custom' && (
                                <button
                                    onClick={clearFilter}
                                    className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
