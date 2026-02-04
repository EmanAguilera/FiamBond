// AppContext.jsx

"use client";

import { createContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../config/firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";

export const AppContext = createContext();

export default function AppProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [premiumDetails, setPremiumDetails] = useState({
    company: null,
    family: null
  });

  // ⭐️ FIX: Function to fetch and update user/premium data
  const fetchAndSetUserData = useCallback(async (currentUser, docSnap) => {
    if (!currentUser) {
        setUser(null);
        setPremiumDetails({ company: null, family: null });
        setLoading(false);
        return;
    }
    
    let userData = docSnap?.exists() ? docSnap.data() : {};
    let companyInfo = null;
    let familyInfo = null;

    try {
        // Fetch Company Premium Dates if ID exists
        if (userData.active_company_premium_id) {
            const compSnap = await getDoc(doc(db, "premiums", userData.active_company_premium_id));
            if (compSnap.exists()) companyInfo = compSnap.data();
        }

        // Fetch Family Premium Dates if ID exists
        if (userData.active_family_premium_id) {
            const famSnap = await getDoc(doc(db, "premiums", userData.active_family_premium_id));
            if (famSnap.exists()) familyInfo = famSnap.data();
        }
    } catch (err) {
        console.error("Error fetching premium details:", err);
    }

    // SET STATE ALL AT ONCE
    setPremiumDetails({ company: companyInfo, family: familyInfo });
    setUser({
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified,
        ...userData
    });
    setLoading(false);
  }, []);

  // ⭐️ FIX: Manual refresh function exposed to other components
  const refreshUserData = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    setLoading(true); // Indicate loading start
    
    // Manually fetch the user document to get the latest status
    const docSnap = await getDoc(doc(db, "users", currentUser.uid));
    await fetchAndSetUserData(currentUser, docSnap);
    
  }, [fetchAndSetUserData]);

  useEffect(() => {
    let unsubscribeFromFirestore = null;

    const unsubscribeFromAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        // Clean up on log out
        fetchAndSetUserData(null, null);
        if (unsubscribeFromFirestore) unsubscribeFromFirestore();
        return;
      }

      const userDocRef = doc(db, "users", currentUser.uid);
      
      // Use onSnapshot to automatically trigger a refresh when the document changes
      // NOTE: We wrap the async logic (getDoc) inside the listener, which can cause
      // brief inconsistency, but is the closest to real-time for simple cases.
      unsubscribeFromFirestore = onSnapshot(userDocRef, (docSnap) => {
        // Use the fetched data and trigger the full async fetch and set process
        fetchAndSetUserData(currentUser, docSnap);
      });
    });

    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromFirestore) unsubscribeFromFirestore();
    };
  }, [fetchAndSetUserData]);

  const handleLogout = async () => {
    try {
      setLoading(true); 
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const contextValue = {
    user,
    setUser,
    loading,
    handleLogout,
    premiumDetails,
    refreshUserData // ⭐️ EXPOSED
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}