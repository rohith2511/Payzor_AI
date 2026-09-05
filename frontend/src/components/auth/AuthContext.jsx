import React, { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate active token on initial app load
  useEffect(() => {
    async function initAuth() {
      const savedToken = localStorage.getItem('payzor_token');
      if (savedToken) {
        try {
          setToken(savedToken);
          const userData = await authApi.me();
          setUser(userData);
        } catch (error) {
          console.error("Session token validation failed:", error);
          localStorage.removeItem('payzor_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('payzor_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      const errMsg = error.response?.data?.detail || "Invalid email or password.";
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, org, email, password) => {
    setLoading(true);
    try {
      const data = await authApi.signup(name, org, email, password);
      localStorage.setItem('payzor_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error("Signup failed:", error);
      const errMsg = error.response?.data?.detail || "An account with this email already exists. Please sign in instead.";
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('payzor_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = async (userData) => {
    try {
      const updatedUser = await authApi.update(userData);
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error("Failed to update user:", error);
      const errMsg = error.response?.data?.detail || "Failed to save settings.";
      return { success: false, error: errMsg };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
