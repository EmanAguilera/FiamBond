"use client";

import React, { useContext, useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter, usePathname } from "expo-router"; 
import { AppContext } from "@/context/AppContext";

// 🏎️ Simplex Move: Native version of your unified loader
import UnifiedLoadingWidget from "../ui/UnifiedLoadingWidget";

interface RouteGuardProps {
    children: React.ReactNode;
    require?: "admin" | "premium" | "auth";
}

export default function RouteGuard({ children, require = "auth" }: RouteGuardProps) {
    /** * ⭐️ THE NUCLEAR FIX:
     * We cast AppContext to 'any' to bypass the "Argument of type boolean" error.
     * We cast the result to ensure 'user' and 'loading' are recognized.
     */
    const context = useContext(AppContext as any) as {
        user: any;
        loading: boolean;
    };
    
    const user = context?.user;
    const loading = context?.loading;
    
    const router = useRouter();
    const pathname = usePathname(); 
    const [mounted, setMounted] = useState(false);

    // Sync mounting for Mobile Lifecycle
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || loading) return;

        // 1. BASE LEVEL: Must be logged in
        if (!user) {
            // Using replace to prevent back-button loops
            router.replace("/(auth)/login");
            return;
        }

        // 2. VERIFICATION LEVEL: Must be email verified
        if (!user.emailVerified && pathname !== "/(auth)/verify-email") {
            router.replace("/(auth)/verify-email");
            return;
        }

        // 3. ROLE LEVEL: Admin Check
        if (require === "admin" && user.role !== "admin") {
            router.replace("/realm"); 
            return;
        }

        // 4. ACCESS LEVEL: Premium Check
        if (require === "premium") {
            const hasAccess = user.role === "admin" || (user.is_premium && user.subscription_status === "active");
            if (!hasAccess) {
                router.replace("/realm"); 
                return;
            }
        }

        // 5. Cleanup: If already verified, don't stay on verification screen
        if (user.emailVerified && pathname === "/(auth)/verify-email") {
            router.replace("/realm");
        }

    }, [user, loading, router, pathname, require, mounted]);

    // 🛡️ Guard: Branded Loading Experience
    if (!mounted || loading || !context) {
        return (
            <UnifiedLoadingWidget 
                type="fullscreen" 
                message="Verifying Matrix..." 
                variant="indigo" 
            />
        );
    }

    // Double check to prevent content flicker during redirect
    if (!user && pathname !== "/(auth)/login") {
        return (
            <UnifiedLoadingWidget 
                type="fullscreen" 
                message="Redirecting..." 
                variant="slate" 
            />
        );
    }

    // Only render children if all checks passed
    return <>{children}</>;
}