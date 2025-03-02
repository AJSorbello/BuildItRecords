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
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
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

const drawerWidth = 240;

// Custom SoundCloud icon
const SoundCloudIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M11.56 8.87V17h8.76c1.85 0 3.36-1.5 3.36-3.34 0-1.84-1.51-3.34-3.36-3.34-.07 0-.13 0-.2.01-.3-3.28-3.05-5.86-6.42-5.86-2.4 0-4.5 1.32-5.6 3.28-.17-.03-.34-.05-.51-.05-1.85 0-3.36 1.5-3.36 3.34 0 1.84 1.51 3.34 3.36 3.34h.87V8.87c0-.46.37-.83.83-.83.46 0 .83.37.83.83z"/>
  </SvgIcon>
);

interface TechSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  label: 'records' | 'tech' | 'deep';
  sx?: object;
}

const TechSidebar: React.FC<TechSidebarProps> = ({ 
  mobileOpen = false, 
  onMobileClose, 
  sx 
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const color = labelColors.tech;
  const [socialOpen, setSocialOpen] = useState(false);

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/tech' },
    { text: 'Artists', icon: <PeopleIcon />, path: '/tech/artists' },
    { text: 'Releases', icon: <AlbumIcon />, path: '/tech/releases' },
    { text: 'Playlists', icon: <QueueMusicIcon />, path: '/tech/playlists' },
    { text: 'Submit', icon: <SendIcon />, path: '/tech/submit' },
  ];

  const socialLinks = [
    { icon: <FacebookIcon />, url: 'https://www.facebook.com/BuildItTech/', label: 'Facebook' },
    { icon: <InstagramIcon />, url: 'https://www.instagram.com/buildittech/', label: 'Instagram' },
    { icon: <YouTubeIcon />, url: 'https://www.youtube.com/buildittech', label: 'YouTube' },
    { icon: <SoundCloudIcon />, url: 'https://soundcloud.com/buildittech', label: 'SoundCloud' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? mobileOpen : true}
      onClose={onMobileClose}
      ModalProps={{
        keepMounted: true,
      }}
      PaperProps={{
        sx: {
          width: drawerWidth,
          backgroundColor: '#121212',
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
              fontSize: '0.875rem',
              fontWeight: 500
            }
          },
          ...sx
        }
      }}
      sx={{
        display: { xs: isMobile ? 'block' : 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: drawerWidth,
          marginTop: isMobile ? '64px' : '180px',
          height: isMobile ? 'calc(100% - 64px)' : 'calc(100% - 180px)',
          zIndex: isMobile ? 1200 : 1100
        },
      }}
    >
      <List sx={{ flexGrow: 1, pt: 0 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            sx={{
              mb: 1,
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
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
          onClick={() => setSocialOpen(!socialOpen)}
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
          <List component="div" disablePadding>
            {socialLinks.map((link) => (
              <ListItem
                button
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
              </ListItem>
            ))}
          </List>
        </Collapse>
      </Box>
    </Drawer>
  );
};

export default TechSidebar;
