import { useContext, useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AppContext } from "../../Context/AppContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase-config";

export default function AdminRoute() {
    const { user, loading } = useContext(AppContext);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingRole, setCheckingRole] = useState(true);

    useEffect(() => {
        const checkAdminRole = async () => {
            if (user) {
                try {
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

    if (loading || checkingRole) {
        return <div className="h-screen w-full flex items-center justify-center">Verifying Permissions...</div>;
    }

    return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}