'use client';

import { useState, useEffect } from 'react';
import { saveRoute, saveRouteLoad } from '@/lib/route-actions';
import SearchableSelect from '@/components/searchable-select';

// Simple Drag and Drop implementation without heavy libraries for now, 
// or basic list ordering with Up/Down buttons if DnD is too complex for "Simple App".
// Let's stick to Up/Down/Remove buttons for simplicity and robustness in this environment.

type Store = {
    id: string;
    name: string;
    address?: string | null;
};

type User = {
    id: string;
    name: string;
};

type Item = {
    id: string;
    name: string;
};

export default function RoutePlanner({
    drivers,
    stores,
    items,
    initialRoute
}: {
    drivers: User[],
    stores: Store[],
    items: Item[],
    initialRoute?: {
        driverId: string;
        date: string;
        slot?: string;
        stops: string[]; // Store Ids
        load?: { itemId: string; quantity: number }[];
    }
}) {
    const [selectedDriverId, setSelectedDriverId] = useState(initialRoute?.driverId || '');
    const [date, setDate] = useState(initialRoute?.date || new Date().toISOString().split('T')[0]);

    const [routeStops, setRouteStops] = useState<Store[]>([]);

    // Vehicle Load State
    const [vehicleLoad, setVehicleLoad] = useState<Record<string, number>>({});

    // For storing the pool of available stores
    const [selectedStoreToAdd, setSelectedStoreToAdd] = useState('');

    useEffect(() => {
        if (initialRoute?.load) {
            const loadMap: Record<string, number> = {};
            initialRoute.load.forEach(l => {
                loadMap[l.itemId] = l.quantity;
            });
            setVehicleLoad(loadMap);
        }
    }, [initialRoute]);

    const handleAddStore = () => {
        if (!selectedStoreToAdd) return;
        const store = stores.find(s => s.id === selectedStoreToAdd);
        if (store && !routeStops.find(s => s.id === store.id)) {
            setRouteStops([...routeStops, store]);
            setSelectedStoreToAdd('');
        }
    };

    const removeStop = (storeId: string) => {
        setRouteStops(routeStops.filter(s => s.id !== storeId));
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newStops = [...routeStops];
        [newStops[index - 1], newStops[index]] = [newStops[index], newStops[index - 1]];
        setRouteStops(newStops);
    };

    const moveDown = (index: number) => {
        if (index === routeStops.length - 1) return;
        const newStops = [...routeStops];
        [newStops[index + 1], newStops[index]] = [newStops[index], newStops[index + 1]];
        setRouteStops(newStops);
    };

    const handleLoadChange = (itemId: string, qty: string) => {
        const value = parseInt(qty) || 0;
        setVehicleLoad(prev => ({
            ...prev,
            [itemId]: value
        }));
    };

    const handleSave = async () => {
        if (!selectedDriverId || !date) return alert('Select Driver and Date');
        if (routeStops.length === 0) return alert('Add at least one store');

        const routeRes = await saveRoute(selectedDriverId, date, routeStops.map(s => s.id));

        if (routeRes.success && routeRes.routeId) {
            // Save Vehicle Load
            const loadItems = Object.entries(vehicleLoad)
                .filter(([_, qty]) => qty > 0)
                .map(([itemId, qty]) => ({ itemId, quantity: qty }));

            const loadRes = await saveRouteLoad(routeRes.routeId, loadItems);

            if (loadRes.success) {
                alert(`Route ${routeRes.routeNumber} Saved Successfully!`);
            } else {
                alert(`Route ${routeRes.routeNumber} saved but Vehicle Load failed: ` + loadRes.error);
            }
        } else {
            alert('Error creating route: ' + routeRes.error);
        }
    };

    const storeOptions = stores.map(s => ({ id: s.id, label: s.name, subLabel: s.address || '' }));

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Driver</label>
                        <select
                            className="w-full border p-2 rounded text-black"
                            value={selectedDriverId}
                            onChange={(e) => setSelectedDriverId(e.target.value)}
                        >
                            <option value="">-- Select --</option>
                            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Select Date</label>
                        <input
                            type="date"
                            className="w-full border p-2 rounded text-black"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>



                <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-2">Add Store to Route</label>
                    <div className="flex gap-2">
                        <div className="flex-grow">
                            <SearchableSelect
                                options={storeOptions}
                                value={selectedStoreToAdd}
                                onChange={setSelectedStoreToAdd}
                                placeholder="Search store by name..."
                            />
                        </div>
                        <button
                            onClick={handleAddStore}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Route Sequence Section */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-4">Route Sequence ({routeStops.length} Stops)</h3>

                    {routeStops.length === 0 ? (
                        <div className="text-gray-500 text-center py-8 px-4 border-2 border-dashed rounded-lg">
                            No stores added. Add stores above to build the route.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {routeStops.map((store, index) => (
                                <div key={store.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium text-black dark:text-white">{store.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{store.address}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => moveUp(index)}
                                            disabled={index === 0}
                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-30"
                                            title="Move Up"
                                        >
                                            ⬆️
                                        </button>
                                        <button
                                            onClick={() => moveDown(index)}
                                            disabled={index === routeStops.length - 1}
                                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-30"
                                            title="Move Down"
                                        >
                                            ⬇️
                                        </button>
                                        <button
                                            onClick={() => removeStop(store.id)}
                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-500 ml-2"
                                            title="Remove"
                                        >
                                            ❌
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Vehicle Load Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 className="font-bold text-lg mb-4">Vehicle Load Planning</h3>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {items.map(item => (
                            <div key={item.id} className="flex items-center justify-between gap-2 p-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                <label className="text-sm font-medium flex-grow">{item.name}</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-24 border rounded p-1 text-right text-black"
                                    placeholder="0"
                                    value={vehicleLoad[item.id] || ''}
                                    onChange={(e) => handleLoadChange(item.id, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                        Enter quantities loaded onto the vehicle for this route.
                    </div>
                </div>
            </div>

            <div className="flex justify-end p-4 sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t z-10">
                <button
                    onClick={handleSave}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow hover:bg-green-700 w-full md:w-auto"
                >
                    Save Route & Load
                </button>
            </div>
        </div>
    );
}
