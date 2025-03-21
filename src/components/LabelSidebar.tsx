import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';

const drawerWidth = 240;

export interface MenuItem {
  text: string;
  icon: JSX.Element;
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
              padding: '12px 16px',
              borderRadius: '6px',
              mb: 1,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                transform: 'translateX(3px)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: '40px' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              sx={{
                '& .MuiListItemText-primary': { 
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '0.01em'
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
      ModalProps={{
        // Better accessibility handling
        keepMounted: true,
        disableEnforceFocus: false,
        disableAutoFocus: false
      }}
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
          height: variant === 'temporary' ? '100%' : 'calc(100% - 64px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default LabelSidebar;
