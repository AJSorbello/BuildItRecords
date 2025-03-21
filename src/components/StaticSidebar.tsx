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
  Button,
  SvgIcon
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
import ErrorBoundary from './ErrorBoundary';

// Custom SoundCloud icon
const SoundCloudIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M11.56 8.87V17h8.76c1.85 0 3.36-1.5 3.36-3.34 0-1.84-1.51-3.34-3.36-3.34-.07 0-.13 0-.2.01-.3-3.28-3.05-5.86-6.42-5.86-2.4 0-4.5 1.32-5.6 3.28-.17-.03-.34-.05-.51-.05-1.85 0-3.36 1.5-3.36 3.34 0 1.84 1.51 3.34 3.36 3.34h.87V8.87c0-.46.37-.83.83-.83.46 0 .83.37.83.83z"/>
  </SvgIcon>
);

const drawerWidth = 240;

interface StaticSidebarProps {
  open?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
  variant?: 'permanent' | 'persistent' | 'temporary';
  label?: 'records' | 'tech' | 'deep';
  sx?: object;
  mobileOpen?: boolean; 
  onMobileClose?: () => void;
  currentPath?: string;
  navigateToPath?: (path: string) => void;
}

// Define menu items outside of component to prevent re-creation on each render
const MENU_ITEMS = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Artists', icon: <PeopleIcon />, path: '/records/artists' },
  { text: 'Releases', icon: <AlbumIcon />, path: '/records/releases' },
  { text: 'Playlists', icon: <QueueMusicIcon />, path: '/records/playlists' },
  { text: 'Submit', icon: <ArrowBackIcon />, path: '/records/submit' },
];

// Static sidebar that doesn't use React Router hooks
const StaticSidebar: React.FC<StaticSidebarProps> = (props) => {
  // Error-proof props with defensive defaults
  const {
    open = false,
    onClose = () => {},
    isMobile = false,
    variant = 'temporary',
    label = 'records',
    sx = {},
    mobileOpen,
    onMobileClose,
    currentPath = '/',
    navigateToPath = () => { window.location.href = '/' }
  } = props;

  const theme = useTheme();
  const [socialOpen, setSocialOpen] = useState(false);

  // Handle props coming from different components
  const isOpen = open || mobileOpen || false;
  const handleClose = onClose || onMobileClose || (() => {});

  const handleNavigation = (path: string) => {
    try {
      navigateToPath(path);
      if (isMobile) {
        handleClose();
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      window.location.href = path;
    }
  };

  const toggleSocial = () => {
    setSocialOpen(!socialOpen);
  };

  // Safe path matching that will never throw
  const isActivePath = (itemPath: string) => {
    return currentPath === itemPath;
  };

  const drawerContent = (
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
        {MENU_ITEMS.map((item) => (
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
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {new Date().getFullYear()} Build It Records
        </Typography>
      </Box>
    </Box>
  );
  
  // Wrap everything in an error boundary
  return (
    <ErrorBoundary
      fallback={
        <Drawer
          variant="temporary"
          anchor="left"
          open={isOpen}
          onClose={handleClose}
          sx={{ width: drawerWidth }}
        >
          <Box sx={{ p: 2 }}>
            <Typography>Menu unavailable</Typography>
            <Button onClick={handleClose}>Close</Button>
          </Box>
        </Drawer>
      }
    >
      <>
        <Drawer
          variant={variant}
          anchor="left"
          open={isOpen}
          onClose={handleClose}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              border: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </>
    </ErrorBoundary>
  );
};

export default StaticSidebar;
