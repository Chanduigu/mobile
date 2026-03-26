'use client';

import { createStore } from '@/lib/store-actions';
import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

export default function CreateStoreForm() {
    const [gmapsLink, setGmapsLink] = useState('');
    const [isLocating, setIsLocating] = useState(false);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Format: https://www.google.com/maps/search/?api=1&query=lat,lng
                // Or simply: https://maps.google.com/?q=lat,lng
                const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
                setGmapsLink(mapsUrl);
                setIsLocating(false);
            },
            (error) => {
                console.error('Error getting location:', error);
                alert(`Failed to get location: ${error.message}`);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <div className="mt-4 rounded-xl bg-white shadow-sm border border-gray-100 dark:bg-gray-800 p-4 md:p-6">
            <h2 className="mb-6 text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                Add New Store
            </h2>
            <form action={createStore} className="flex gap-4 items-end flex-wrap">
                <div className="w-full sm:w-auto flex-1 min-w-[200px]">
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Store Name</label>
                    <input name="name" type="text" placeholder="e.g. Anand Sweets" className="peer block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-orange-500 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-400 text-black shadow-sm" required />
                </div>
                <div className="w-full sm:w-auto flex-1 min-w-[200px]">
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Address / Area</label>
                    <input name="address" type="text" placeholder="e.g. Jayanagar 4th Block" className="peer block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-orange-500 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-400 text-black shadow-sm" />
                </div>
                <div className="w-full sm:w-auto flex-1 min-w-[150px]">
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</label>
                    <input name="phone" type="text" placeholder="e.g. 9876543210" className="peer block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-orange-500 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-400 text-black shadow-sm" />
                </div>

                <div className="w-full">
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Google Maps Link (Optional)</label>
                    <div className="flex gap-2">
                        <input
                            name="gmapsLink"
                            type="text"
                            value={gmapsLink}
                            onChange={(e) => setGmapsLink(e.target.value)}
                            placeholder="https://maps.google.com/..."
                            className="peer block w-full rounded-lg border border-gray-300 py-2.5 px-3 text-sm focus:border-orange-500 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-400 text-black shadow-sm"
                        />
                        <button
                            type="button"
                            onClick={handleGetLocation}
                            disabled={isLocating}
                            className="shrink-0 flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors disabled:opacity-50"
                        >
                            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                            <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'Get Current Location'}</span>
                            <span className="sm:hidden">{isLocating ? '...' : 'Location'}</span>
                        </button>
                    </div>
                </div>
                <div className="w-full flex justify-end mt-4 pt-4 border-t border-gray-100">
                    <button type="submit" className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-orange-600 to-red-600 px-8 py-3 text-sm font-bold text-white hover:from-orange-500 hover:to-red-500 shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                        Add New Store
                    </button>
                </div>
            </form>
        </div>
    );
}
