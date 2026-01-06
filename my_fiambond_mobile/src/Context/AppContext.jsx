import { createContext, useState, useEffect } from "react";
import { View, ActivityIndicator, Text } from 'react-native'; 
import { auth } from "../config/firebase-config"; // Only need 'auth' for this test
import { onAuthStateChanged, signOut } from "firebase/auth";
// REMOVED: Firestore imports (doc, onSnapshot, getDoc)

export const AppContext = createContext(null);

export default function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    // Only listen for Auth state (NO Firestore fetching)
    const unsubscribeFromAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // <--- Set loading to false immediately after checking user
    });

    return () => unsubscribeFromAuth();
  }, []);

  const handleLogout = async () => { /* ... */ };

  if (loading) {
      // FIX: Explicitly return a valid component while loading is TRUE
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={{ marginTop: 10 }}>Initializing App...</Text>
        </View>
      );
  }

  return (
    <AppContext.Provider value={{ user, setUser, loading, handleLogout }}>
      {children} 
    </AppContext.Provider>
  );
}