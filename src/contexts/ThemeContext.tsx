import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeColors {
  primary: string;
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
}

const lightColors: ThemeColors = {
  primary: '#FF5722',
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#757575',
  border: '#E0E0E0',
  error: '#FF0000',
  success: '#4CAF50',
};

const darkColors: ThemeColors = {
  primary: '#FF5722',
  background: '#121212',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  border: '#333333',
  error: '#FF5252',
  success: '#69F0AE',
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  colors: darkColors,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    isDark,
    colors: isDark ? darkColors : lightColors,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
