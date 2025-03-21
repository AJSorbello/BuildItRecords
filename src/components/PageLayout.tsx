import React, { useState, useCallback } from 'react';
import { Box, Container, styled, useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import TopNavigation from './TopNavigation';
import DeepSidebar from './DeepSidebar';
import TechSidebar from './TechSidebar';
import RecordsSidebar from './RecordsSidebar';
import ErrorBoundary from './ErrorBoundary';
import { useLocation } from 'react-router-dom';

const ContentWrapper = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  minWidth: 0,
  marginTop: '64px',
  padding: '20px',
});

interface PageLayoutProps {
  children: JSX.Element | JSX.Element[];
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  let location;
  let currentPath = '/';

  try {
    location = useLocation();
    currentPath = location?.pathname || '/';
  } catch (error) {
    console.error('Error accessing location in PageLayout:', error);
  }

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const navigateToPath = (path: string) => {
    try {
      window.location.href = path;
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const getSidebar = useCallback((label: 'records' | 'tech' | 'deep', open: boolean, onClose: () => void, isMobile: boolean) => {
    switch(label) {
      case 'tech':
        return (
          <TechSidebar
            open={open}
            onClose={onClose}
            isMobile={isMobile}
            variant={isMobile ? 'temporary' : 'permanent'}
          />
        );
      case 'deep':
        return (
          <DeepSidebar
            open={open}
            onClose={onClose}
            isMobile={isMobile}
            variant={isMobile ? 'temporary' : 'permanent'}
          />
        );
      default:
        return (
          <RecordsSidebar
            open={open}
            onClose={onClose}
            isMobile={isMobile}
            variant={isMobile ? 'temporary' : 'permanent'}
          />
        );
    }
  }, []);

  // Use pathLabel to determine which route we're on
  let pathLabel: 'records' | 'tech' | 'deep' = 'records';
  try {
    const pathPart = (currentPath.split('/')[1] || '').toLowerCase();
    if (pathPart === 'tech') pathLabel = 'tech';
    else if (pathPart === 'deep') pathLabel = 'deep';
    else pathLabel = 'records';
  } catch (error) {
    console.error('Error parsing path for sidebar:', error);
  }

  return (
    <ErrorBoundary>
      <Box sx={{ 
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: '#121212'
      }}>
        <TopNavigation onMenuClick={handleDrawerToggle} isMobile={isMobile} />
        {getSidebar(pathLabel, mobileOpen, handleDrawerToggle, isMobile)}
        <Box component="main" sx={{ 
          flexGrow: 1, 
          p: {
            xs: 1, 
            sm: 2, 
            md: 3
          },
          ml: {
            md: !isMobile ? 0 : 0
          },
          mt: {
            xs: isMobile ? '64px' : '80px',
            md: isMobile ? '64px' : '180px'
          },
          width: { md: `calc(100% - 240px)` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}>
          {children}
        </Box>
      </Box>
    </ErrorBoundary>
  );
};

export default PageLayout;