import React, { useState } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Box,
  Collapse,
  Typography,
  useMediaQuery,
  IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import { labelColors } from '../theme/theme';
import HomeIcon from '@mui/icons-material/Home';
import AlbumIcon from '@mui/icons-material/Album';
import PeopleIcon from '@mui/icons-material/People';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { SvgIcon } from '@mui/material';
import SoundCloudIcon from './SoundCloudIcon';

const drawerWidth = 240;

interface TechSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  label: 'records' | 'tech' | 'deep';
  sx?: object;
  navigate: NavigateFunction;
  isMobile: boolean;
}

// Wrapper to get hooks like useNavigate
const TechSidebarWrapper: React.FC<Omit<TechSidebarProps, 'navigate' | 'isMobile'>> = (props) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down('md'));
  
  return <TechSidebar 
    {...props} 
    navigate={navigate}
    isMobile={matches}
  />;
};

const TechSidebar: React.FC<TechSidebarProps> = ({
  mobileOpen = false,
  onMobileClose,
  sx,
  navigate,
  isMobile,
  label
}) => {
  const [socialOpen, setSocialOpen] = useState(false);
  const color = labelColors.tech;

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/tech' },
    { text: 'Artists', icon: <PeopleIcon />, path: '/tech/artists' },
    { text: 'Releases', icon: <AlbumIcon />, path: '/tech/releases' },
    { text: 'Playlists', icon: <QueueMusicIcon />, path: '/tech/playlists' },
    { text: 'Submit', icon: <SendIcon />, path: '/tech/submit' },
  ];

  const socialLinks = [
    { icon: <FacebookIcon />, url: 'https://www.facebook.com/BuildItTech/', label: 'Facebook' },
    { icon: <InstagramIcon />, url: 'https://www.instagram.com/buildittechmusic/', label: 'Instagram' },
    { icon: <YouTubeIcon />, url: 'https://www.youtube.com/buildittechmusic', label: 'YouTube' },
    { icon: <SoundCloudIcon />, url: 'https://soundcloud.com/buildittechmusic', label: 'SoundCloud' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const toggleSocial = () => {
    setSocialOpen(!socialOpen);
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? mobileOpen : true}
      onClose={onMobileClose}
      ModalProps={{
        keepMounted: true,
        disableEnforceFocus: false,
        disableAutoFocus: false,
        // Adding better accessibility handling
        closeAfterTransition: true,
        slotProps: {
          backdrop: {
            timeout: 500,
          },
        },
        // Set the appropriate aria attributes for accessibility
        'aria-labelledby': 'tech-sidebar-title',
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
        }
      }}
      PaperProps={{
        sx: {
          width: drawerWidth,
          backgroundColor: '#000000', // Force black background
          backgroundImage: 'none', // Remove any background image
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          '& .MuiListItemIcon-root': {
            color: color,
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
          },
          ...sx
        },
        'aria-label': 'Build It Tech navigation'
      }}
    >
      <Typography 
        id="tech-sidebar-title" 
        variant="body2"
        sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', clipPath: 'inset(50%)' }}
      >
        Build It Tech Navigation Menu
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
            onClick={onMobileClose} 
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
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.15)',
                transform: 'translateX(3px)',
                '& .MuiListItemIcon-root': {
                  color: '#FF0000'
                },
                '& .MuiListItemText-primary': {
                  color: '#FF0000'
                }
              }
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ mt: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.12)', p: 2 }}>
        <ListItem
          button
          onClick={toggleSocial}
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
            {socialLinks.map((link) => (
              <ListItem
                button
                key={link.url}
                onClick={() => window.open(link.url, '_blank')}
                aria-label={`Visit ${link.label} (opens in new tab)`}
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
              </ListItem>
            ))}
          </List>
        </Collapse>
      </Box>
    </Drawer>
  );
};

export default TechSidebarWrapper;
