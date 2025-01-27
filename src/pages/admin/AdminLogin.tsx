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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      logger.info('Attempting login with:', { 
        username,
        hasPassword: !!password,
        apiUrl: process.env.REACT_APP_API_URL 
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
      </Paper>
    </Container>
  );
};

export default AdminLogin;
