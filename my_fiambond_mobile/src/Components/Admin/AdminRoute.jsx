import React, { useContext, useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
// Import the necessary Firestore functions for React Native
import { doc, getDoc } from "firebase/firestore"; 

// NOTE: You must replace these imports with your actual project structure and Native equivalents
// Assuming AppContext, db, and config are correctly set up
import { AppContext } from "../../Context/AppContext"; 
import { db } from "../../config/firebase-config"; 

// The component takes the screens to render as props
export default function AdminRoute({ AdminComponent, FallbackComponent }) {
    const { user, loading } = useContext(AppContext);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingRole, setCheckingRole] = useState(true);

    useEffect(() => {
        const checkAdminRole = async () => {
            if (user && user.uid) {
                try {
                    // Check if the user document exists and has the 'admin' role
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists() && userDoc.data().role === "admin") {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                    }
                } catch (error) {
                    console.error("Error verifying admin:", error);
                    setIsAdmin(false); // Fallback on error
                }
            } else {
                setIsAdmin(false);
            }
            setCheckingRole(false);
        };

        if (!loading) {
            checkAdminRole();
        }
        
        // Reset state when loading is true (e.g., waiting for user to load after log out)
        if (loading) {
            setIsAdmin(false);
            setCheckingRole(true);
        }
        
        // Clean up any effects if the component unmounts quickly
        return () => {
             setIsAdmin(false);
             setCheckingRole(true);
        };
        
    }, [user, loading]);


    // --- RENDERING LOGIC ---

    if (loading || checkingRole) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>Verifying Permissions...</Text>
            </View>
        );
    }

    // Render the appropriate component based on admin status
    return isAdmin ? <AdminComponent /> : <FallbackComponent />;
}

// --- STYLESHEET ---
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#475569',
    },
});