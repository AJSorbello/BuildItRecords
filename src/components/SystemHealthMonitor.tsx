import React from 'react';
import { Box, Paper, Typography, IconButton, Collapse } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

// Define the props for the SystemHealthMonitor component
interface SystemHealthMonitorProps {
  showAlways?: boolean;
  minimized?: boolean;
  onToggleMinimize: () => void;
}

// Component for monitoring and displaying system health status
const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({
  showAlways = false,
  minimized = true,
  onToggleMinimize
}) => {
  const [apiStatus, setApiStatus] = React.useState<'healthy' | 'degraded' | 'down' | 'unknown'>('unknown');
  const [lastChecked, setLastChecked] = React.useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Check API health on component mount and periodically
  React.useEffect(() => {
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Function to check API health status
  const checkApiHealth = async () => {
    // Try multiple possible health endpoints
    const endpoints = [
      '/api/health', 
      '/health',
      'https://builditrecords.onrender.com/api/health'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`[SystemHealthMonitor] Checking health endpoint: ${endpoint}`);
        
        // Use proper URL construction if it's a relative path
        const apiUrl = endpoint.startsWith('http') 
          ? endpoint 
          : new URL(endpoint, window.location.origin).toString();
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Omit credentials to avoid CORS issues
          credentials: 'omit',
          // Short timeout to prevent long waits
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[SystemHealthMonitor] Health check response:`, data);
          
          if (data.success) {
            setApiStatus('healthy');
            setErrorMessage(null);
            // Successfully checked health, no need to try other endpoints
            return;
          } else {
            setApiStatus('degraded');
            setErrorMessage(data.message || 'API performance is degraded');
          }
        } else {
          console.log(`[SystemHealthMonitor] Health check failed with status: ${response.status}`);
          // Continue trying other endpoints
        }
      } catch (error) {
        console.log(`[SystemHealthMonitor] Error checking ${endpoint}:`, error);
        // Continue trying other endpoints
      }
    }
    
    // If we get here, all health checks failed
    setApiStatus('down');
    setErrorMessage('API is unreachable. Please check your network connection.');
    setLastChecked(new Date());
  };

  // Determine if the component should be shown
  const shouldShow = showAlways || apiStatus !== 'healthy';
  
  if (!shouldShow) {
    return null;
  }

  // Handle button click for minimize/expand
  const handleExpandClick = (event: any) => {
    // Prevent event from bubbling up
    event.stopPropagation();
    onToggleMinimize();
  };

  // Get status color based on API status
  const getStatusColor = () => {
    switch (apiStatus) {
      case 'healthy': return 'green';
      case 'degraded': return 'orange';
      case 'down': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Paper 
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        width: minimized ? 'auto' : 300,
        backgroundColor: '#222',
        color: 'white',
        borderRadius: 2,
        border: `1px solid ${getStatusColor()}`
      }}
    >
      <Box 
        sx={{ 
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => onToggleMinimize()}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              width: 12, 
              height: 12, 
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
              mr: 1
            }} 
          />
          <Typography variant="body2">
            API Status: {apiStatus.charAt(0).toUpperCase() + apiStatus.slice(1)}
          </Typography>
        </Box>
        <IconButton 
          size="small" 
          onClick={handleExpandClick}
          sx={{ color: 'white' }}
        >
          {minimized ? <ExpandMore /> : <ExpandLess />}
        </IconButton>
      </Box>
      
      <Collapse in={!minimized}>
        <Box sx={{ p: 2, pt: 0 }}>
          {errorMessage && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              Error: {errorMessage}
            </Typography>
          )}
          
          {lastChecked && (
            <Typography variant="caption" display="block" sx={{ mt: 1, color: '#aaa' }}>
              Last checked: {lastChecked.toLocaleTimeString()}
            </Typography>
          )}
          
          <Typography variant="caption" display="block" sx={{ mt: 1, color: '#aaa' }}>
            Click to {minimized ? 'expand' : 'collapse'}
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SystemHealthMonitor;
