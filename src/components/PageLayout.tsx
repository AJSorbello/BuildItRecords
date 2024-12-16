import React, { useState } from 'react';
import { Box, Container, styled, useTheme, useMediaQuery } from '@mui/material';
import TopNavigation from './TopNavigation';
import RecordsSidebar from './RecordsSidebar';
import TechSidebar from './TechSidebar';
import DeepSidebar from './DeepSidebar';

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'isMobile'
})<{ isMobile?: boolean }>(({ isMobile }) => ({
  flexGrow: 1,
  padding: 0,
  backgroundColor: '#121212',
  marginTop: '64px', // Height of TopNavigation
  marginLeft: isMobile ? 0 : '240px',
  width: isMobile ? '100%' : 'calc(100% - 240px)',
  position: 'relative',
  transition: 'margin-left 0.3s ease',
  boxSizing: 'border-box',
  minWidth: 0 // Prevent flex items from growing beyond their container
}));

const ContentWrapper = styled(Box)({
  display: 'flex',
  position: 'relative',
  backgroundColor: '#121212',
  width: '100%',
  minWidth: 0, // Prevent flex items from growing beyond their container
  overflow: 'hidden',
  boxSizing: 'border-box'
});

interface PageLayoutProps {
  children: React.ReactNode;
  label: 'records' | 'tech' | 'deep';
}

const getSidebar = (
  label: 'records' | 'tech' | 'deep',
  open: boolean,
  onClose: () => void,
  isMobile: boolean
) => {
  const drawerVariant = isMobile ? "temporary" as const : "permanent" as const;
  const sidebarProps = {
    variant: drawerVariant,
    open,
    onClose
  };

  switch (label) {
    case 'tech':
      return <TechSidebar {...sidebarProps} />;
    case 'deep':
      return <DeepSidebar {...sidebarProps} />;
    default:
      return <RecordsSidebar {...sidebarProps} />;
  }
};

const PageLayout: React.FC<PageLayoutProps> = ({ children, label }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('xl'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ 
      display: 'flex',
      width: '100%',
      minWidth: 0,
      overflow: 'hidden'
    }}>
      {getSidebar(label, mobileOpen, handleDrawerToggle, isMobile)}
      <Main isMobile={isMobile}>
        {children}
      </Main>
    </Box>
  );
};

export default PageLayout;