"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.darkTheme = exports.labelColors = void 0;
const styles_1 = require("@mui/material/styles");
exports.labelColors = {
    records: '#02FF95',
    tech: '#FF0000',
    deep: '#00BFFF',
};
exports.darkTheme = (0, styles_1.createTheme)({
    palette: {
        mode: 'dark',
        primary: {
            main: '#02FF95',
        },
        background: {
            default: '#121212',
            paper: '#1E1E1E',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B3B3B3',
        },
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600,
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#121212',
                    color: '#FFFFFF',
                    margin: 0,
                    padding: 0,
                    minHeight: '100vh',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                root: {
                    minHeight: '64px',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    minHeight: '64px',
                    padding: '12px 16px',
                },
            },
        },
    },
});
exports.default = exports.darkTheme;
