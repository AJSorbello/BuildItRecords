import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Box,
  styled,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
  },
  [theme.breakpoints.down('md')]: {
    display: 'none',
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

const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'flex',
  },
  marginLeft: 'auto',
}));

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);

  const getTabValue = () => {
    const path = location.pathname.split('/')[1] || '';
    switch (path) {
      case '':
      case 'records':
        return 0;
      case 'tech':
        return 1;
      case 'deep':
        return 2;
      default:
        return 0;
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/records');
        break;
      case 1:
        navigate('/tech');
        break;
      case 2:
        navigate('/deep');
        break;
    }
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleMobileMenuClick = (path: string) => {
    navigate(path);
    handleMobileMenuClose();
  };

  const menuItems = [
    { label: 'Build It Records', path: '/records', logo: require('../assets/png/records/BuildIt_Records_Square.png') },
    { label: 'Build It Tech', path: '/tech', logo: require('../assets/png/tech/BuildIt_Tech_Square.png') },
    { label: 'Build It Deep', path: '/deep', logo: require('../assets/png/deep/BuildIt_Deep_Square.png') },
  ];

  return (
    <AppBar position="fixed" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(8px)' }}>
      <Toolbar>
        <Box display="flex" alignItems="center" width="100%">
          {isMobile ? (
            <>
              <Box display="flex" alignItems="center">
                <LogoImage 
                  src={menuItems[getTabValue()].logo} 
                  alt={menuItems[getTabValue()].label}
                />
                <Typography variant="h6" component="div">
                  {menuItems[getTabValue()].label}
                </Typography>
              </Box>
              <MobileMenuButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMobileMenuOpen}
              >
                <MenuIcon />
              </MobileMenuButton>
              <Menu
                anchorEl={mobileMenuAnchor}
                open={Boolean(mobileMenuAnchor)}
                onClose={handleMobileMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    backgroundColor: 'rgba(18, 18, 18, 0.95)',
                    backdropFilter: 'blur(8px)',
                    mt: 1.5,
                    '& .MuiMenuItem-root': {
                      px: 2.5,
                      py: 1.5,
                    },
                  },
                }}
              >
                {menuItems.map((item, index) => (
                  <MenuItem 
                    key={item.path} 
                    onClick={() => handleMobileMenuClick(item.path)}
                    selected={getTabValue() === index}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <LogoImage src={item.logo} alt={item.label} sx={{ height: 30 }} />
                      <Typography>{item.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            <StyledTabs
              value={getTabValue()}
              onChange={handleTabChange}
              aria-label="label navigation tabs"
            >
              {menuItems.map((item) => (
                <StyledTab
                  key={item.path}
                  icon={<LogoImage src={item.logo} alt={item.label} />}
                  label={item.label}
                />
              ))}
            </StyledTabs>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
