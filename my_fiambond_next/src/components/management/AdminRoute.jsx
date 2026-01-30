'use client'; // Required due to the use of useState, useEffect, useContext, and client-side Firebase logic

import { useContext, useEffect, useState } from "react";
import { redirect } from "next/navigation"; // Use redirect from next/navigation for server/client redirect
import { AppContext } from "../../Context/AppContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase-config";

export default function AdminRoute({ children }) {
    const { user, loading } = useContext(AppContext);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingRole, setCheckingRole] = useState(true);

    useEffect(() => {
        const checkAdminRole = async () => {
            // Only check if user is not null/undefined
            if (user) {
                try {
                    // Client-side Firebase operation
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists() && userDoc.data().role === "admin") {
                        setIsAdmin(true);
                    }
                } catch (error) {
                    console.error("Error verifying admin:", error);
                }
            }
            setCheckingRole(false);
        };

        if (!loading) {
            checkAdminRole();
        }
        
    }, [user, loading]);

    // 1. Loading/Permission Check State
    if (loading || checkingRole) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Verifying Permissions...</p>
                </div>
            </div>
        );
    }

    // 2. Redirection Logic
    if (!isAdmin) {
        redirect('/'); 
    }

    // 3. Render Children if authorized
    return <>{children}</>;
}