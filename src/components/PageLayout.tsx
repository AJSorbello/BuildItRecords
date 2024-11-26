import React from 'react';
import { Box, Container, styled } from '@mui/material';
import TopNavigation from './TopNavigation';
import Sidebar from './Sidebar';
import BuildItRecordsLogo from '../assets/png/records/BuildItRecords.png';
import BuildItTechLogo from '../assets/png/tech/BuildIt_Tech.png';
import BuildItDeepLogo from '../assets/png/deep/BuildIt_Deep.png';

const drawerWidth = 240;

const Main = styled('main')({
  flexGrow: 1,
  padding: '24px',
  backgroundColor: '#121212',
  minHeight: 'calc(100vh - 180px)', 
  marginLeft: drawerWidth,
  marginTop: '180px', 
  width: `calc(100% - ${drawerWidth}px)`,
});

const FullLogo = styled('img')({
  height: '100px',
  marginLeft: '24px',
  filter: 'brightness(0) invert(1)',
});

const LogoHeader = styled(Box)({
  height: '116px',
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#121212',
  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
  position: 'fixed',
  top: '64px', 
  left: 0,
  right: 0,
  zIndex: 1200,
});

const ContentWrapper = styled(Box)({
  display: 'flex',
  minHeight: '100vh',
  marginTop: '180px', 
  position: 'relative',
});

interface PageLayoutProps {
  children: React.ReactNode;
  label: 'records' | 'tech' | 'deep';
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, label }) => {
  const getLogo = () => {
    switch (label) {
      case 'tech':
        return BuildItTechLogo;
      case 'deep':
        return BuildItDeepLogo;
      default:
        return BuildItRecordsLogo;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopNavigation />
      <LogoHeader>
        <FullLogo src={getLogo()} alt={`Build It ${label} Logo`} />
      </LogoHeader>
      <ContentWrapper>
        <Sidebar label={label} />
        <Main>
          <Container maxWidth="lg">
            {children}
          </Container>
        </Main>
      </ContentWrapper>
    </Box>
  );
};

export default PageLayout;
