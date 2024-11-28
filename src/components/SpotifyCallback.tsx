import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '../utils/spotifyAuth';

const SpotifyCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const storedState = localStorage.getItem('state');
      
      // Verify state to prevent CSRF attacks
      if (state === null || state !== storedState) {
        setError('State verification failed');
        return;
      }

      if (code) {
        try {
          const data = await getAccessToken(code);
          
          // Store tokens securely
          localStorage.setItem('spotify_access_token', data.access_token);
          localStorage.setItem('spotify_refresh_token', data.refresh_token);
          localStorage.setItem('spotify_token_expiry', String(Date.now() + data.expires_in * 1000));
          
          // Clean up
          localStorage.removeItem('state');
          localStorage.removeItem('code_verifier');
          
          // Redirect to home or dashboard
          navigate('/');
        } catch (err) {
          setError('Failed to get access token');
          console.error(err);
        }
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div>Loading...</div>;
};

export default SpotifyCallback;
