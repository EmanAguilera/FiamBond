import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";

export const AppContext = createContext();

export default function AppProvider({ children }) {
  const navigate = useNavigate();
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
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);

        unsubscribeFromFirestore = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            
            // --- SYNC PREMIUM DETAILS ---
            let companyInfo = null;
            let familyInfo = null;

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

            setPremiumDetails({ company: companyInfo, family: familyInfo });

            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              emailVerified: currentUser.emailVerified,
              ...userData
            });
          } else {
            setUser({ uid: currentUser.uid, email: currentUser.email, emailVerified: currentUser.emailVerified });
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setPremiumDetails({ company: null, family: null });
        setLoading(false);
        if (unsubscribeFromFirestore) unsubscribeFromFirestore();
      }
    });

    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromFirestore) unsubscribeFromFirestore();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const contextValue = {
    user,
    setUser,
    loading,
    handleLogout,
    premiumDetails // Global access to dates
  };

  return (
    <AppContext.Provider value={contextValue}>
      {!loading && children}
    </AppContext.Provider>
  );
}