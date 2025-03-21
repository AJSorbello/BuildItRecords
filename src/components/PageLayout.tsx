import React, { useState, useCallback } from 'react';
import { Box, Container, styled, useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import TopNavigation from './TopNavigation';
import RecordsSidebar from './RecordsSidebar';
import TechSidebar from './TechSidebar';
import DeepSidebar from './DeepSidebar';

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
  children: JSX.Element | JSX.Element[];
  label: 'records' | 'tech' | 'deep';
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, label }) => {
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const getSidebar = useCallback((
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
        transition: theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default PageLayout;