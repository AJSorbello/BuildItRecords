import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Box,
  styled,
} from '@mui/material';

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  color: theme.palette.text.primary,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  },
  '&:hover': {
    color: theme.palette.primary.main,
    opacity: 1,
  },
  minWidth: 120,
}));

const LogoImage = styled('img')({
  height: 40,
  marginRight: 16,
});

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabValue = () => {
    switch (location.pathname) {
      case '/':
        return 0;
      case '/tech':
        return 1;
      case '/deep':
        return 2;
      default:
        return 0;
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/tech');
        break;
      case 2:
        navigate('/deep');
        break;
    }
  };

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar>
        <Box display="flex" alignItems="center" width="100%">
          <StyledTabs
            value={getTabValue()}
            onChange={handleTabChange}
            aria-label="label navigation tabs"
          >
            <StyledTab
              icon={<LogoImage src={require('../assets/png/records/BuildIt_Records_Square.png')} />}
              label="Build It Records"
            />
            <StyledTab
              icon={<LogoImage src={require('../assets/png/tech/BuildIt_Tech_Square.png')} />}
              label="Build It Tech"
            />
            <StyledTab
              icon={<LogoImage src={require('../assets/png/deep/BuildIt_Deep_Square.png')} />}
              label="Build It Deep"
            />
          </StyledTabs>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
