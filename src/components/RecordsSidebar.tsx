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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { labelColors } from '../theme/theme';
import HomeIcon from '@mui/icons-material/Home';
import AlbumIcon from '@mui/icons-material/Album';
import PeopleIcon from '@mui/icons-material/People';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import WebIcon from '@mui/icons-material/Web';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import SoundCloudIcon from './SoundCloudIcon';

const drawerWidth = 240;

interface RecordsSidebarProps {
  open: boolean;
  onClose: () => void;
  isMobile?: boolean;
  variant?: 'permanent' | 'persistent' | 'temporary';
  label?: 'records' | 'tech' | 'deep';
  sx?: object;
  navigate: any;
  location: any;
}

const RecordsSidebar: React.FC<RecordsSidebarProps> = ({
  open,
  onClose,
  isMobile = false,
  variant = 'temporary' as 'temporary' | 'permanent' | 'persistent',
  label = 'records',
  sx,
  navigate,
  location,
}) => {
  const [socialOpen, setSocialOpen] = useState(false);
  const theme = useTheme();

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
      onClose();
    }
  };

  const toggleSocial = () => {
    setSocialOpen(!socialOpen);
  };

  const drawer = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: labelColors[label],
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
            onClick={onClose}
            sx={{ color: '#fff' }}
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
              bgcolor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
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
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
      
      <List>
        <ListItem button onClick={toggleSocial}>
          <ListItemIcon sx={{ color: '#fff' }}>
            <WebIcon />
          </ListItemIcon>
          <ListItemText primary="Social & Links" />
          {socialOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        
        <Collapse in={socialOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem 
              button 
              sx={{ pl: 4 }}
              onClick={() => window.open('https://github.com/AJSorbello', '_blank')}
            >
              <ListItemIcon sx={{ color: '#fff' }}>
                <GitHubIcon />
              </ListItemIcon>
              <ListItemText primary="GitHub" />
            </ListItem>
            
            <ListItem 
              button 
              sx={{ pl: 4 }}
              onClick={() => window.open('https://www.linkedin.com/in/aj-sorbello-833b5924a/', '_blank')}
            >
              <ListItemIcon sx={{ color: '#fff' }}>
                <LinkedInIcon />
              </ListItemIcon>
              <ListItemText primary="LinkedIn" />
            </ListItem>
            
            <ListItem 
              button 
              sx={{ pl: 4 }}
              onClick={() => window.open('https://www.facebook.com/BuildItRecords/', '_blank')}
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
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
        disableEnforceFocus: false,
        disableAutoFocus: false
      }}
      sx={{
        display: { xs: 'block', md: 'block' },
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: labelColors[label],
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: 'none'
        },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default RecordsSidebar;