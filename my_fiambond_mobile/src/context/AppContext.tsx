'use client';

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "../config/firebase-config"; 
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// 1. Define the shape of the Context data
interface AppContextType {
  user: any | null;
  setUser: React.Dispatch<React.SetStateAction<any | null>>;
  loading: boolean;
  handleLogout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

// 2. Define the Props for the Provider
interface AppProviderProps {
  children: ReactNode;
}

// 3. Initialize Context with the correct type (not just null)
export const AppContext = createContext<AppContextType | null>(null);

export default function AppProvider({ children }: AppProviderProps) {
  // Use <any> to allow merging Firebase Auth and Firestore data
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to manually refresh user data (used in dashboard for upgrades)
  const refreshUserData = async () => {
    if (!auth.currentUser) return;
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUser({ ...auth.currentUser, ...userDocSnap.data() });
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  useEffect(() => {
    const unsubscribeFromAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // --- FIX: Fetch Firestore data so 'role' and 'names' aren't undefined ---
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            // Merge Auth data with Firestore data (role, first_name, last_name, etc.)
            setUser({ ...firebaseUser, ...userDocSnap.data() });
          } else {
            // Fallback if no Firestore doc exists yet
            setUser(firebaseUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth/Firestore Sync Error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribeFromAuth();
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{ user, setUser, loading, handleLogout, refreshUserData }}>
      {children}
    </AppContext.Provider>
  );
}