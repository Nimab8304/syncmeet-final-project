import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

// Custom hook for components to consume the auth context easily
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user data from localStorage if token exists on app startup
  useEffect(() => {
    const storedUser = localStorage.getItem('syncmeetUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Login function calls backend service and updates context & localStorage
  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data);
    localStorage.setItem('syncmeetUser', JSON.stringify(data));
  };

  // Register function calls backend service but doesn't update context directly
  const register = async (userData) => {
    return await authService.register(userData);
  };

  // Logout clears user state and localStorage
  const logout = () => {
    setUser(null);
    localStorage.removeItem('syncmeetUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
