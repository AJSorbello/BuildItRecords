import React, { createContext, useContext, ReactNode } from 'react';

// Define the shape of our theme colors
interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  shadow: string;
}

// Define the shape of our context value
interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

// Default dark theme colors
const darkColors: ThemeColors = {
  primary: '#1DB954',
  background: '#121212',
  card: '#181818',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.5)',
  border: 'rgba(255, 255, 255, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

// Create the context with undefined initial value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to use the theme context
export const useCustomTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useCustomTheme must be used within a ThemeProvider');
  }
  return context;
};

// Props type for the ThemeProvider component
interface ThemeProviderProps {
  children: ReactNode;
}

// ThemeProvider component class implementation instead of function to avoid hook issues
export class ThemeProvider extends React.Component<ThemeProviderProps, { isDark: boolean }> {
  constructor(props: ThemeProviderProps) {
    super(props);
    this.state = {
      isDark: true // Default to dark theme
    };
    this.toggleTheme = this.toggleTheme.bind(this);
  }

  toggleTheme() {
    this.setState(prevState => ({
      isDark: !prevState.isDark
    }));
  }

  render() {
    // Use fixed dark colors for now
    const colors = darkColors;

    const value = {
      colors,
      isDark: this.state.isDark,
      toggleTheme: this.toggleTheme
    };

    return (
      <ThemeContext.Provider value={value}>
        {this.props.children}
      </ThemeContext.Provider>
    );
  }
}

export default ThemeContext;
