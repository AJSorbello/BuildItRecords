import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';

const drawerWidth = 240;

export interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
}

interface LabelSidebarProps {
  open?: boolean;
  onClose?: () => void;
  variant: "permanent" | "temporary";
  sx?: object;
  color: string;
  menuItems: MenuItem[];
  label: string;
}

const LabelSidebar: React.FC<LabelSidebarProps> = ({
  open = true,
  onClose,
  variant,
  sx,
  color,
  menuItems,
  label
}) => {
  const navigate = useNavigate();

  const drawer = (
    <Box sx={{ height: '100%', backgroundColor: color }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
        }}
      >
        <Box
          component="img"
          src={`/images/${label.toLowerCase()}-logo.png`}
          alt={`${label} Logo`}
          sx={{ height: 40 }}
        />
        {variant === 'temporary' && (
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (onClose) onClose();
            }}
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'white' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              sx={{ 
                '& .MuiListItemText-primary': { 
                  color: 'white',
                  fontWeight: 500
                }
              }} 
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

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
          backgroundColor: color,
          marginTop: variant === 'temporary' ? 0 : '64px',
          border: 'none',
          height: variant === 'temporary' ? '100%' : 'calc(100% - 64px)'
        }
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default LabelSidebar;
