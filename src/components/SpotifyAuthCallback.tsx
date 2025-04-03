import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSpotifyAuth } from '../services/SpotifyAuthService';

/**
 * Component to handle the callback from Spotify OAuth authentication
 */
const SpotifyAuthCallback: React.FC = () => {
  const { token, loading, error } = useSpotifyAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect back to home page after auth is processed
    if (!loading && (token || error)) {
      // Short delay to ensure token is saved
      const timer = setTimeout(() => {
        navigate('/');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [token, loading, error, navigate]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '50vh',
        p: 3,
        textAlign: 'center'
      }}
    >
      {loading ? (
        <>
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Authenticating with Spotify...
          </Typography>
        </>
      ) : error ? (
        <>
          <Typography variant="h6" color="error">
            Authentication Error
          </Typography>
          <Typography variant="body1" color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Redirecting you back...
          </Typography>
        </>
      ) : token ? (
        <>
          <Typography variant="h6" color="success.main">
            Successfully connected to Spotify!
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Redirecting you back to Build It Records...
          </Typography>
        </>
      ) : null}
    </Box>
  );
};

export default SpotifyAuthCallback;
