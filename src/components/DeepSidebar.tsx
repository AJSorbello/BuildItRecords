import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { labelColors } from '../theme/theme';
import HomeIcon from '@mui/icons-material/Home';
import AlbumIcon from '@mui/icons-material/Album';
import PeopleIcon from '@mui/icons-material/People';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import SendIcon from '@mui/icons-material/Send';

const drawerWidth = 240;

const DeepSidebar: React.FC = () => {
  const navigate = useNavigate();
  const color = labelColors.deep;

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/deep' },
    { text: 'Releases', icon: <AlbumIcon />, path: '/deep/releases' },
    { text: 'Artists', icon: <PeopleIcon />, path: '/deep/artists' },
    { text: 'Playlists', icon: <QueueMusicIcon />, path: '/deep/playlists' },
    { text: 'Submit', icon: <SendIcon />, path: '/deep/submit' },
  ];

  return (
    <Drawer
      variant="permanent"
      PaperProps={{
        sx: {
          border: 'none'
        }
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#000000',
          marginTop: '180px',
          border: 'none'
        }
      }}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              color: '#FFFFFF',
              height: '48px',
              '&:hover': {
                backgroundColor: 'rgba(0, 191, 255, 0.08)',
              },
              '& .MuiListItemIcon-root': {
                minWidth: '40px',
                marginLeft: '12px',
              },
              '& .MuiListItemText-primary': {
                fontSize: '0.875rem',
                fontWeight: 500,
              },
            }}
          >
            <ListItemIcon sx={{ color: color }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default DeepSidebar;
