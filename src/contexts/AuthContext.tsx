import React, { createContext, useContext, useState, useEffect } from 'react';
import SpotifyService from '../services/SpotifyService';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const spotifyServiceInstance = SpotifyService.getInstance();
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
    const spotifyServiceInstance = SpotifyService.getInstance();
    try {
      setIsAuthenticated(spotifyServiceInstance.isAuthenticated());
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    const spotifyServiceInstance = SpotifyService.getInstance();
    // Redirect to Spotify login
    window.location.href = spotifyServiceInstance.getLoginUrl();
  };

  const logout = async () => {
    const spotifyServiceInstance = SpotifyService.getInstance();
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
