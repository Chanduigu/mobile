'use client';

import Link from 'next/link';
import { toggleStopStatus } from '@/lib/route-actions';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, Navigation, CheckCircle2, Circle, ArrowRight, Map } from 'lucide-react';

type RouteStop = {
    id: string;
    storeId: string;
    storeName: string | null;
    address: string | null;
    phone: string | null;
    lat: number | null;
    lng: number | null;
    gmapsLink: string | null;
    status: string | null;
    sequence: number;
    completedAt: Date | null;
};

export default function DriverRouteView({ stops, routeId }: { stops: RouteStop[]; routeId?: string }) {
    const [localStops, setLocalStops] = useState(stops);
    const activeStopRef = useRef<HTMLDivElement>(null);

    // Sync properly if props change (revalidation)
    useEffect(() => {
        setLocalStops(stops);
    }, [stops]);

    // Auto-scroll to first pending stop
    useEffect(() => {
        if (activeStopRef.current) {
            setTimeout(() => {
                activeStopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    }, [localStops]);

    const completedCount = localStops.filter(s => s.status === 'visited').length;
    const progress = Math.round((completedCount / localStops.length) * 100);

    const firstPendingIndex = localStops.findIndex(s => s.status !== 'visited');

    const handleNavigate = (stop: RouteStop) => {
        if (stop.gmapsLink) {
            window.open(stop.gmapsLink, '_blank');
        } else if (stop.lat && stop.lng) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`;
            window.open(url, '_blank');
        } else {
            const query = encodeURIComponent(`${stop.storeName}, ${stop.address}`);
            const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
            window.open(url, '_blank');
        }
    };

    const handleFullRoute = () => {
        if (localStops.length < 2) return handleNavigate(localStops[0]);
        const destination = localStops[localStops.length - 1];
        const waypoints = localStops.slice(0, localStops.length - 1).map(s => {
            if (s.lat && s.lng) return `${s.lat},${s.lng}`;
            return encodeURIComponent(s.address || s.storeName || '');
        }).join('|');
        const destParam = (destination.lat && destination.lng) ? `${destination.lat},${destination.lng}` : encodeURIComponent(destination.address || '');
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destParam}&waypoints=${waypoints}`;
        window.open(url, '_blank');
    };

    const markVisited = async (stopId: string) => {
        // Optimistic update
        const newStops = localStops.map(s => s.id === stopId ? { ...s, status: 'visited' } : s);
        setLocalStops(newStops);
        await toggleStopStatus(stopId, 'visited');
    };

    return (
        <div className="space-y-6 pb-32">
            {/* Progress Card */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 sticky top-0 z-30 transition-all duration-300">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Route Progress</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">{completedCount}</span>
                            <span className="text-sm text-gray-500">/ {localStops.length} stops</span>
                        </div>
                    </div>
                    <button
                        onClick={handleFullRoute}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
                        title="View Full Route Map"
                    >
                        <Map className="w-5 h-5" />
                    </button>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Vertical Timeline */}
            <div className="relative pl-2">
                {/* Continuous Line */}
                <div className="absolute left-[19px] top-6 bottom-10 w-0.5 bg-gray-200 dark:bg-gray-700" />

                <div className="space-y-0">
                    {localStops.map((stop, index) => {
                        const isCompleted = stop.status === 'visited';
                        const isNext = index === firstPendingIndex;
                        const isPending = !isCompleted && !isNext;

                        return (
                            <div
                                key={stop.id}
                                ref={isNext ? activeStopRef : null}
                                className={`relative pl-12 pb-8 ${index === localStops.length - 1 ? 'pb-0' : ''}`}
                            >
                                {/* Timeline Dot */}
                                <div className={`
                                    absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-gray-50 dark:border-gray-900 transition-all duration-500
                                    ${isCompleted ? 'bg-green-500 text-white shadow-md scale-90' : ''}
                                    ${isNext ? 'bg-blue-600 text-white shadow-lg shadow-blue-300 dark:shadow-blue-900 scale-110 animate-none' : ''}
                                    ${isPending ? 'bg-white border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-700' : ''}
                                `}>
                                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <span className="text-sm font-bold">{index + 1}</span>}
                                </div>

                                {/* Content Card */}
                                <div className={`
                                    rounded-2xl transition-all duration-300 border
                                    ${isNext
                                        ? 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800 shadow-xl shadow-blue-100 dark:shadow-none transform scale-[1.02]'
                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800 shadow-sm opacity-90'}
                                    ${isCompleted ? 'bg-gray-50/50 dark:bg-gray-900/50 border-transparent opacity-60 grayscale-[0.5]' : ''}
                                `}>
                                    {isNext && (
                                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-t-xl">
                                            CURRENT STOP ({index + 1} / {localStops.length})
                                        </div>
                                    )}

                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`font-bold text-lg leading-tight ${isCompleted ? 'text-gray-500 line-through decoration-2' : 'text-gray-900 dark:text-white'}`}>
                                                {stop.storeName}
                                            </h3>
                                        </div>

                                        <div className="flex items-start gap-2 mb-4">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                            <p className="text-sm text-gray-500 leading-snug">{stop.address || 'No address provided'}</p>
                                        </div>

                                        {stop.phone && (
                                            <div className="mb-4">
                                                <a href={`tel:${stop.phone}`} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                                                    <Phone className="w-3.5 h-3.5" /> {stop.phone}
                                                </a>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {isCompleted ? (
                                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-100 w-fit">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="text-sm font-medium">Delivered</span>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3 mt-4">
                                                <button
                                                    onClick={() => handleNavigate(stop)}
                                                    className="col-span-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
                                                >
                                                    <Navigation className="w-4 h-4" /> Map
                                                </button>

                                                {isNext ? (
                                                    <div className="col-span-1 contents">
                                                        <Link
                                                            href={`/driver?view=bill&storeId=${stop.storeId}${routeId ? `&routeId=${routeId}` : ''}`}
                                                            className="col-span-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
                                                        >
                                                            <span>Deliver</span> <ArrowRight className="w-4 h-4" />
                                                        </Link>

                                                        {/* Skip option for current stop */}
                                                        <button
                                                            onClick={() => markVisited(stop.id)}
                                                            className="col-span-2 text-center text-xs text-gray-400 font-medium hover:text-gray-600 py-2"
                                                        >
                                                            Mark as visited without billing
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href={`/driver?view=bill&storeId=${stop.storeId}${routeId ? `&routeId=${routeId}` : ''}`}
                                                        className="col-span-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 py-3 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all"
                                                    >
                                                        Deliver
                                                    </Link>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {firstPendingIndex === -1 && localStops.length > 0 && (
                    <div className="ml-12 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100 text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <h4 className="font-bold text-green-800 text-lg">Route Completed</h4>
                        <p className="text-green-600 text-sm">All stops for today have been visited.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
