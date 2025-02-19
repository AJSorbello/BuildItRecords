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
  const isMobile = useMediaQuery('(max-width:900px)');
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

    const drawerVariant = isMobile ? "temporary" as const : "permanent" as const;
    const sidebarProps = {
      variant: drawerVariant,
      open: isMobile ? mobileOpen : true,
      onClose: handleDrawerToggle
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
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                position: 'fixed',
                top: '1rem',
                left: '1rem',
                zIndex: theme.zIndex.drawer + 2,
                display: { sm: 'none' }
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <TopNavigation logo={getLogo(currentLabel)} />
          {!isMobile && <LogoHeader label={currentLabel} />}
          {renderSidebar()}
        </>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          minHeight: '100vh',
          bgcolor: 'background.default',
          ...(isAdminRoute ? {
            p: 3
          } : {
            width: { sm: `calc(100% - ${240}px)` },
            ml: { sm: `${240}px` },
            mt: '64px'
          })
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export { Layout };
