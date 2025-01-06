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

interface LoginCredentials {
  username: string;
  password: string;
}

const ADMIN_CREDENTIALS = {
  username: process.env.REACT_APP_ADMIN_USERNAME || 'admin',
  password: process.env.REACT_APP_ADMIN_PASSWORD || 'admin123'
};

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
      // Simple client-side authentication
      if (
        credentials.username === ADMIN_CREDENTIALS.username && 
        credentials.password === ADMIN_CREDENTIALS.password
      ) {
        // Store authentication state
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminUsername', credentials.username);
        
        // Navigate to dashboard
        navigate('/admin/dashboard');
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
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
                '& .MuiInputBase-input': {
                  color: '#fff',
                }
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
                '& .MuiInputBase-input': {
                  color: '#fff',
                }
              }}
            />
            
            {error && (
              <Typography 
                color="error" 
                variant="body2" 
                sx={{ mt: 2, textAlign: 'center' }}
              >
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3, 
                mb: 2,
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0',
                }
              }}
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
