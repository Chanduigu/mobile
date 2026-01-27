'use client';

import { createStore } from '@/lib/store-actions';

export default function CreateStoreForm() {
    return (
        <div className="mt-4 rounded-md bg-gray-50 dark:bg-gray-800 p-4 md:p-6">
            <h2 className="mb-4 text-lg">Add New Store</h2>
            <form action={createStore} className="flex gap-4 items-end flex-wrap">
                <div>
                    <label className="mb-2 block text-sm font-medium">Store Name</label>
                    <input name="name" type="text" placeholder="Store Name" className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 text-black" required />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium">Address</label>
                    <input name="address" type="text" placeholder="Location" className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 text-black" />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium">Phone</label>
                    <input name="phone" type="text" placeholder="Contact No" className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 text-black" />
                </div>

                <div className="w-full">
                    <label className="mb-2 block text-sm font-medium">Google Maps Link (Optional)</label>
                    <input name="gmapsLink" type="text" placeholder="https://maps.google.com/..." className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 text-black" />
                    <p className="text-xs text-gray-500 mt-1">Copy coordinates from Google Maps (Right click &rarr; First option)</p>
                </div>
                <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
                    Add Store
                </button>
            </form>
        </div>
    );
}
