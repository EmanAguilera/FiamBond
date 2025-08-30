import { createContext, useEffect, useState, useCallback } from "react"; // 1. Import useCallback

// This is a common pattern, you can usually ignore the 'only-export-components' warning
// if you are only exporting a context and its provider.
export const AppContext = createContext();

export default function AppProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  // 2. Wrap the getUser function in useCallback
  const getUser = useCallback(async () => {
    // If there's no token, we can't get a user, so do nothing.
    if (!token) {
      // Ensure user is null if token is removed
      setUser(null);
      return;
    }

    const res = await fetch("/api/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data);
    } else {
      // This handles cases where the token is invalid or expired
      setUser(null);
    }
  }, [token]); // 3. `getUser` will only be recreated when the `token` changes

  useEffect(() => {
    // The effect now depends on the stable `getUser` function
    getUser();
  }, [getUser]); // 4. Add the stable `getUser` function to the dependency array

  return (
    <AppContext.Provider value={{ token, setToken, user, setUser }}>
      {children}
    </AppContext.Provider>
  );
}