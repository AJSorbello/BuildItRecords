"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeProvider = exports.useTheme = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const defaultColors = {
    primary: '#1DB954',
    background: '#121212',
    card: '#181818',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textTertiary: 'rgba(255, 255, 255, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.3)',
};
const ThemeContext = (0, react_1.createContext)(undefined);
const useTheme = () => {
    const context = (0, react_1.useContext)(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
exports.useTheme = useTheme;
const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = (0, react_1.useState)(true); // Default to dark theme
    const toggleTheme = () => {
        setIsDark(!isDark);
    };
    const value = {
        colors: defaultColors,
        isDark,
        toggleTheme,
    };
    return ((0, jsx_runtime_1.jsx)(ThemeContext.Provider, Object.assign({ value: value }, { children: children })));
};
exports.ThemeProvider = ThemeProvider;
exports.default = ThemeContext;
