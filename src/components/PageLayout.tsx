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
  padding: '24px 0',
  backgroundColor: '#121212',
  marginTop: 0,
  marginLeft: isMobile ? 0 : '240px',
  width: isMobile ? '100%' : `calc(100% - 240px)`,
  transition: 'margin-left 0.3s ease, width 0.3s ease',
  maxWidth: isMobile ? '100%' : `calc(100% - 240px)`,
  boxSizing: 'border-box'
}));

const ContentWrapper = styled(Box)({
  display: 'flex',
  position: 'relative',
  backgroundColor: '#121212',
  flex: 1,
  width: '100%',
  overflow: 'hidden',
  maxWidth: '100vw',
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
    <ContentWrapper>
      {getSidebar(label, mobileOpen, handleDrawerToggle, isMobile)}
      <Main isMobile={isMobile}>
        {children}
      </Main>
    </ContentWrapper>
  );
};

export default PageLayout;