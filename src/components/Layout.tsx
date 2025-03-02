import React, { useState } from 'react';
import { Box, CssBaseline, useTheme, useMediaQuery, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useLocation, Outlet } from 'react-router-dom';
import TopNavigation from './TopNavigation';
import DeepSidebar from './DeepSidebar';
import RecordsSidebar from './RecordsSidebar';
import TechSidebar from './TechSidebar';
import LogoHeader from './LogoHeader';

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

const Layout: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const path = location.pathname;
  const pathLabel = (path.split('/')[1] || 'records').toUpperCase();
  const labelMap = {
    'RECORDS': 'buildit-records',
    'TECH': 'buildit-tech',
    'DEEP': 'buildit-deep'
  };
  const currentLabel = pathLabel;
  const labelId = labelMap[pathLabel] || 'buildit-records';
  const isAdminRoute = path.startsWith('/admin');

  console.log('Layout rendered:', { path, currentLabel, labelId, isAdminRoute });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const renderSidebar = () => {
    if (isAdminRoute) return null;

    const sidebarProps = {
      mobileOpen,
      onMobileClose: handleDrawerToggle,
      label: currentLabel.toLowerCase() as 'records' | 'tech' | 'deep'
    };

    switch (currentLabel) {
      case 'TECH':
        return <TechSidebar {...sidebarProps} />;
      case 'DEEP':
        return <DeepSidebar {...sidebarProps} />;
      default:
        return <RecordsSidebar {...sidebarProps} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      
      {!isAdminRoute && (
        <>
          <TopNavigation 
            logo={getLogo(currentLabel)} 
            isMobile={isMobile}
            onMenuClick={handleDrawerToggle}
          />
          {!isMobile && <LogoHeader label={currentLabel} />}
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
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto',
          backgroundColor: '#121212',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export { Layout };
