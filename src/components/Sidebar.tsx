import React from 'react';
import {
  Drawer,
  List,
  ListItem,
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

const StyledDrawer = styled(Drawer)({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: '#121212',
    borderRight: '1px solid rgba(255, 255, 255, 0.12)',
    marginTop: '180px', // Account for both headers
  },
});

const StyledListItem = styled(ListItem)<{ active?: boolean }>(({ active }) => ({
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
          <StyledListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            active={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </StyledListItem>
        ))}
      </List>
    </StyledDrawer>
  );
};

export default Sidebar;
