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

interface DeepSidebarProps {
  open?: boolean;
  onClose?: () => void;
  variant: "permanent" | "temporary";
  sx?: object;
}

const DeepSidebar: React.FC<DeepSidebarProps> = ({ open = true, onClose, variant, sx }) => {
  const navigate = useNavigate();
  const color = labelColors.deep;
  const isTemporary = variant === "temporary";

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/deep' },
    { text: 'Releases', icon: <AlbumIcon />, path: '/deep/releases' },
    { text: 'Artists', icon: <PeopleIcon />, path: '/deep/artists' },
    { text: 'Playlists', icon: <QueueMusicIcon />, path: '/deep/playlists' },
    { text: 'Submit', icon: <SendIcon />, path: '/deep/submit' },
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
    if (isTemporary && onClose) {
      onClose();
    }
  };

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      anchor="left"
      ModalProps={{
        keepMounted: true,
      }}
      PaperProps={{
        sx: {
          width: drawerWidth,
          backgroundColor: '#121212',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
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
          }
        }
      }}
      sx={{
        display: { xs: isTemporary ? 'block' : 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: drawerWidth,
          marginTop: isTemporary ? 0 : '180px',
          height: isTemporary ? '100%' : 'calc(100% - 180px)',
          ...sx
        },
      }}
    >
      {isTemporary && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={onClose} sx={{ color: '#ffffff' }}>
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
              height: '48px',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: 'rgba(0, 191, 255, 0.08)',
              }
            }}
          >
            <ListItemIcon>
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
