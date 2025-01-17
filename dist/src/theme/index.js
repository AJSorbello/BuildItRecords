"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const styles_1 = require("@mui/material/styles");
const theme = (0, styles_1.createTheme)({
    palette: {
        mode: 'dark',
        primary: {
            main: '#1DB954',
            light: '#1ed760',
            dark: '#1aa34a',
            contrastText: '#ffffff'
        },
        secondary: {
            main: '#535353',
            light: '#636363',
            dark: '#404040',
            contrastText: '#ffffff'
        },
        background: {
            default: '#121212',
            paper: '#181818'
        },
        text: {
            primary: '#ffffff',
            secondary: '#b3b3b3'
        }
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
        h1: {
            fontSize: '2.5rem',
            fontWeight: 700,
            letterSpacing: '-0.01562em'
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600,
            letterSpacing: '-0.00833em'
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            letterSpacing: '0em'
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
            letterSpacing: '0.00735em'
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
            letterSpacing: '0em'
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 500,
            letterSpacing: '0.0075em'
        },
        subtitle1: {
            fontSize: '1rem',
            fontWeight: 400,
            letterSpacing: '0.00938em'
        },
        subtitle2: {
            fontSize: '0.875rem',
            fontWeight: 500,
            letterSpacing: '0.00714em'
        },
        body1: {
            fontSize: '1rem',
            fontWeight: 400,
            letterSpacing: '0.00938em'
        },
        body2: {
            fontSize: '0.875rem',
            fontWeight: 400,
            letterSpacing: '0.01071em'
        },
        button: {
            fontSize: '0.875rem',
            fontWeight: 500,
            letterSpacing: '0.02857em',
            textTransform: 'none'
        },
        caption: {
            fontSize: '0.75rem',
            fontWeight: 400,
            letterSpacing: '0.03333em'
        },
        overline: {
            fontSize: '0.75rem',
            fontWeight: 400,
            letterSpacing: '0.08333em',
            textTransform: 'uppercase'
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 500,
                    textTransform: 'none',
                    fontWeight: 700,
                    padding: '6px 32px'
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    backgroundColor: '#181818'
                }
            }
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    '&:last-child': {
                        paddingBottom: 16
                    }
                }
            }
        }
    }
});
exports.default = theme;
