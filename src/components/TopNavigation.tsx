import React from 'react';
import { AppBar, Tabs, Tab, Box, styled, useMediaQuery, useTheme } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import RecordsSquareLogo from '../assets/png/records/BuildIt_Records_Square.png';
import TechSquareLogo from '../assets/png/tech/BuildIt_Tech_Square.png';
import DeepSquareLogo from '../assets/png/deep/BuildIt_Deep_Square.png';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.5) 100%)',
  boxShadow: 'none',
  borderBottom: 'none',
  height: '64px',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1300,
  display: 'flex',
  alignItems: 'center',
  '& .MuiToolbar-root': {
    background: 'transparent'
  }
}));

const StyledTabs = styled(Tabs)({
  width: '100%',
  height: '64px',
  backgroundColor: 'transparent',
  '& .MuiTabs-indicator': {
    backgroundColor: '#02FF95',
  },
  '& .MuiTabs-flexContainer': {
    justifyContent: 'space-between',
    height: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});

const StyledTab = styled(Tab)<{ tabtype: string }>(({ tabtype }) => ({
  flex: 1,
  maxWidth: 'none',
  color: '#FFFFFF',
  height: '64px',
  padding: 0,
  textTransform: 'none',
  fontSize: '14px',
  fontWeight: 500,
  '&.Mui-selected': {
    color: '#FFFFFF',
  },
  '&:hover': {
    color: tabtype === 'records' ? '#02FF95' : 
           tabtype === 'tech' ? '#FF0000' : 
           '#00BFFF',
    opacity: 1,
  },
}));

const Logo = styled('img')<{ tabtype: string }>(({ tabtype }) => ({
  width: '32px',
  height: '32px',
  filter: 'brightness(0) invert(1)',
  transition: 'all 0.3s ease',
  '.MuiTab-root:hover &': {
    filter: tabtype === 'records' ? 'brightness(0) invert(0.9) sepia(1) saturate(5) hue-rotate(70deg)' :
           tabtype === 'tech' ? 'brightness(0) invert(0.2) sepia(1) saturate(10000%) hue-rotate(0deg)' :
           'brightness(0) invert(0.75) sepia(1) saturate(5000%) hue-rotate(175deg)',
  },
  marginBottom: '2px',
}));

const TabContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  gap: '2px',
});

const TopNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:900px)');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(`/${newValue}`);
  };

  // Extract the label from the current path
  const currentLabel = location.pathname.split('/')[1] || 'records';

  const tabs = [
    {
      value: 'records',
      logo: RecordsSquareLogo,
      label: 'Records'
    },
    {
      value: 'tech',
      logo: TechSquareLogo,
      label: 'Tech'
    },
    {
      value: 'deep',
      logo: DeepSquareLogo,
      label: 'Deep'
    }
  ];

  return (
    <StyledAppBar>
      <Box sx={{ 
        width: '100%', 
        background: 'transparent',
        pl: isMobile ? '48px' : 0 // Add padding when mobile to account for hamburger menu
      }}>
        <StyledTabs
          sx={{ background: 'transparent' }}
          value={currentLabel}
          onChange={handleChange}
          aria-label="label navigation"
          TabIndicatorProps={{
            style: {
              backgroundColor: 
                currentLabel === 'records' ? '#02FF95' :
                currentLabel === 'tech' ? '#FF0000' :
                '#00BFFF'
            }
          }}
        >
          {tabs.map((tab) => (
            <StyledTab
              key={tab.value}
              value={tab.value}
              tabtype={tab.value}
              label={
                <TabContent>
                  <Logo src={tab.logo} alt={tab.label} tabtype={tab.value} />
                  <span>{tab.label}</span>
                </TabContent>
              }
            />
          ))}
        </StyledTabs>
      </Box>
    </StyledAppBar>
  );
};

export default TopNavigation;
