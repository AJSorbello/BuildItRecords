import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
} from '@mui/material';
import { API_URL } from '../../config';

interface LoginCredentials {
  username: string;
  password: string;
}

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      // Store the JWT token
      localStorage.setItem('adminToken', data.token);
      
      // Navigate to dashboard
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during login');
    }
  };

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212'
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#1E1E1E'
          }}
        >
          <Typography 
            component="h1" 
            variant="h4" 
            sx={{ 
              mb: 3,
              color: '#fff'
            }}
          >
            Admin Login
          </Typography>

          <Box 
            component="form" 
            onSubmit={handleSubmit}
            sx={{
              width: '100%',
              mt: 1
            }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={credentials.username}
              onChange={handleChange}
              error={!!error}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#666',
                  },
                  '&:hover fieldset': {
                    borderColor: '#999',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#999',
                },
                '& .MuiOutlinedInput-input': {
                  color: '#fff',
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleChange}
              error={!!error}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#666',
                  },
                  '&:hover fieldset': {
                    borderColor: '#999',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#999',
                },
                '& .MuiOutlinedInput-input': {
                  color: '#fff',
                },
              }}
            />
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminLogin;
