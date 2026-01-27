import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Truck, Receipt, History, User, LogOut } from "lucide-react";

export default async function Layout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const user = session?.user;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">

            {/* Desktop Sidebar - Fixed Left */}
            <aside className="hidden md:flex fixed inset-y-0 left-0 z-50 w-64 flex-col bg-white border-r border-gray-200 shadow-sm">
                <div className="p-6 bg-gradient-to-r from-orange-500 to-red-600 text-white h-[88px] flex flex-col justify-center">
                    <h1 className="font-heading font-bold text-xl leading-none">SAPTHAGIRI FOODS</h1>
                    <p className="text-orange-100 text-xs mt-1 font-medium tracking-wide">Desktop Driver Portal</p>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <SideLink href="/driver" icon={Truck} label="Current Route" />
                    <SideLink href="/driver/history" icon={History} label="Delivery History" />
                </nav>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold border border-orange-200">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{user?.role}</p>
                        </div>
                    </div>
                    <form action={async () => {
                        'use server';
                        await signOut();
                    }}>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all text-gray-700">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content Wrapper - Pushed right on Desktop */}
            <div className="flex-1 flex flex-col md:pl-64 min-h-screen transition-all duration-300 w-full">

                {/* Mobile Header - Sticky & Hidden on Desktop */}
                <header className="md:hidden sticky top-0 z-40 bg-gradient-to-r from-orange-500 to-red-600 px-4 py-3 shadow-md text-white flex justify-between items-center">
                    <div>
                        <h1 className="font-heading font-bold text-lg leading-tight">SAPTHAGIRI FOODS</h1>
                        <p className="text-orange-100 text-[10px] font-bold tracking-wider uppercase">Driver Panel</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <div className="text-xs font-bold opacity-90">{user?.name}</div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Nav - Fixed & Hidden on Desktop */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 h-16 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe-area">
                <BottomLink href="/driver" icon={Truck} label="Route" />
                <BottomLink href="/driver/history" icon={History} label="History" />

                <form action={async () => {
                    'use server';
                    await signOut();
                }}>
                    <button className="flex flex-col items-center justify-center w-full px-2 text-gray-400 hover:text-red-500 transition-colors">
                        <LogOut className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">Logout</span>
                    </button>
                </form>
            </nav>
        </div>
    );
}

function BottomLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center w-full px-2 text-gray-400 hover:text-orange-600 active:text-orange-600 transition-colors group">
            <Icon className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold">{label}</span>
        </Link>
    )
}

function SideLink({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
    return (
        <Link href={href} className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-orange-50 hover:text-orange-700 font-bold text-sm transition-all hover:translate-x-1">
            <Icon className="w-5 h-5" />
            {label}
        </Link>
    )
}
