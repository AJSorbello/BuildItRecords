import React, { useState } from 'react';
import { Box, CssBaseline, useMediaQuery, IconButton } from '@mui/material';
import { Theme, useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import { useLocation, Outlet, Location } from 'react-router-dom';
import TopNavigation from './TopNavigation';
import DeepSidebar from './DeepSidebar';
import RecordsSidebar from './RecordsSidebar';
import TechSidebar from './TechSidebar';
import LogoHeader from './LogoHeader';
import ErrorBoundary from './ErrorBoundary';

import BuildItRecordsLogo from '../assets/png/records/BuildItRecords.png';
import BuildItTechLogo from '../assets/png/tech/BuildIt_Tech.png';
import BuildItDeepLogo from '../assets/png/deep/BuildIt_Deep.png';

const getLogo = (label: string) => {
  switch (label.toUpperCase()) {
    case 'TECH':
      return BuildItTechLogo;
    case 'DEEP':
      return BuildItDeepLogo;
    default:
      return BuildItRecordsLogo;
  }
};

// Wrapper component to get location and media query
const LayoutWrapper = () => {
  try {
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    return (
      <ErrorBoundary>
        <LayoutFC location={location} isMobile={isMobile} />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error in LayoutWrapper:', error);
    // Fallback to a basic layout if location hooks fail
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    return (
      <ErrorBoundary>
        <LayoutFC location={{ pathname: '/' }} isMobile={isMobile} />
      </ErrorBoundary>
    );
  }
};

interface LayoutProps {
  location: Location;
  isMobile: boolean;
}

// Convert to functional component
const LayoutFC: React.FC<LayoutProps> = ({ location, isMobile }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = (path: string) => {
    try {
      window.location.href = path;
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(prevState => !prevState);
  };

  const renderSidebar = () => {
    try {
      const path = location?.pathname || '/';
      const pathLabel = (path.split('/')[1] || 'records').toUpperCase();
      const isAdminRoute = path.startsWith('/admin');

      if (isAdminRoute) return null;

      switch (pathLabel) {
        case 'TECH':
          return (
            <TechSidebar
              mobileOpen={mobileOpen}
              onMobileClose={handleDrawerToggle}
              isMobile={isMobile}
            />
          );
        case 'DEEP':
          return (
            <DeepSidebar
              mobileOpen={mobileOpen}
              onMobileClose={handleDrawerToggle}
              isMobile={isMobile}
            />
          );
        default:
          return (
            <RecordsSidebar
              mobileOpen={mobileOpen}
              onMobileClose={handleDrawerToggle}
              label="records"
            />
          );
      }
    } catch (error) {
      console.error('Error rendering sidebar:', error);
      return <RecordsSidebar mobileOpen={mobileOpen} onMobileClose={handleDrawerToggle} />;
    }
  };

  let path = '/';
  let pathLabel = 'RECORDS';
  let labelId = 'buildit-records';
  let isAdminRoute = false;
  
  try {
    path = location?.pathname || '/';
    pathLabel = (path.split('/')[1] || 'records').toUpperCase();
    const labelMap = {
      'RECORDS': 'buildit-records',
      'TECH': 'buildit-tech',
      'DEEP': 'buildit-deep'
    };
    labelId = labelMap[pathLabel as keyof typeof labelMap] || 'buildit-records';
    isAdminRoute = path.startsWith('/admin');
  } catch (error) {
    console.error('Error parsing path:', error);
  }

  // Logging outside the render phase using setTimeout to avoid warnings
  if (process.env.NODE_ENV === 'development') {
    // Using setTimeout with 0 delay to move the console.log outside the render phase
    setTimeout(() => {
      console.log('Layout rendered:', { path, pathLabel, labelId, isAdminRoute, isMobile });
    }, 0);
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      
      {!isAdminRoute && (
        <>
          <TopNavigation 
            logo={getLogo(pathLabel)} 
            isMobile={isMobile}
            onMenuClick={handleDrawerToggle}
          />
          {!isMobile && <LogoHeader label={pathLabel} />}
          {renderSidebar()}
        </>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { xs: '100%' },
          marginLeft: { 
            xs: 0,
            md: '240px' // Drawer width
          },
          marginTop: '64px', // Height of TopNavigation
          paddingTop: { xs: '16px', md: '0' },
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto',
          backgroundColor: '#000000',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export { LayoutWrapper as Layout };
