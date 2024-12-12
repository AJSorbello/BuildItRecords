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

const RecordsSidebar: React.FC = () => {
  const navigate = useNavigate();
  const color = labelColors.records;

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/records' },
    { text: 'Releases', icon: <AlbumIcon />, path: '/records/releases' },
    { text: 'Artists', icon: <PeopleIcon />, path: '/records/artists' },
    { text: 'Playlists', icon: <QueueMusicIcon />, path: '/records/playlists' },
    { text: 'Submit', icon: <SendIcon />, path: '/records/submit' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#000000',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          marginTop: '180px',
        },
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
                backgroundColor: 'rgba(2, 255, 149, 0.08)',
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

export default RecordsSidebar;