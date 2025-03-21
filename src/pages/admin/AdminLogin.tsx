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
  const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

  console.log('AdminLogin - Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    hostname: window.location.hostname,
    isDev,
    apiBaseUrl: databaseService.getBaseUrl(),
  });

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      logger.info('Attempting login with:', { 
        username,
        hasPassword: !!password,
        apiUrl: databaseService.getBaseUrl(),
        env: process.env.NODE_ENV,
        hostname: window.location.hostname
      });

      // First, try to login
      const response = await databaseService.adminLogin(username, password);
      logger.info('Login response:', response);
      
      if (!response.success || !response.token) {
        setError(response.message || 'Login failed');
        setLoading(false);
        return;
      }

      // Store token in localStorage
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('adminUsername', username);

      // Then verify the token
      const verified = await databaseService.verifyAdminToken();
      logger.info('Token verification:', verified);
      
      if (!verified.verified) {
        setError('Token verification failed');
        setLoading(false);
        return;
      }
      
      // If we get here, both login and verification succeeded
      logger.info('Successfully logged in and verified');
      setLoading(false);
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      logger.error('Login error details:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        state: {
          username,
          hasPassword: !!password
        }
      });
      setError(error instanceof Error ? error.message : 'An error occurred during login');
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
