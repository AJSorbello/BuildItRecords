import { createTheme } from '@mui/material/styles';

export const labelColors = {
  records: '#02FF95',
  tech: '#FF0000',
  deep: '#00BFFF',
};

export const darkTheme = createTheme({
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
    fontWeightRegular: 500, 
    fontWeightMedium: 600,  
    fontWeightBold: 800,    
    fontSize: 16,           
    h1: {
      fontSize: '2.5rem',
      fontWeight: 800,      
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,      
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,      
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontSize: '1.1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    subtitle2: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.95rem',
      fontWeight: 500,
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
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
          WebkitFontSmoothing: 'antialiased', 
          MozOsxFontSmoothing: 'grayscale',   
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
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
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        head: {
          fontWeight: 700,
        },
      },
    },
  },
});

export default darkTheme;
