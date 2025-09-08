import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

export default function AppProvider({ children }) {
  const navigate = useNavigate();

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      async function fetchUser() {
        const res = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json', // Good practice to include
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          console.error("Token is invalid. Clearing session.");
          setUser(null);
          setToken(null);
          localStorage.removeItem("token");
        }
        setLoading(false);
      }
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    localStorage.setItem("token", userToken);
    setToken(userToken);
    navigate("/"); // Redirect to dashboard after login
  };

  const handleLogout = useCallback(async () => {
    if (token) {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });
        } catch (error) {
            console.error("Logout API call failed, but proceeding with client-side logout.", error);
        }
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    navigate("/login");
  }, [token, navigate]);

  // --- START OF FIX ---
  // The context value now includes `setUser`. This allows any child
  // component to update the application's global user state.
  const contextValue = {
    token,
    user,
    setUser, // <-- EXPOSE THE SETTER FUNCTION
    loading,
    handleLogin,
    handleLogout,
  };
  // --- END OF FIX ---

  return (
    <AppContext.Provider value={contextValue}>
      {!loading && children}
    </AppContext.Provider>
  );
}