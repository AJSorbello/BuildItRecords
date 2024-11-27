import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  Person as PersonIcon,
  Album as AlbumIcon,
  PlaylistPlay as PlaylistIcon,
  Send as SendIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: '#121212',
    borderRight: '1px solid rgba(255, 255, 255, 0.12)',
    marginTop: '180px',
    position: 'fixed',
    height: 'calc(100vh - 180px)',
  },
  '& .MuiDrawer-docked': {
    width: 0,
  },
}));

interface StyledListButtonProps {
  active?: boolean;
}

const StyledListButton = styled(ListItemButton)<StyledListButtonProps>(({ active }) => ({
  marginBottom: '8px',
  borderRadius: '4px',
  backgroundColor: active ? 'rgba(2, 255, 149, 0.1)' : 'transparent',
  '&:hover': {
    backgroundColor: 'rgba(2, 255, 149, 0.1)',
  },
  '& .MuiListItemIcon-root': {
    color: active ? '#02FF95' : '#FFFFFF',
  },
  '& .MuiListItemText-primary': {
    color: active ? '#02FF95' : '#FFFFFF',
  },
}));

interface SidebarProps {
  label: 'records' | 'tech' | 'deep';
}

const Sidebar: React.FC<SidebarProps> = ({ label }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: `/${label === 'records' ? '' : label}` },
    { text: 'Artists', icon: <PersonIcon />, path: `/${label}/artists` },
    { text: 'Releases', icon: <AlbumIcon />, path: `/${label}/releases` },
    { text: 'Playlists', icon: <PlaylistIcon />, path: `/${label}/playlists` },
    { text: 'Submit Demo', icon: <SendIcon />, path: `/${label}/submit` },
  ];

  return (
    <StyledDrawer variant="permanent" anchor="left">
      <List>
        {menuItems.map((item) => (
          <StyledListButton
            key={item.text}
            onClick={() => navigate(item.path)}
            active={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </StyledListButton>
        ))}
      </List>
    </StyledDrawer>
  );
};

export default Sidebar;
