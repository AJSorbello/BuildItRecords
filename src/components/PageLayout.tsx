import React from 'react';
import { Box, Container, styled } from '@mui/material';
import TopNavigation from './TopNavigation';
import RecordsSidebar from './RecordsSidebar';
import TechSidebar from './TechSidebar';
import DeepSidebar from './DeepSidebar';

const Main = styled('main')({
  flexGrow: 1,
  padding: '24px 0',
  backgroundColor: '#121212',
  marginTop: 0,
  marginLeft: 0
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
  return (
    <ContentWrapper>
      {getSidebar(label)}
      <Main>
        {children}
      </Main>
    </ContentWrapper>
  );
};

export default PageLayout;