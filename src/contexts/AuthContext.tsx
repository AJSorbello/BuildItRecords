import React, { createContext, useContext, useState, useEffect } from 'react';
import { spotifyService } from '../services/SpotifyService';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => void;
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

  useEffect(() => {
    const initAuth = async () => {
      const isAuthed = await spotifyService.init();
      setIsAuthenticated(isAuthed);
    };

    initAuth();
  }, []);

  const login = async () => {
    try {
      const loginUrl = await spotifyService.getLoginUrl();
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    login,
    logout,
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
