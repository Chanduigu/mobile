import { addDriver, deleteDriver, getDrivers, updateOwner } from '@/lib/user-actions';
import { revalidatePath } from 'next/cache';
import { Settings, UserPlus, Trash2, Key } from 'lucide-react';

export default async function SettingsPage() {
    const drivers = await getDrivers();

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <Settings className="w-8 h-8" />
                Settings & User Management
            </h1>

            <div className="grid gap-8 md:grid-cols-2">
                {/* --- Manage Drivers Section --- */}
                <div className="space-y-6">
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                            Add New Driver
                        </h2>
                        <form action={async (formData) => {
                            'use server';
                            await addDriver(null, formData);
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                                <input name="name" type="text" placeholder="e.g. Driver Ramesh" className="w-full border rounded-lg p-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input name="username" type="text" placeholder="e.g. driver2" className="w-full border rounded-lg p-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input name="password" type="text" placeholder="e.g. 12345" className="w-full border rounded-lg p-2" required />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                                Create Driver Account
                            </button>
                        </form>
                    </section>

                    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold mb-4">Existing Drivers</h2>
                        {drivers.length === 0 ? (
                            <p className="text-gray-500 italic">No drivers found.</p>
                        ) : (
                            <ul className="divide-y">
                                {drivers.map((driver: any) => (
                                    <li key={driver.id} className="py-3 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{driver.name}</p>
                                            <p className="text-sm text-gray-500">@{driver.username}</p>
                                        </div>
                                        <form action={async () => {
                                            'use server';
                                            await deleteDriver(driver.id);
                                        }}>
                                            <button className="text-red-500 hover:bg-red-50 p-2 rounded-full transition" title="Delete Driver">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </form>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                {/* --- Owner Settings Section --- */}
                <div>
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-yellow-400">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Key className="w-5 h-5 text-yellow-600" />
                            Change Owner Login
                        </h2>
                        <p className="text-sm text-gray-600 mb-4 bg-yellow-50 p-3 rounded">
                            ⚠️ Use this to update your admin username or password.
                            You will need to use these new credentials next time you login.
                        </p>
                        <form action={async (formData) => {
                            'use server';
                            await updateOwner(null, formData);
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Username</label>
                                <input name="currentUsername" type="text" placeholder="Current username (e.g. owner)" className="w-full border rounded-lg p-2" required />
                            </div>
                            <div className="border-t pt-4 mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Username</label>
                                <input name="newUsername" type="text" placeholder="New username" className="w-full border rounded-lg p-2" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input name="newPassword" type="text" placeholder="New password" className="w-full border rounded-lg p-2" required />
                            </div>
                            <button type="submit" className="w-full bg-yellow-500 text-black py-2 rounded-lg font-bold hover:bg-yellow-600 transition">
                                Update Owner Credentials
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}
