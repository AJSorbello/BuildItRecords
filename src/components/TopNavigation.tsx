import React from 'react';
import { AppBar, Tabs, Tab, Box, styled } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const StyledAppBar = styled(AppBar)({
  backgroundColor: '#121212',
  boxShadow: 'none',
  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
  height: '64px',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1300,
});

const StyledTabs = styled(Tabs)({
  width: '100%',
  '& .MuiTabs-indicator': {
    backgroundColor: '#02FF95',
  },
  '& .MuiTabs-flexContainer': {
    justifyContent: 'space-between',
  },
});

const StyledTab = styled(Tab)({
  flex: 1,
  maxWidth: 'none',
  color: '#FFFFFF',
  '&.Mui-selected': {
    color: '#02FF95',
  },
  '&:hover': {
    color: '#02FF95',
    opacity: 1,
  },
});

const Logo = styled('img')({
  height: '40px',
  marginRight: '8px',
});

const TopNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  const value = location.pathname === '/' ? '/' : location.pathname;

  const tabs = [
    {
      value: '/',
      logo: require('../png/records/BuildItRecords.png'),
      label: 'Records'
    },
    {
      value: '/tech',
      logo: require('../png/tech/BuildIt_Tech.png'),
      label: 'Tech'
    },
    {
      value: '/deep',
      logo: require('../png/deep/BuildIt_Deep.png'),
      label: 'Deep'
    }
  ];

  return (
    <StyledAppBar>
      <Box sx={{ width: '100%' }}>
        <StyledTabs
          value={value}
          onChange={handleChange}
          aria-label="label navigation"
        >
          {tabs.map((tab) => (
            <StyledTab
              key={tab.value}
              value={tab.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Logo src={tab.logo} alt={tab.label} />
                </Box>
              }
            />
          ))}
        </StyledTabs>
      </Box>
    </StyledAppBar>
  );
};

export default TopNavigation;
