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
  username: 'admin',
  password: 'admin123' // You should change this in production
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      setError('Invalid credentials');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, backgroundColor: '#282828' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: '#FFFFFF' }}>
            Admin Login
          </Typography>
          
          {error && (
            <Typography color="error" align="center" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              margin="normal"
              label="Username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
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
                  color: '#FFF',
                },
              }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleChange}
              required
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
                  color: '#FFF',
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                mt: 3,
                backgroundColor: '#02FF95',
                color: '#121212',
                '&:hover': {
                  backgroundColor: '#00CC76',
                },
              }}
            >
              Login
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminLogin;
