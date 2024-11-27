import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { useLocation, Outlet } from 'react-router-dom';
import TopNavigation from './TopNavigation';
import DeepSidebar from './DeepSidebar';
import RecordsSidebar from './RecordsSidebar';
import TechSidebar from './TechSidebar';
import BuildItRecordsLogo from '../assets/png/records/BuildItRecords.png';
import BuildItTechLogo from '../assets/png/tech/BuildIt_Tech.png';
import BuildItDeepLogo from '../assets/png/deep/BuildIt_Deep.png';

const drawerWidth = 240;

export const Layout: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const currentLabel = path.split('/')[1] || 'records';

  console.log('Layout rendered:', { path, currentLabel });

  const getLogo = () => {
    switch (currentLabel) {
      case 'tech':
        return BuildItTechLogo;
      case 'deep':
        return BuildItDeepLogo;
      default:
        return BuildItRecordsLogo;
    }
  };

  const renderSidebar = () => {
    switch (currentLabel) {
      case 'tech':
        return <TechSidebar />;
      case 'deep':
        return <DeepSidebar />;
      default:
        return <RecordsSidebar />;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#121212' }}>
      <CssBaseline />
      <TopNavigation />
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 64,
          left: 0,
          right: 0,
          height: '116px',
          display: 'flex',
          alignItems: 'center',
          bgcolor: '#121212',
          zIndex: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          pl: 3,
        }}
      >
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img
            src={getLogo()}
            alt="Logo"
            style={{
              height: '100%',
              width: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
            }}
          />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flex: 1, marginTop: '180px' }}>
        {renderSidebar()}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            bgcolor: '#121212',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
