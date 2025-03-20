import * as React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Tabs, 
  Tab, 
  Divider,
  Paper
} from '@mui/material';

const AdminPage: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const navigate = useNavigate();
  
  React.useEffect(() => {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      // If not authenticated, this should be handled by ProtectedRoute
      // But adding an extra check here for safety
      navigate('/login');
    }
  }, [navigate]);
  
  const handleTabChange = (event: any, newValue: number) => {
    setTabValue(newValue);
    
    // Navigate based on tab selection
    switch (newValue) {
      case 0:
        navigate('/admin');
        break;
      case 1:
        navigate('/admin/tracks');
        break;
      default:
        navigate('/admin');
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        
        <Paper sx={{ mb: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Overview" />
            <Tab label="Tracks" />
            <Tab label="Artists" />
            <Tab label="Labels" />
            <Tab label="Settings" />
          </Tabs>
        </Paper>
        
        <Divider sx={{ mb: 3 }} />
        
        {/* Outlet renders the child route components */}
        <Outlet />
        
        {/* Show default content when no child route is active */}
        {window.location.pathname === '/admin' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Welcome to BuildIt Records Admin
            </Typography>
            <Typography paragraph>
              Select a tab above to manage your content.
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
              mt: 4 
            }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6">Quick Stats</Typography>
                <Typography>Artists: 42</Typography>
                <Typography>Labels: 7</Typography>
                <Typography>Tracks: 156</Typography>
              </Paper>
              
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6">Recent Activity</Typography>
                <Typography>New artist submission: March 18, 2025</Typography>
                <Typography>Track updated: March 17, 2025</Typography>
                <Typography>New release added: March 15, 2025</Typography>
              </Paper>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default AdminPage;
