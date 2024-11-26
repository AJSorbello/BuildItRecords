import React, { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
  colors: {
    primary: string;
    background: string;
    text: string;
    textSecondary: string;
    border: string;
  };
}

const defaultTheme: ThemeContextType = {
  colors: {
    primary: '#1DB954',      // Spotify green
    background: '#121212',   // Dark background
    text: '#FFFFFF',         // White text
    textSecondary: '#B3B3B3', // Gray text
    border: '#282828',       // Dark gray borders
  },
};

const ThemeContext = createContext<ThemeContextType>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={defaultTheme}>
      {children}
    </ThemeContext.Provider>
  );
};
