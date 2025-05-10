import React, { createContext, useState, useContext, useEffect } from "react";
import { authService } from "../services";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error("Error loading user:", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.login(username, password);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      console.log("Login error:", err);
      setError(err.message || "Authentication failed");
      return { success: false, error: err.message || "Authentication failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const response = await authService.refreshUserData();
        if (response.success) {
          await authService.updateStoredUser(response.user);
          setUser(response.user);
        }
      }
    } catch (err) {
      console.error("Error refreshing user data:", err);
    }
  };

  const isAuthenticated = async () => {
    return await authService.isAuthenticated();
  };

  const contextValue = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
