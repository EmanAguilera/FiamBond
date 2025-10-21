// Context/AppContext.jsx

import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase-config"; // Make sure the path is correct
import { onAuthStateChanged, signOut } from "firebase/auth";

export const AppContext = createContext();

export default function AppProvider({ children }) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Keep loading state

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // You can navigate to the login page after logout if you want
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