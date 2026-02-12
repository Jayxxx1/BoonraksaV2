import { useState, useEffect } from "react";
import api from "../api/config";
import { AuthContext } from "./auth-store";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading] = useState(false);

  const login = async (username, password) => {
    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      const { token: newToken, data } = response.data;

      // Save to state
      setToken(newToken);
      setUser(data.user);

      // Persist to localStorage
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "เข้าสู่ระบบล้มเหลว",
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("lastActivity");
  };

  // 2h Session Timeout Logic
  useEffect(() => {
    if (!token) return;

    const TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 Hours

    const checkTimeout = () => {
      const lastActivity = localStorage.getItem("lastActivity");
      if (lastActivity) {
        const inactiveTime = Date.now() - parseInt(lastActivity);
        if (inactiveTime > TIMEOUT_MS) {
          logout();
          alert("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
        }
      }
    };

    const updateActivity = () => {
      localStorage.setItem("lastActivity", Date.now().toString());
    };

    // Initial set
    updateActivity();

    // Listeners
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => window.addEventListener(event, updateActivity));

    // Check every minute
    const interval = setInterval(checkTimeout, 60000);

    // 🆕 Listen for interceptor-triggered logout
    const handleForceLogout = () => {
      logout();
    };
    window.addEventListener("auth:logout", handleForceLogout);

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, updateActivity),
      );
      window.removeEventListener("auth:logout", handleForceLogout);
      clearInterval(interval);
    };
  }, [token]);

  const updateRole = (newRole) => {
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
    updateRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
