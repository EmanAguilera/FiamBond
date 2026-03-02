"use client";

import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { useRouter, usePathname } from "next/navigation";

// 🏎️ Simplex Move: Import your unified loader
import UnifiedLoadingWidget from "../ui/UnifiedLoadingWidget";

export default function RouteGuard({ children, require = "auth" }) {
    const context = useContext(AppContext) || {};
    const { user, loading } = context;
    
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    // Sync mounting to prevent hydration mismatch errors during build
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || loading) return;

        // 1. BASE LEVEL: Must be logged in
        if (!user) {
            router.push("/login");
            return;
        }

        // 2. VERIFICATION LEVEL: Must be email verified
        if (!user.emailVerified && pathname !== "/verify-email") {
            router.push("/verify-email");
            return;
        }

        // 3. ROLE LEVEL: Admin Check
        if (require === "admin" && user.role !== "admin") {
            router.push("/"); // Send non-admins home
            return;
        }

        // 4. ACCESS LEVEL: Premium Check
        if (require === "premium") {
            const hasAccess = user.role === "admin" || (user.is_premium && user.subscription_status === "active");
            if (!hasAccess) {
                router.push("/"); 
                return;
            }
        }

        // 5. If already on verify-email but is verified, send home
        if (user.emailVerified && pathname === "/verify-email") {
            router.push("/");
        }

    }, [user, loading, router, pathname, require, mounted]);

    // 🛡️ Guard: Show unified fullscreen loader while verifying or before mounting
    if (!mounted || loading) {
        return (
            <UnifiedLoadingWidget 
                type="fullscreen" 
                message="Verifying Matrix..." 
                variant="indigo" 
            />
        );
    }

    // Double check: If we're supposed to be redirected, don't show children yet
    if (!user && pathname !== "/login") {
        return <UnifiedLoadingWidget type="fullscreen" message="Redirecting..." variant="slate" />;
    }

    // Only render children if all checks passed
    return <React.Fragment>{children}</React.Fragment>;
}