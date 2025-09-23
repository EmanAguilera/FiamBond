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
        // --- FIX IS HERE #1 ---
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
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
    navigate("/");
  };

  const handleLogout = useCallback(async () => {
    if (token) {
        try {
            // --- FIX IS HERE #2 ---
            await fetch(`${import.meta.env.VITE_API_URL}/api/logout`, {
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

  const contextValue = {
    token,
    user,
    setUser,
    loading,
    handleLogin,
    handleLogout,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {!loading && children}
    </AppContext.Provider>
  );
}