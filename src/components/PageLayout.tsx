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
  padding: '24px 0',
  backgroundColor: '#121212',
  marginTop: 0,
  marginLeft: 0
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
  position: 'fixed',
  top: '64px', // Adjust for TopNavigation height
  left: 0,
  right: 0,
  zIndex: 1200,
});

const ContentWrapper = styled(Box)({
  display: 'flex',
  position: 'relative',
  backgroundColor: '#121212',
  flex: 1,
  '& .MuiDrawer-root': {
    width: '0px',
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: '240px',
      boxSizing: 'border-box',
      backgroundColor: '#000000',
      border: 'none',
      marginTop: '180px'
    }
  }
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
        {children}
      </Main>
    </ContentWrapper>
  );
};

export default PageLayout;