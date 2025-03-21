import React, { Component } from 'react';
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

const drawerWidth = 240;

// Custom SoundCloud icon
const SoundCloudIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M11.56 8.87V17h8.76c1.85 0 3.36-1.5 3.36-3.34 0-1.84-1.51-3.34-3.36-3.34-.07 0-.13 0-.2.01-.3-3.28-3.05-5.86-6.42-5.86-2.4 0-4.5 1.32-5.6 3.28-.17-.03-.34-.05-.51-.05-1.85 0-3.36 1.5-3.36 3.34 0 1.84 1.51 3.34 3.36 3.34h.87V8.87c0-.46.37-.83.83-.83.46 0 .83.37.83.83z"/>
  </SvgIcon>
);

interface DeepSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  label: 'records' | 'tech' | 'deep';
  sx?: object;
  navigate: NavigateFunction;
  isMobile: boolean;
}

interface DeepSidebarState {
  socialOpen: boolean;
}

// Wrapper to get hooks
const DeepSidebarWrapper: React.FC<Omit<DeepSidebarProps, 'navigate' | 'isMobile'>> = (props) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return <DeepSidebar 
    {...props} 
    navigate={navigate}
    isMobile={isMobile} 
  />;
};

class DeepSidebar extends Component<DeepSidebarProps, DeepSidebarState> {
  constructor(props: DeepSidebarProps) {
    super(props);
    this.state = {
      socialOpen: false
    };
    this.handleNavigation = this.handleNavigation.bind(this);
    this.toggleSocial = this.toggleSocial.bind(this);
  }

  menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/deep' },
    { text: 'Artists', icon: <PeopleIcon />, path: '/deep/artists' },
    { text: 'Releases', icon: <AlbumIcon />, path: '/deep/releases' },
    { text: 'Playlists', icon: <QueueMusicIcon />, path: '/deep/playlists' },
    { text: 'Submit', icon: <SendIcon />, path: '/deep/submit' },
  ];

  socialLinks = [
    { icon: <FacebookIcon />, url: 'https://www.facebook.com/BuildItDeep/', label: 'Facebook' },
    { icon: <InstagramIcon />, url: 'https://www.instagram.com/builditdeep/', label: 'Instagram' },
    { icon: <YouTubeIcon />, url: 'https://www.youtube.com/builditdeep', label: 'YouTube' },
    { icon: <SoundCloudIcon />, url: 'https://soundcloud.com/builditdeep', label: 'SoundCloud' },
  ];

  handleNavigation(path: string) {
    const { navigate, isMobile, onMobileClose } = this.props;
    navigate(path);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  }

  toggleSocial() {
    this.setState(prevState => ({
      socialOpen: !prevState.socialOpen
    }));
  }

  render() {
    const { mobileOpen = false, onMobileClose, sx, isMobile } = this.props;
    const { socialOpen } = this.state;
    const color = labelColors.deep;

    return (
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true,
          disableEnforceFocus: false,
          disableAutoFocus: false
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
          }
        }}
      >
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
          {this.menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => this.handleNavigation(item.path)}
              sx={{
                mb: 1,
                padding: '12px 16px',
                borderRadius: '6px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(0, 150, 255, 0.15)',
                  transform: 'translateX(3px)',
                  '& .MuiListItemIcon-root': {
                    color: '#0096FF'
                  },
                  '& .MuiListItemText-primary': {
                    color: '#0096FF'
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
            onClick={this.toggleSocial}
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
              {this.socialLinks.map((link) => (
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
  }
}

export default DeepSidebarWrapper;
