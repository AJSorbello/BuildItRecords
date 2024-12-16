import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { labelColors } from '../theme/theme';
import HomeIcon from '@mui/icons-material/Home';
import AlbumIcon from '@mui/icons-material/Album';
import PeopleIcon from '@mui/icons-material/People';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';

const drawerWidth = 240;

interface RecordsSidebarProps {
  open?: boolean;
  onClose?: () => void;
  variant: "permanent" | "temporary";
  sx?: object;
}

const RecordsSidebar: React.FC<RecordsSidebarProps> = ({ open = true, onClose, variant, sx }) => {
  const navigate = useNavigate();
  const color = labelColors.records;

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/records' },
    { text: 'Releases', icon: <AlbumIcon />, path: '/records/releases' },
    { text: 'Artists', icon: <PeopleIcon />, path: '/records/artists' },
    { text: 'Playlists', icon: <QueueMusicIcon />, path: '/records/playlists' },
    { text: 'Submit', icon: <SendIcon />, path: '/records/submit' },
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
    if (variant === "temporary" && onClose) {
      onClose();
    }
  };

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
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
          marginTop: variant === 'temporary' ? 0 : '180px',
          border: 'none'
        },
        ...sx
      }}
    >
      {variant === 'temporary' && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={onClose} sx={{ color: '#FFFFFF' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      )}
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleItemClick(item.path)}
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