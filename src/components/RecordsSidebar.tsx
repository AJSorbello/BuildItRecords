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
  SvgIcon,
  Button
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useLocation, NavigateFunction } from 'react-router-dom';
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

// Wrapper to get hooks like useNavigate
const RecordsSidebarWrapper: React.FC<Omit<RecordsSidebarProps, 'navigate'>> = (props) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down('md'));
  
  return <RecordsSidebar 
    {...props} 
    navigate={navigate}
    isMobile={matches || props.isMobile || false}
  />;
};

interface RecordsSidebarInternalProps extends RecordsSidebarProps {
  navigate: NavigateFunction;
}

const RecordsSidebar: React.FC<RecordsSidebarInternalProps> = ({
  open = false,
  onClose,
  isMobile = false,
  variant = 'temporary',
  label = 'records',
  sx = {},
  mobileOpen = false,
  onMobileClose,
  navigate
}) => {
  // Safely access location with fallback
  let currentPath = '/';
  try {
    const location = useLocation();
    if (location && location.pathname) {
      currentPath = location.pathname;
    }
  } catch (error) {
    console.error('Error accessing location:', error);
  }

  const [socialOpen, setSocialOpen] = useState(false);

  // Determine if drawer is open based on different props sources
  const isOpen = open || mobileOpen || false;
  const handleClose = onClose || onMobileClose || (() => {});

  const handleNavigation = (path: string) => {
    try {
      navigate(path);
      if (isMobile) {
        handleClose();
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to window.location for navigation if navigate fails
      window.location.href = path;
    }
  };

  const handleSocialToggle = () => {
    setSocialOpen(!socialOpen);
  };

  // Get the appropriate color for the current label
  const labelColor = labelColors[label] || labelColors.records;

  // Menu items with icons for the main navigation
  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Artists', icon: <PeopleIcon />, path: '/records/artists' },
    { text: 'Releases', icon: <AlbumIcon />, path: '/records/releases' },
    // Temporarily hiding Playlists until it's set up
    // { text: 'Playlists', icon: <QueueMusicIcon />, path: '/records/playlists' },
    { text: 'Submit', icon: <ArrowBackIcon />, path: '/records/submit' },
  ];

  // Social media links with icons
  const socialItems = [
    { name: 'Facebook', icon: <FacebookIcon />, url: 'https://facebook.com/builditrecordsofficial' },
    { name: 'Instagram', icon: <InstagramIcon />, url: 'https://instagram.com/builditrecords' },
    { name: 'YouTube', icon: <YouTubeIcon />, url: 'https://youtube.com/@BuilditRecords' },
    { name: 'SoundCloud', icon: <SoundCloudIcon />, url: 'https://soundcloud.com/builditrecords' },
  ];

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? isOpen : true}
      onClose={handleClose}
      ModalProps={{
        keepMounted: true,
        disableEnforceFocus: false,
        disableAutoFocus: false,
        closeAfterTransition: true,
        slotProps: {
          backdrop: {
            timeout: 500,
          },
        },
        'aria-labelledby': 'records-sidebar-title',
      }}
      sx={{
        display: { xs: isMobile ? 'block' : 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: drawerWidth,
          marginTop: isMobile ? '64px' : '180px',
          height: isMobile ? 'calc(100% - 64px)' : 'calc(100% - 180px)',
          zIndex: isMobile ? 1200 : 1100,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          backgroundColor: '#000000', // Force black background
          backgroundImage: 'none', // Remove any background image
          borderRight: `3px solid ${labelColor}`
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        },
        '& .MuiPaper-root': {
          backgroundColor: '#000000', // Force black on the paper element
          backgroundImage: 'none',
        },
        '& .MuiModal-root': {
          backgroundColor: '#000000',
        },
        ...sx
      }}
      PaperProps={{
        sx: {
          width: drawerWidth,
          backgroundColor: '#000000', // Force black background
          backgroundImage: 'none', // Remove any background image
          borderRight: `3px solid ${labelColor}`,
          display: 'flex',
          flexDirection: 'column',
          '& .MuiListItemIcon-root': {
            color: labelColor,
            minWidth: '40px',
            marginLeft: '12px'
          },
          '& .MuiListItemText-root': {
            color: '#ffffff',
            '& .MuiTypography-root': {
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.01em'
            }
          }
        },
        'aria-label': 'Build It Records navigation'
      }}
    >
      <Typography 
        id="records-sidebar-title" 
        variant="body2"
        sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)' }}
      >
        Build It Records Navigation Menu
      </Typography>

      {isMobile && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          p: 1,
          position: 'fixed',
          right: 0,
          top: '12px',
          zIndex: 1200
        }}>
          <IconButton 
            onClick={handleClose} 
            aria-label="Close navigation menu"
            sx={{ 
              color: '#ffffff',
              backgroundColor: 'rgba(0, 0, 0, 0.95)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {/* Main navigation list */}
      <List sx={{ flexGrow: 1, pt: 0 }}>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => handleNavigation(item.path)}
            aria-label={`Navigate to ${item.text}`}
            sx={{ 
              mb: 1,
              padding: '12px 16px',
              borderRadius: '6px',
              transition: 'all 0.2s ease-in-out',
              bgcolor: currentPath === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': { 
                backgroundColor: `rgba(${labelColor.replace('#', '').match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.15)`,
                transform: 'translateX(3px)',
                '& .MuiListItemIcon-root': {
                  color: labelColor
                },
                '& .MuiListItemText-primary': {
                  color: labelColor
                }
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      
      {/* Social media links */}
      <Box sx={{ mt: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.12)', p: 2 }}>
        <ListItem
          button
          onClick={handleSocialToggle}
          aria-expanded={socialOpen}
          aria-controls="social-media-list"
          sx={{ borderRadius: '4px' }}
        >
          <ListItemText 
            primary={
              <Typography color="white" variant="subtitle2">
                Social Media
              </Typography>
            }
          />
          {socialOpen ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
        </ListItem>
        <Collapse in={socialOpen} timeout="auto" unmountOnExit>
          <List component="div" id="social-media-list" disablePadding>
            {socialItems.map((item) => (
              <ListItem 
                button 
                key={item.name} 
                sx={{ pl: 4 }}
                onClick={() => window.open(item.url, '_blank')}
                aria-label={`Visit ${item.name} (opens in new tab)`}
              >
                <ListItemIcon sx={{ color: 'white' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography color="white" variant="body2">
                      {item.name}
                    </Typography>
                  } 
                />
              </ListItem>
            ))}
          </List>
        </Collapse>
      </Box>
    </Drawer>
  );
};

export default RecordsSidebarWrapper;