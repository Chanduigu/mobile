"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ShoppingBag, Store, FileText, Settings, History, LayoutDashboard, Menu, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

function NavLink({ href, icon: Icon, label, onClick }: { href: string, icon: any, label: string, onClick?: () => void }) {
    const pathname = usePathname();
    const isActive = pathname === href || (href !== '/owner' && pathname.startsWith(href));

    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                isActive
                    ? "bg-orange-50 text-orange-700 font-semibold"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-700"
            )}
        >
            <Icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-orange-600" : "text-gray-400 group-hover:text-orange-500"
            )} />
            <span className="text-sm">{label}</span>
        </Link>
    );
}

export function OwnerLayoutClient({
    user,
    logoutButton,
    mobileLogout,
    children
}: {
    user: any;
    logoutButton: React.ReactNode;
    mobileLogout: React.ReactNode;
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const SidebarContent = () => (
        <>
            <div className="p-6 bg-gradient-to-br from-orange-600 to-red-600 text-white flex justify-between items-center shrink-0">
                <div>
                    <h1 className="font-heading font-bold text-xl leading-tight tracking-tight">SAPTHAGIRI<br />FOODS</h1>
                    <p className="text-xs text-orange-100 mt-2 font-medium opacity-90 tracking-wide uppercase">Owner Administration</p>
                </div>
                {/* Close button for mobile */}
                <button className="md:hidden p-1 text-white hover:bg-white/20 rounded-md transition-colors" onClick={toggleSidebar}>
                    <X className="w-6 h-6" />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                <NavLink href="/owner" icon={LayoutDashboard} label="Dashboard" onClick={() => setIsOpen(false)} />
                <NavLink href="/owner/planner" icon={Users} label="Route Planner" onClick={() => setIsOpen(false)} />
                <NavLink href="/owner/history" icon={History} label="Route History" onClick={() => setIsOpen(false)} />
                <NavLink href="/owner/orders" icon={FileText} label="Deliveries" onClick={() => setIsOpen(false)} />
                <NavLink href="/owner/billing" icon={FileText} label="Billing (Create Bill)" onClick={() => setIsOpen(false)} />

                <div className="pt-4 pb-2 px-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Management</p>
                </div>
                <NavLink href="/owner/items" icon={ShoppingBag} label="Items" onClick={() => setIsOpen(false)} />
                <NavLink href="/owner/stores" icon={Store} label="Stores" onClick={() => setIsOpen(false)} />

                <div className="pt-4 pb-2 px-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Analysis</p>
                </div>
                <NavLink href="/owner/reports" icon={FileText} label="Reports" onClick={() => setIsOpen(false)} />
                <NavLink href="/owner/settings" icon={Settings} label="Settings" onClick={() => setIsOpen(false)} />
            </nav>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-3 mb-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs">
                        {user?.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500">Owner Access</p>
                    </div>
                </div>
                {logoutButton}
            </div>
        </>
    );

    return (
        <div className="flex flex-col md:flex-row h-[100dvh] bg-gray-50 text-gray-900 font-sans w-full overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm z-20 h-full shrink-0">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    {/* Overlay */}
                    <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={toggleSidebar}></div>

                    {/* Sidebar container */}
                    <aside className="relative flex flex-col w-64 max-w-xs bg-white h-full shadow-2xl transition-transform transform translate-x-0">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
                {/* Mobile Header (Visible only on small screens) */}
                <div className="md:hidden bg-gradient-to-r from-orange-500 to-red-600 p-4 flex justify-between items-center text-white shadow-md z-30 shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={toggleSidebar} className="p-1 hover:bg-white/20 rounded-md transition-colors">
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="font-heading font-bold text-lg">SAPTHAGIRI FOODS</span>
                    </div>
                    <div className="flex items-center">
                        {mobileLogout}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
                    {children}
                </div>
            </main>
        </div>
    );
}
