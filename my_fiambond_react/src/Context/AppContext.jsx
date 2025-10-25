import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../config/firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore"; // Import onSnapshot

// Export the context itself for components that need to consume it.
export const AppContext = createContext();

// Export the provider component as the default export.
export default function AppProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFromFirestore = null;

    const unsubscribeFromAuth = onAuthStateChanged(auth, (currentUser) => {
      // If a user is logged in
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);

        // Start listening for real-time updates to the user's document
        unsubscribeFromFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            // If the document exists, combine auth data with Firestore data
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              emailVerified: currentUser.emailVerified,
              ...docSnap.data() // This includes full_name, etc.
            });
          } else {
            // If the document doesn't exist yet (e.g., right after signup),
            // set the user with only the basic auth info.
            // The listener will automatically update this when the doc is created.
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              emailVerified: currentUser.emailVerified
            });
          }
          setLoading(false);
        });
      } else {
        // User is logged out
        setUser(null);
        setLoading(false);
        // If there was a Firestore listener, clean it up
        if (unsubscribeFromFirestore) {
          unsubscribeFromFirestore();
        }
      }
    });

    // Main cleanup function: Unsubscribe from both auth and Firestore listeners
    // when the AppProvider component unmounts.
    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener above will automatically handle setting
      // the user to null. The navigation below ensures they are redirected.
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
  };

  return (
    <AppContext.Provider value={contextValue}>
      {!loading && children}
    </AppContext.Provider>
  );
}