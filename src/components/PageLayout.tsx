import React from 'react';
import { Box, Container, styled } from '@mui/material';
import TopNavigation from './TopNavigation';
import RecordsSidebar from './RecordsSidebar';
import TechSidebar from './TechSidebar';
import DeepSidebar from './DeepSidebar';
import BuildItRecordsLogo from '../assets/png/records/BuildItRecords.png';
import BuildItTechLogo from '../assets/png/tech/BuildIt_Tech.png';
import BuildItDeepLogo from '../assets/png/deep/BuildIt_Deep.png';

const Main = styled('main')({
  flexGrow: 1,
  padding: '24px',
  backgroundColor: '#121212',
  minHeight: 'calc(100vh - 180px)',
  marginTop: '180px',
  marginLeft: 240,
  width: 'calc(100% - 240px)',
  position: 'relative',
  top: '64px', // Adjust for TopNavigation height
});

const FullLogo = styled('img')({
  height: '100%',
  width: 'auto',
  objectFit: 'contain',
  filter: 'brightness(0) invert(1)',
  marginLeft: '24px',
});

const LogoHeader = styled(Box)({
  height: '116px',
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#121212',
  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
  position: 'fixed',
  top: '64px', // Adjust for TopNavigation height
  left: 0,
  right: 0,
  zIndex: 1200,
});

const ContentWrapper = styled(Box)({
  display: 'flex',
  minHeight: '100vh',
  position: 'relative',
  backgroundColor: '#121212',
});

interface PageLayoutProps {
  children: React.ReactNode;
  label: 'records' | 'tech' | 'deep';
}

const getLogo = (label: 'records' | 'tech' | 'deep') => {
  switch (label) {
    case 'tech':
      return BuildItTechLogo;
    case 'deep':
      return BuildItDeepLogo;
    default:
      return BuildItRecordsLogo;
  }
};

const getSidebar = (label: 'records' | 'tech' | 'deep') => {
  switch (label) {
    case 'tech':
      return <TechSidebar />;
    case 'deep':
      return <DeepSidebar />;
    default:
      return <RecordsSidebar />;
  }
};

const PageLayout: React.FC<PageLayoutProps> = ({ children, label }) => {
  const logoSrc = getLogo(label);
  return (
    <ContentWrapper>
      {getSidebar(label)}
      <Main>
        <LogoHeader>
          <FullLogo src={logoSrc} alt={`${label} logo`} />
        </LogoHeader>
        <Container maxWidth="lg">
          {children}
        </Container>
      </Main>
    </ContentWrapper>
  );
};

export default PageLayout;
