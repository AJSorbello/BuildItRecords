import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { databaseService } from '../../services/DatabaseService';
import { logger } from '../../utils/logger';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devModeToggled, setDevModeToggled] = useState(false);
  const [success, setSuccess] = useState(false);
  const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

  console.log('AdminLogin - Environment:', {
    isDev,
    hostname: window.location.hostname,
    apiBaseUrl: databaseService.getBaseUrl(),
  });

  // Debug state to track API base URL and other info for debugging
  const [state, setState] = useState({
    apiBaseUrl: databaseService.getBaseUrl(),
  });

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      logger.info(`Logging in with username: ${username}, API URL: ${state.apiBaseUrl}`);
      console.log(`Logging in with username: ${username}, API URL: ${state.apiBaseUrl}`);
      
      // Call the login endpoint
      const response = await databaseService.adminLogin(username, password);
      
      if (response && response.token) {
        // Store the token in localStorage
        localStorage.setItem('adminToken', response.token);
        logger.info('Login successful, token stored:', response.token.substring(0, 20) + '...');
        console.log('Login successful, token stored:', response.token.substring(0, 20) + '...');
        setSuccess(true);
        
        // Wait momentarily to show success message before redirecting
        setTimeout(() => {
          // Check if there's a redirect path stored
          const redirectPath = sessionStorage.getItem('redirectAfterLogin');
          if (redirectPath) {
            logger.info(`Redirecting to stored path: ${redirectPath}`);
            console.log(`Redirecting to stored path: ${redirectPath}`);
            sessionStorage.removeItem('redirectAfterLogin'); // Clear stored path
            navigate(redirectPath);
          } else {
            logger.info('No stored redirect path, going to dashboard');
            console.log('No stored redirect path, going to dashboard');
            navigate('/admin/dashboard');
          }
        }, 1000);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      logger.error('Login failed:', error);
      console.error('Login failed:', error);
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle test login (dev only)
  const handleTestLogin = async () => {
    setError(null);
    setLoading(true);
    
    try {
      logger.info('Attempting test login');
      
      // Call the test login endpoint
      const baseUrl = databaseService.getBaseUrl();
      const response = await fetch(`${baseUrl}/api/admin/test-login`);
      const data = await response.json();
      
      if (data.success !== 'success' || !data.data || !data.data.token) {
        setError(data.message || 'Test login failed');
        setLoading(false);
        return;
      }
      
      // Store token in localStorage
      localStorage.setItem('adminToken', data.data.token);
      localStorage.setItem('adminUsername', 'test-admin');
      
      logger.info('Test login successful');
      setLoading(false);
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      logger.error('Test login error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during test login');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Admin Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Login successful!
          </Alert>
        )}

        <form onSubmit={handleLogin}>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
            autoFocus
            inputProps={{
              'aria-label': 'Username',
              autoComplete: 'username'
            }}
          />

          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            inputProps={{
              'aria-label': 'Password',
              autoComplete: 'current-password'
            }}
          />

          <Box sx={{ mt: 3, position: 'relative' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ height: 48 }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ position: 'absolute' }} />
              ) : (
                'Login'
              )}
            </Button>
          </Box>
        </form>

        {isDev && (
          <Box mt={3} textAlign="center">
            <Button 
              onClick={() => setDevModeToggled(!devModeToggled)} 
              variant="text" 
              color="secondary"
              size="small"
            >
              {devModeToggled ? 'Hide Dev Options' : 'Show Dev Options'}
            </Button>
            
            {devModeToggled && (
              <Box mt={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                <Typography variant="subtitle2" gutterBottom>
                  Development Tools
                </Typography>
                <Button
                  onClick={handleTestLogin}
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  disabled={loading}
                  sx={{ mb: 1 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Use Test Login'}
                </Button>
                <Typography variant="caption" display="block">
                  API Base URL: {databaseService.getBaseUrl()}
                </Typography>
                <Typography variant="caption" display="block">
                  Environment: {process.env.NODE_ENV}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default AdminLogin;
