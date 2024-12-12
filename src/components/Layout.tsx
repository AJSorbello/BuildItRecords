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
  const path = location.pathname;
  const currentLabel = (path.split('/')[1] || 'records').toUpperCase();

  console.log('Layout rendered:', { path, currentLabel });

  const renderSidebar = () => {
    switch (currentLabel) {
      case 'TECH':
        return <TechSidebar />;
      case 'DEEP':
        return <DeepSidebar />;
      default:
        return <RecordsSidebar />;
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
      <TopNavigation />
      <Box sx={{ 
        display: 'flex', 
        flex: 1, 
        marginTop: '64px',
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
          <Box sx={{ marginTop: '116px' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
