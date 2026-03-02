'use client';

import React, { createContext, useState, useEffect } from "react";
import { auth } from "../config/firebase-config"; // Verified path from your 'find' output
import { onAuthStateChanged, signOut } from "firebase/auth";

export const AppContext = createContext(null);

export default function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    /**
     * Auth Listener:
     * We wrap the logic in a try/finally to ensure loading 
     * is set to false even if Firebase fails.
     */
    const unsubscribeFromAuth = onAuthStateChanged(auth, (currentUser) => {
      try {
        setUser(currentUser);
      } catch (error) {
        console.error("Auth State Error:", error);
      } finally {
        setLoading(false); // Crucial: This must run to unlock the App
      }
    });

    return () => unsubscribeFromAuth();
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // We no longer return an ActivityIndicator here. 
  // We let App.tsx handle the loading UI so it can sync with font loading.
  return (
    <AppContext.Provider value={{ user, setUser, loading, handleLogout }}>
      {children} 
    </AppContext.Provider>
  );
}