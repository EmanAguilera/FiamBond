"use client";

import { createContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../config/firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";

export const AppContext = createContext();

export default function AppProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Store detailed premium info (start/end dates)
  const [premiumDetails, setPremiumDetails] = useState({
    company: null,
    family: null
  });

  useEffect(() => {
    let unsubscribeFromFirestore = null;

    const unsubscribeFromAuth = onAuthStateChanged(auth, (currentUser) => {
      // If no user is logged in, reset everything immediately
      if (!currentUser) {
        setUser(null);
        setPremiumDetails({ company: null, family: null });
        setLoading(false);
        if (unsubscribeFromFirestore) unsubscribeFromFirestore();
        return;
      }

      // If user exists, listen to their Firestore document
      const userDocRef = doc(db, "users", currentUser.uid);
      unsubscribeFromFirestore = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          
          // Optimization: Prepare these but don't let them block the initial user set if not needed
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

          // SET STATE ALL AT ONCE to prevent multiple re-renders
          setPremiumDetails({ company: companyInfo, family: familyInfo });
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified,
            ...userData
          });
        } else {
          // Fallback if document doesn't exist yet
          setUser({ 
            uid: currentUser.uid, 
            email: currentUser.email, 
            emailVerified: currentUser.emailVerified 
          });
        }
        
        // Finalize loading
        setLoading(false);
      });
    });

    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromFirestore) unsubscribeFromFirestore();
    };
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true); // Set loading while logging out
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
    premiumDetails 
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}