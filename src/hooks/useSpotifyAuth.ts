import { useState, useEffect, useCallback } from 'react';
import { refreshAccessToken } from '../utils/spotifyAuth';

interface SpotifyAuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useSpotifyAuth = () => {
  const [authState, setAuthState] = useState<SpotifyAuthState>({
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const checkAndRefreshToken = useCallback(async () => {
    const accessToken = localStorage.getItem('spotify_access_token');
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    const tokenExpiry = localStorage.getItem('spotify_token_expiry');

    if (!accessToken || !refreshToken) {
      setAuthState({
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Check if token needs refresh
    if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
      try {
        const data = await refreshAccessToken(refreshToken);
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_token_expiry', String(Date.now() + data.expires_in * 1000));

        setAuthState({
          accessToken: data.access_token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setAuthState({
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to refresh token',
        });
      }
    } else {
      setAuthState({
        accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    checkAndRefreshToken();
  }, [checkAndRefreshToken]);

  const logout = useCallback(() => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    setAuthState({
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    ...authState,
    refreshToken: checkAndRefreshToken,
    logout,
  };
};
