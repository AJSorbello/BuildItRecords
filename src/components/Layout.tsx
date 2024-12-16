import React, { useState } from 'react';
import { Box, CssBaseline, useTheme, useMediaQuery, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useLocation, Outlet } from 'react-router-dom';
import TopNavigation from './TopNavigation';
import DeepSidebar from './DeepSidebar';
import RecordsSidebar from './RecordsSidebar';
import TechSidebar from './TechSidebar';

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

export const Layout: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:900px)');
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const path = location.pathname;
  const currentLabel = (path.split('/')[1] || 'records').toUpperCase();

  console.log('Layout rendered:', { path, currentLabel });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const renderSidebar = () => {
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
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      bgcolor: '#121212', 
      flexDirection: 'column',
      border: 'none'
    }}>
      <CssBaseline />
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: '12px',
            left: '12px',
            zIndex: 1400,
            color: '#FFFFFF'
          }}
        >
          <MenuIcon />
        </IconButton>
      )}
      <TopNavigation />
      <Box sx={{ 
        display: 'flex', 
        flex: 1, 
        marginTop: '0px',
        '& .MuiDrawer-paper': {
          border: 'none'
        }
      }}>
        {renderSidebar()}
        <Box component="main" sx={{ 
          flexGrow: 1, 
          p: 3,
          borderLeft: 'none'
        }}>
          {!isMobile && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '116px', 
              position: 'fixed', 
              top: '64px', 
              left: 0,
              width: '240px',
              zIndex: 1200,
              bgcolor: '#000000'
            }}>
              <img src={getLogo(currentLabel)} alt={`${currentLabel} logo`} style={{ 
                height: '100%', 
                width: 'auto', 
                objectFit: 'contain', 
                filter: 'brightness(0) invert(1)'
              }} />
            </Box>
          )}
          <Box sx={{ marginTop: isMobile ? '0px' : '116px' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
