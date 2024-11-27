import React, { createContext, useContext, useState, useEffect } from 'react';
import spotifyService from '../services/spotifyService';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Replace React Native AsyncStorage with localStorage
const storage = {
  getItem: async (key: string) => {
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    localStorage.removeItem(key);
  },
  multiRemove: async (keys: string[]) => {
    keys.forEach(key => localStorage.removeItem(key));
  }
};

const spotifyServiceInstance = spotifyService;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    // Check for Spotify redirect callback
    const hash = window.location.hash;
    if (hash) {
      const success = spotifyServiceInstance.handleRedirect(hash.substring(1));
      if (success) {
        setIsAuthenticated(true);
        // Clean up the URL
        window.location.hash = '';
      }
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsAuthenticated(spotifyServiceInstance.isAuthenticated());
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // Redirect to Spotify login
    window.location.href = spotifyServiceInstance.getLoginUrl();
  };

  const logout = async () => {
    try {
      spotifyServiceInstance.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
