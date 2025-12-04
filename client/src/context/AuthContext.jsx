import { createContext, useContext, useState, useEffect, useRef } from "react";
import { authAPI, userAPI } from "../services/api";
import Cookie from "js-cookie";

const AuthContext = createContext();

// Heartbeat interval (every 30 seconds)
const HEARTBEAT_INTERVAL = 30000;

// Session key for tracking active session
const SESSION_KEY = "crm_active_session";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const heartbeatRef = useRef(null);

  // Clear all auth data helper
  const clearAuthData = () => {
    setIsAuthenticated(false);
    setUser(null);
    Cookie.remove("token");
    Cookie.remove("userId");
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.clear();
  };

  // Heartbeat to keep user marked as online
  useEffect(() => {
    if (isAuthenticated) {
      // Send initial heartbeat
      userAPI.heartbeat().catch(() => {});

      // Set up interval for periodic heartbeats
      heartbeatRef.current = setInterval(() => {
        userAPI.heartbeat().catch(() => {});
      }, HEARTBEAT_INTERVAL);
    }

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [isAuthenticated]);

  // Handle browser/tab close - logout user
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Mark session as closing
      sessionStorage.setItem("session_closing", "true");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check if user wants to force logout via query parameter
      const params = new URLSearchParams(window.location.search);
      if (params.get("logout") === "true") {
        clearAuthData();
        // Remove the logout query param from URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        setLoading(false);
        return;
      }

      // Check if this is a new browser session (no active session marker)
      const hasActiveSession = sessionStorage.getItem(SESSION_KEY);
      if (!hasActiveSession) {
        // This is a new browser session - clear any old auth data
        clearAuthData();
        setLoading(false);
        return;
      }

      try {
        // Fetch auth and user data in parallel for faster page load
        const userId = Cookie.get("userId");
        const requests = [authAPI.isAuthenticated()];

        // Add user data request if userId is available
        if (userId) {
          requests.push(userAPI.getUserData(userId));
        }

        // Run both requests in parallel
        const responses = await Promise.all(requests);
        const authResponse = responses[0];
        const userResponse = userId ? responses[1] : null;

        if (authResponse.data.success) {
          setIsAuthenticated(true);
          // Handle user data if available
          if (userResponse && userResponse.data.success) {
            setUser(userResponse.data.userData);
          }
        } else {
          // Auth check failed - ensure user is logged out
          clearAuthData();
        }
      } catch (error) {
        // Error during auth check - ensure user is logged out
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.data.success) {
        setIsAuthenticated(true);
        // Set session marker to track active session
        sessionStorage.setItem(SESSION_KEY, "true");
        // Store userId and fetch user data
        if (response.data.userId) {
          Cookie.set("userId", response.data.userId, { expires: 7 });
          const userData = await userAPI.getUserData(response.data.userId);
          if (userData.data.success) {
            setUser(userData.data.userData);
          }
        }
        // Return full response including role and isAdmin
        return {
          success: true,
          role: response.data.role,
          isAdmin: response.data.isAdmin,
          userId: response.data.userId,
        };
      }
      throw new Error(response.data.message);
    } catch (error) {
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register({ name, email, password });
      if (response.data.success) {
        // User is logged in after registration (token cookie is set by backend)
        setIsAuthenticated(true);
        // Set session marker to track active session
        sessionStorage.setItem(SESSION_KEY, "true");
        if (response.data.userId) {
          Cookie.set("userId", response.data.userId, { expires: 7 });
        }
        return response.data;
      }
      throw new Error(response.data.message);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear state and cookies, even if API call fails
      clearAuthData();
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        setIsAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
