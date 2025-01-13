import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert
} from '@mui/material';
import { API_URL } from '../../config';
import { databaseService } from '../../services/DatabaseService';

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
      // Remove /api from API_URL since it's already included
      const baseUrl = API_URL.replace('/api', '');
      
      const response = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Login failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No token received from server');
      }

      // Store the token
      localStorage.setItem('adminToken', data.token);

      try {
        // Use DatabaseService for verification to ensure consistent auth header handling
        const verified = await databaseService.verifyAdminToken();
        if (!verified.verified) {
          throw new Error('Token verification failed');
        }
        
        // Navigate to dashboard
        navigate('/admin/dashboard');
      } catch (verifyError) {
        console.error('Verification error:', verifyError);
        localStorage.removeItem('adminToken');
        throw new Error('Token verification failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      localStorage.removeItem('adminToken');
    } finally {
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
          />

          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default AdminLogin;
