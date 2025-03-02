import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  Box,
  Typography,
  Collapse,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  Person as PersonIcon,
  Album as AlbumIcon,
  PlaylistPlay as PlaylistIcon,
  Send as SendIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { SvgIcon } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

const drawerWidth = 240;

// Custom SoundCloud icon
const SoundCloudIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M11.56 8.87V17h8.76c1.85 0 3.36-1.5 3.36-3.34 0-1.84-1.51-3.34-3.36-3.34-.07 0-.13 0-.2.01-.3-3.28-3.05-5.86-6.42-5.86-2.4 0-4.5 1.32-5.6 3.28-.17-.03-.34-.05-.51-.05-1.85 0-3.36 1.5-3.36 3.34 0 1.84 1.51 3.34 3.36 3.34h.87V8.87c0-.46.37-.83.83-.83.46 0 .83.37.83.83z"/>
  </SvgIcon>
);

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    backgroundColor: '#121212',
    padding: theme.spacing(2),
    border: 'none',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    '& .MuiDivider-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      margin: theme.spacing(2, 0),
    },
    '& .MuiTypography-root': {
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
}));

interface StyledListButtonProps {
  active?: boolean;
}

const StyledListButton = styled(ListItemButton)<StyledListButtonProps>(({ active }) => ({
  marginBottom: '8px',
  borderRadius: '6px',
  padding: '12px 16px',
  backgroundColor: active ? 'rgba(2, 255, 149, 0.15)' : 'transparent',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: 'rgba(2, 255, 149, 0.15)',
    transform: 'translateX(3px)',
  },
  '& .MuiListItemIcon-root': {
    color: active ? '#02FF95' : '#FFFFFF',
    minWidth: '40px',
  },
  '& .MuiListItemText-primary': {
    color: active ? '#02FF95' : '#FFFFFF',
    fontWeight: 700,
    fontSize: '1rem',
    letterSpacing: '0.01em',
  },
}));

const SocialSection = styled(Box)(({ theme }) => ({
  marginTop: 'auto',
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(255, 255, 255, 0.12)',
  '& .MuiIconButton-root': {
    margin: theme.spacing(0, 1),
    color: theme.palette.text.primary,
    transition: 'all 0.2s ease',
    '&:hover': {
      color: '#02FF95',
      transform: 'translateY(-2px)',
    },
  },
  '& .MuiTypography-root': {
    fontWeight: 600,
    fontSize: '0.9rem',
    marginBottom: theme.spacing(1),
    letterSpacing: '0.02em',
  },
}));

interface SidebarProps {
  label: 'records' | 'tech' | 'deep';
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ label, mobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [socialOpen, setSocialOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: `/${label === 'records' ? '' : label}` },
    { text: 'Artists', icon: <PersonIcon />, path: `/${label}/artists` },
    { text: 'Releases', icon: <AlbumIcon />, path: `/${label}/releases` },
    { text: 'Playlists', icon: <PlaylistIcon />, path: `/${label}/playlists` },
    { text: 'Submit Demo', icon: <SendIcon />, path: `/${label}/submit` },
  ];

  const socialLinks = [
    { icon: <FacebookIcon />, url: 'https://www.facebook.com/BuildItRecords/', label: 'Facebook' },
    { icon: <InstagramIcon />, url: 'https://www.instagram.com/builditrecords/', label: 'Instagram' },
    { icon: <YouTubeIcon />, url: 'https://www.youtube.com/builditrecords', label: 'YouTube' },
    { icon: <SoundCloudIcon />, url: 'https://soundcloud.com/builditrecords', label: 'SoundCloud' },
  ];

  const handleSocialClick = () => {
    setSocialOpen(!socialOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <StyledDrawer 
      variant={isMobile ? "temporary" : "permanent"}
      anchor="left"
      open={isMobile ? mobileOpen : true}
      onClose={onMobileClose}
      ModalProps={{
        keepMounted: true, // Better mobile performance
      }}
    >
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <StyledListButton
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            active={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </StyledListButton>
        ))}
      </List>
      
      <SocialSection>
        <ListItemButton onClick={handleSocialClick}>
          <ListItemText 
            primary={
              <Typography color="white" variant="subtitle2">
                Social Media
              </Typography>
            } 
          />
          {socialOpen ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
        </ListItemButton>
        <Collapse in={socialOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {socialLinks.map((link) => (
              <ListItemButton
                key={link.url}
                onClick={() => window.open(link.url, '_blank')}
                sx={{ pl: 4 }}
              >
                <ListItemIcon sx={{ color: 'white' }}>
                  {link.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography color="white" variant="body2">
                      {link.label}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      </SocialSection>
    </StyledDrawer>
  );
};

export default Sidebar;
