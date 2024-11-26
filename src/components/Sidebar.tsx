import React from 'react';
import { Drawer, List, ListItem, ListItemText, styled } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: '#121212',
    color: '#FFFFFF',
    borderRight: '1px solid rgba(255, 255, 255, 0.12)',
    marginTop: '116px',
    height: 'calc(100% - 116px)',
    top: '116px',
  },
}));

const StyledList = styled(List)({
  padding: 0,
});

const StyledListItem = styled(ListItem)({
  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});

interface SidebarProps {
  label: 'records' | 'tech' | 'deep';
}

const Sidebar: React.FC<SidebarProps> = ({ label }) => {
  const navigate = useNavigate();

  const handleArtistsClick = () => {
    navigate(`/${label}/artists`);
  };

  const handleReleasesClick = () => {
    navigate(`/${label}/releases`);
  };

  const handleDemoClick = () => {
    navigate(`/${label}/submit-demo`);
  };

  return (
    <StyledDrawer variant="permanent">
      <StyledList>
        <StyledListItem button onClick={handleArtistsClick}>
          <ListItemText primary="Artists" />
        </StyledListItem>

        <StyledListItem button onClick={handleReleasesClick}>
          <ListItemText primary="Releases" />
        </StyledListItem>

        <StyledListItem button onClick={handleDemoClick}>
          <ListItemText primary="Submit Demo" />
        </StyledListItem>
      </StyledList>
    </StyledDrawer>
  );
};

export default Sidebar;
