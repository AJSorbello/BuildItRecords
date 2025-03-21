import React, { useState } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Box,
  Collapse,
  Typography,
  Divider,
  useMediaQuery,
  SvgIcon
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { labelColors } from '../theme/theme';
import HomeIcon from '@mui/icons-material/Home';
import AlbumIcon from '@mui/icons-material/Album';
import PeopleIcon from '@mui/icons-material/People';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';

// Custom SoundCloud icon
const SoundCloudIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M11.56 8.87V17h8.76c1.85 0 3.36-1.5 3.36-3.34 0-1.84-1.51-3.34-3.36-3.34-.07 0-.13 0-.2.01-.3-3.28-3.05-5.86-6.42-5.86-2.4 0-4.5 1.32-5.6 3.28-.17-.03-.34-.05-.51-.05-1.85 0-3.36 1.5-3.36 3.34 0 1.84 1.51 3.34 3.36 3.34h.87V8.87c0-.46.37-.83.83-.83.46 0 .83.37.83.83z"/>
  </SvgIcon>
);

const drawerWidth = 240;

interface RecordsSidebarProps {
  open?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
  variant?: 'permanent' | 'persistent' | 'temporary';
  label?: 'records' | 'tech' | 'deep';
  sx?: object;
  mobileOpen?: boolean; 
  onMobileClose?: () => void;
}

// Simple RecordsSidebar that doesn't rely on hooks
const RecordsSidebar: React.FC<RecordsSidebarProps> = (props) => {
  const {
    open = false,
    onClose = () => {},
    isMobile = false,
    variant = 'temporary',
    label = 'records',
    sx = {},
    mobileOpen,
    onMobileClose,
  } = props;

  // Use the hook pattern directly in this component
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [socialOpen, setSocialOpen] = useState(false);

  // Handle props coming from different components
  const isOpen = open || mobileOpen || false;
  const handleClose = onClose || onMobileClose || (() => {});

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Artists', icon: <PeopleIcon />, path: '/records/artists' },
    { text: 'Releases', icon: <AlbumIcon />, path: '/records/releases' },
    { text: 'Playlists', icon: <QueueMusicIcon />, path: '/records/playlists' },
    { text: 'Submit', icon: <ArrowBackIcon />, path: '/records/submit' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      handleClose();
    }
  };

  const toggleSocial = () => {
    setSocialOpen(!socialOpen);
  };

  // Safe path matching that handles undefined location
  const isActivePath = (itemPath: string) => {
    if (!location || typeof location.pathname !== 'string') return false;
    return location.pathname === itemPath;
  };

  const drawer = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: labelColors[label] || '#000000',
      color: '#fff',
      ...sx
    }}>
      {isMobile && (
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: 1
          }}
        >
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={handleClose}
            sx={{ color: '#fff' }}
            aria-label="Close menu"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )}
      
      <Box sx={{ padding: 2, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          BUILD IT RECORDS
        </Typography>
      </Box>
      
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            sx={{
              bgcolor: isActivePath(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
              }
            }}
          >
            <ListItemIcon sx={{ color: '#fff' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ my: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
      
      <List>
        <ListItem button onClick={toggleSocial} aria-expanded={socialOpen} aria-controls="social-media-list">
          <ListItemText primary={
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Social Media
            </Typography>
          } />
          {socialOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        
        <Collapse in={socialOpen} timeout="auto" unmountOnExit>
          <List component="div" id="social-media-list" disablePadding>
            <ListItem 
              button 
              sx={{ pl: 4 }}
              onClick={() => window.open('https://www.facebook.com/BuildItRecords/', '_blank')}
              aria-label="Visit Facebook (opens in new tab)"
            >
              <ListItemIcon sx={{ color: '#fff' }}>
                <FacebookIcon />
              </ListItemIcon>
              <ListItemText primary="Facebook" />
            </ListItem>
            
            <ListItem 
              button 
              sx={{ pl: 4 }}
              onClick={() => window.open('https://www.instagram.com/builditrecords/', '_blank')}
              aria-label="Visit Instagram (opens in new tab)"
            >
              <ListItemIcon sx={{ color: '#fff' }}>
                <InstagramIcon />
              </ListItemIcon>
              <ListItemText primary="Instagram" />
            </ListItem>
            
            <ListItem 
              button 
              sx={{ pl: 4 }}
              onClick={() => window.open('https://www.youtube.com/builditrecords', '_blank')}
              aria-label="Visit YouTube (opens in new tab)"
            >
              <ListItemIcon sx={{ color: '#fff' }}>
                <YouTubeIcon />
              </ListItemIcon>
              <ListItemText primary="YouTube" />
            </ListItem>
            
            <ListItem 
              button 
              sx={{ pl: 4 }}
              onClick={() => window.open('https://soundcloud.com/builditrecords', '_blank')}
              aria-label="Visit SoundCloud (opens in new tab)"
            >
              <ListItemIcon sx={{ color: '#fff' }}>
                <SoundCloudIcon />
              </ListItemIcon>
              <ListItemText primary="SoundCloud" />
            </ListItem>
          </List>
        </Collapse>
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={isOpen}
      onClose={handleClose}
      ModalProps={{
        keepMounted: true,
        disableEnforceFocus: false,
        disableAutoFocus: false,
        // Improve accessibility
        closeAfterTransition: true,
        'aria-labelledby': 'records-sidebar-title',
      }}
      sx={{
        display: { xs: 'block', md: 'block' },
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: labelColors[label] || '#000000',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: 'none'
        },
      }}
    >
      <Typography 
        id="records-sidebar-title" 
        variant="body2"
        sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)' }}
      >
        Build It Records Navigation Menu
      </Typography>
      {drawer}
    </Drawer>
  );
};

export default RecordsSidebar;