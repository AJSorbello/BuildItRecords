import React, { useState, useCallback, ReactNode } from 'react';
import { Box, Container, styled, useMediaQuery } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import TopNavigation from './TopNavigation';
import RecordsSidebar from './RecordsSidebar';
import TechSidebar from './TechSidebar';
import DeepSidebar from './DeepSidebar';

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'isMobile'
})<{ isMobile?: boolean }>(({ isMobile, theme }) => ({
  display: 'block',
  flexGrow: 1,
  padding: 0,
  backgroundColor: '#121212',
  marginTop: '64px', // Height of TopNavigation
  marginLeft: 0,
  width: '100%',
  position: 'relative',
  transition: 'all 0.3s ease',
  boxSizing: 'border-box',
  minWidth: 0,
  [theme.breakpoints.up('md')]: {
    width: `calc(100% - ${isMobile ? 0 : 240}px)`,
  },
  '& .MuiContainer-root': {
    padding: isMobile ? '16px' : 0
  }
}));

const ContentWrapper = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
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

const PageLayout: React.FC<PageLayoutProps> = ({ children, label }) => {
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = React.useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const getSidebar = React.useCallback((
    label: 'records' | 'tech' | 'deep',
    open: boolean,
    onClose: () => void,
    isMobile: boolean
  ) => {
    const drawerVariant = isMobile ? "temporary" : "permanent";
    const sidebarProps = {
      variant: drawerVariant as "temporary" | "permanent",
      open: isMobile ? open : true,
      onClose,
      sx: {
        display: { xs: 'block', md: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: 240,
        },
      }
    };

    switch (label) {
      case 'tech':
        return <TechSidebar {...sidebarProps} />;
      case 'deep':
        return <DeepSidebar {...sidebarProps} />;
      default:
        return <RecordsSidebar {...sidebarProps} />;
    }
  }, []);

  return (
    <Box sx={{ 
      display: 'flex',
      width: '100%',
      minWidth: 0,
      overflow: 'hidden',
      backgroundColor: '#121212'
    }}>
      <TopNavigation onMenuClick={handleDrawerToggle} isMobile={isMobile} />
      {getSidebar(label, mobileOpen, handleDrawerToggle, isMobile)}
      <Main isMobile={isMobile} theme={theme}>
        {children}
      </Main>
    </Box>
  );
};

export default PageLayout;