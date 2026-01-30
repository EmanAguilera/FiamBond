"use client"; // Your instruction remembered!

import { useContext, useEffect } from "react";
import { AppContext } from "@/src/context/AppContext";
import { useRouter, usePathname } from "next/navigation";

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { user, loading } = useContext(AppContext) as any;
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            // 1. If no user is logged in, send to login
            if (!user) {
                router.push("/login");
            } 
            // 2. If user exists but is NOT verified, and isn't already on the verify page
            else if (!user.emailVerified && pathname !== "/verify-email") {
                router.push("/verify-email");
            }
            // 3. If user IS verified and tries to go to verify-email, send them home
            else if (user.emailVerified && pathname === "/verify-email") {
                router.push("/");
            }
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Only render children if user meets the requirements for the current path
    return <>{children}</>;
}