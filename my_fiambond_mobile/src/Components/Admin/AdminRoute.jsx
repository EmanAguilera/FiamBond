import React, { useContext, useEffect, useState } from "react";
import { 
    View, 
    Text, 
    ActivityIndicator, 
    SafeAreaView 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppContext } from "../../Context/AppContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase-config";

// Removed TypeScript interface to make this a valid JavaScript file.
// If you want type checking, consider renaming the file to .tsx and ensuring your project supports TypeScript.

export default function AdminRoute({ children }) {
    const context = useContext(AppContext);
    const user = context?.user;
    const loading = context?.loading;
    
    const navigation = useNavigation();
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingRole, setCheckingRole] = useState(true);

    useEffect(() => {
        const checkAdminRole = async () => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists() && userDoc.data().role === "admin") {
                        setIsAdmin(true);
                    } else {
                        // REPLACEMENT FOR <Navigate to="/" replace />
                        // Redirects the user back to the Home screen if they aren't an admin
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }],
                        });
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
    }, [user, loading, navigation]);

    // --- LOADING STATE ---
    if (loading || checkingRole) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text className="mt-4 text-slate-500 font-bold tracking-tight">
                    Verifying Permissions...
                </Text>
            </SafeAreaView>
        );
    }

    // --- RENDER CHILDREN (Replacement for <Outlet />) ---
    // If the user is an admin, we render the screen content.
    // Otherwise, we return null (the useEffect above handles the redirect).
    return isAdmin ? <>{children}</> : null;
}