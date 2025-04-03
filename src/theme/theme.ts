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
      default: '#000000',
      paper: '#000000',
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
      [`@media (max-width:768px)`]: {
        fontSize: '2rem',
      },
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,      
      letterSpacing: '-0.01em',
      [`@media (max-width:768px)`]: {
        fontSize: '1.75rem',
      },
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,      
      letterSpacing: '-0.01em',
      [`@media (max-width:768px)`]: {
        fontSize: '1.5rem',
      },
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      [`@media (max-width:768px)`]: {
        fontSize: '1.25rem',
      },
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      [`@media (max-width:768px)`]: {
        fontSize: '1.1rem',
      },
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      [`@media (max-width:768px)`]: {
        fontSize: '1rem',
      },
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
          backgroundColor: '#000000',
          color: '#FFFFFF',
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          WebkitFontSmoothing: 'antialiased', 
          MozOsxFontSmoothing: 'grayscale',
          overflowX: 'hidden', // Prevent horizontal scrolling on mobile
        },
        ':root': {
          '--app-height': '100%',
        },
        '@media (max-width: 768px)': {
          '.container': {
            padding: '0 16px',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        root: {
          '& .MuiDrawer-paper': {
            backgroundColor: '#000000',
            backgroundImage: 'none',
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          },
        },
        paper: {
          backgroundColor: '#000000',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 16px',
          '@media (max-width: 768px)': {
            padding: '10px 14px', // Slightly larger touch targets on mobile
            minWidth: '44px', // Better touch targets
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          '@media (max-width: 768px)': {
            margin: '0 4px', // Add some breathing room on mobile
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: '64px',
          '@media (max-width: 768px)': {
            minHeight: '56px',
          },
        },
        scrollButtons: {
          '&.Mui-disabled': {
            opacity: 0.3,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: '64px',
          padding: '12px 16px',
          fontWeight: 600,
          '@media (max-width: 768px)': {
            minHeight: '56px',
            padding: '10px 12px',
            minWidth: '90px', // Better sizing for mobile tabs
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          '@media (max-width: 768px)': {
            padding: '12px 8px', // Less padding on mobile tables
          },
        },
        head: {
          fontWeight: 700,
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width: 768px)': {
            padding: '0 16px',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          '@media (max-width: 768px)': {
            margin: '16px',
            width: 'calc(100% - 32px)',
            maxHeight: 'calc(100% - 32px)',
          },
        },
      },
    },
  },
  // Add breakpoints for better responsive design
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

// Initialize script to fix mobile viewport height issue
if (typeof document !== 'undefined') {
  // Fix for mobile height (100vh issue on mobile browsers)
  const fixMobileHeight = () => {
    const appHeight = () => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    window.addEventListener('resize', appHeight);
    appHeight();
  };
  
  if (document.readyState === 'complete') {
    fixMobileHeight();
  } else {
    window.addEventListener('load', fixMobileHeight);
  }
}

export default darkTheme;
