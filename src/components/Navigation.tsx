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
  Divider,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { SvgIcon } from '@mui/material';

// Custom SoundCloud icon
const SoundCloudIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M11.56 8.87V17h8.76c1.85 0 3.36-1.5 3.36-3.34 0-1.84-1.51-3.34-3.36-3.34-.07 0-.13 0-.2.01-.3-3.28-3.05-5.86-6.42-5.86-2.4 0-4.5 1.32-5.6 3.28-.17-.03-.34-.05-.51-.05-1.85 0-3.36 1.5-3.36 3.34 0 1.84 1.51 3.34 3.36 3.34h.87V8.87c0-.46.37-.83.83-.83.46 0 .83.37.83.83z"/>
  </SvgIcon>
);

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3, // Make the indicator more visible
  },
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  fontSize: '1rem',
  fontWeight: 600, // Increased from default
  letterSpacing: '0.01em',
  color: theme.palette.text.primary,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: 700, // Make selected tab even bolder
  },
  '&:hover': {
    color: theme.palette.primary.main,
    opacity: 1,
  },
  textTransform: 'none',
  minWidth: 120,
  [theme.breakpoints.down('md')]: {
    minWidth: 90,
    padding: '6px 8px',
  },
}));

const LogoImage = styled('img')({
  height: 40,
  marginRight: 8,
});

const MobileMenuButton = styled(IconButton)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('md')]: {
    display: 'flex',
    position: 'absolute',
    right: 16,
    zIndex: 1200,
  },
  marginLeft: 'auto',
}));

const SocialButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.primary,
  marginLeft: 'auto',
  '&:hover': {
    color: theme.palette.primary.main,
  },
}));

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [socialMenuAnchor, setSocialMenuAnchor] = useState<null | HTMLElement>(null);

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

  const handleSocialMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSocialMenuAnchor(event.currentTarget);
  };

  const handleSocialMenuClose = () => {
    setSocialMenuAnchor(null);
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

  const socialLinks = [
    { icon: <FacebookIcon />, url: 'https://www.facebook.com/BuildItRecords/', label: 'Facebook' },
    { icon: <InstagramIcon />, url: 'https://www.instagram.com/builditrecords/', label: 'Instagram' },
    { icon: <YouTubeIcon />, url: 'https://www.youtube.com/builditrecords', label: 'YouTube' },
    { icon: <SoundCloudIcon />, url: 'https://soundcloud.com/builditrecords', label: 'SoundCloud' },
  ];

  return (
    <AppBar position="fixed" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(8px)' }}>
      <Toolbar>
        <Box display="flex" alignItems="center" width="100%" position="relative">
          {isMobile ? (
            <>
              <Box display="flex" alignItems="center" maxWidth="calc(100% - 48px)">
                <LogoImage 
                  src={menuItems[getTabValue()].logo} 
                  alt={menuItems[getTabValue()].label}
                />
                <Typography 
                  variant="h6" 
                  component="div" 
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
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
                <Divider sx={{ my: 1 }} />
                {socialLinks.map((link) => (
                  <MenuItem 
                    key={link.url}
                    onClick={() => window.open(link.url, '_blank')}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      {link.icon}
                      <Typography>{link.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            <>
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
              <Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                <SocialButton
                  endIcon={<ExpandMoreIcon />}
                  onClick={handleSocialMenuOpen}
                  aria-label="Social Media Links"
                >
                  Social Media
                </SocialButton>
                <Menu
                  anchorEl={socialMenuAnchor}
                  open={Boolean(socialMenuAnchor)}
                  onClose={handleSocialMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  PaperProps={{
                    elevation: 3,
                    sx: {
                      mt: 1,
                      backgroundColor: 'rgba(18, 18, 18, 0.95)',
                      backdropFilter: 'blur(8px)',
                      '& .MuiMenuItem-root': {
                        px: 2,
                        py: 1.5,
                      },
                    },
                  }}
                >
                  {socialLinks.map((link) => (
                    <MenuItem
                      key={link.url}
                      onClick={() => {
                        window.open(link.url, '_blank');
                        handleSocialMenuClose();
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        {link.icon}
                        <Typography>{link.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
