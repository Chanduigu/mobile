import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Users, ShoppingBag, Store, FileText, LogOut, Settings, History, LayoutDashboard } from "lucide-react";

export default async function Layout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const user = session?.user;

    return (
        <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm z-20">
                <div className="p-6 bg-gradient-to-br from-orange-600 to-red-600 text-white">
                    <h1 className="font-heading font-bold text-xl leading-tight tracking-tight">SAPTHAGIRI<br />FOODS</h1>
                    <p className="text-xs text-orange-100 mt-2 font-medium opacity-90 tracking-wide uppercase">Owner Administration</p>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    <NavLink href="/owner" icon={LayoutDashboard} label="Dashboard" />
                    <NavLink href="/owner/planner" icon={Users} label="Route Planner" />
                    <NavLink href="/owner/history" icon={History} label="Route History" />
                    <NavLink href="/owner/orders" icon={FileText} label="Deliveries" />
                    <NavLink href="/owner/billing" icon={FileText} label="Billing (Create Bill)" />

                    <div className="pt-4 pb-2 px-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Management</p>
                    </div>
                    <NavLink href="/owner/items" icon={ShoppingBag} label="Items" />
                    <NavLink href="/owner/stores" icon={Store} label="Stores" />

                    <div className="pt-4 pb-2 px-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Analysis</p>
                    </div>
                    <NavLink href="/owner/reports" icon={FileText} label="Reports" />
                    <NavLink href="/owner/settings" icon={Settings} label="Settings" />
                </nav>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs">
                            {user?.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500">Owner Access</p>
                        </div>
                    </div>

                    <form action={async () => {
                        'use server';
                        await signOut();
                    }}>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header (Visible only on small screens) */}
                <div className="md:hidden bg-gradient-to-r from-orange-500 to-red-600 p-4 flex justify-between items-center text-white shadow-md z-30">
                    <span className="font-heading font-bold text-lg">SAPTHAGIRI FOODS</span>
                    <form action={async () => {
                        'use server';
                        await signOut();
                    }}>
                        <button className="p-1"><LogOut className="w-5 h-5" /></button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-orange-50 hover:text-orange-700 transition-all group"
        >
            <Icon className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
            <span className="text-sm font-medium">{label}</span>
        </Link>
    );
}
