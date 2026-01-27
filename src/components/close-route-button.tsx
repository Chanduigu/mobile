'use client';

import { closeRoute } from '@/lib/route-actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CloseRouteButton({
    routeId,
    pendingAmount,
    status
}: {
    routeId: string;
    pendingAmount: number;
    status: string;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleClose = async () => {
        if (pendingAmount > 0) {
            if (!confirm(`Warning: This route has ₹${pendingAmount} pending. Are you sure you want to close it?`)) {
                return;
            }
        } else {
            if (!confirm('Are you sure you want to close this route? It will be hidden from the driver.')) {
                return;
            }
        }

        setIsLoading(true);
        const res = await closeRoute(routeId);
        setIsLoading(false);

        if (res.success) {
            // router.refresh(); // Server action usually handles revalidation, but sometimes refresh is safer
        } else {
            alert('Failed to close route: ' + res.error);
        }
    };

    if (status === 'closed') {
        return (
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
                Closed
            </span>
        );
    }

    return (
        <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-medium rounded-md transition-colors disabled:opacity-50"
        >
            {isLoading ? 'Closing...' : 'Close Route'}
        </button>
    );
}
