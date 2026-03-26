import { auth, signOut } from "@/auth";
import { LogOut } from "lucide-react";
import { OwnerLayoutClient } from "./owner-layout-client";

export default async function Layout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const user = session?.user;

    const logoutButton = (
        <form action={async () => {
            'use server';
            await signOut();
        }}>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm">
                <LogOut className="w-4 h-4" /> Sign Out
            </button>
        </form>
    );

    const mobileLogoutButton = (
        <form action={async () => {
            'use server';
            await signOut();
        }}>
            <button className="p-1"><LogOut className="w-5 h-5 text-white" /></button>
        </form>
    );

    return (
        <OwnerLayoutClient
            user={user}
            logoutButton={logoutButton}
            mobileLogout={mobileLogoutButton}
        >
            {children}
        </OwnerLayoutClient>
    );
}
