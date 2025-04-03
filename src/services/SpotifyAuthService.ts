import { useState, useEffect } from 'react';

// Define your Spotify application credentials
// You will need to register your app in the Spotify Developer Dashboard
// https://developer.spotify.com/dashboard/applications
const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID || 'YOUR_CLIENT_ID'; // Add your client ID to .env file
const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI || `${window.location.origin}/spotify-callback`;
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const RESPONSE_TYPE = 'token';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-read-currently-playing'
];

// Generate a random state string to prevent CSRF attacks
const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values)
    .map(x => possible[x % possible.length])
    .join('');
};

// Save token data to localStorage
export const saveTokenData = (token: string, expiresIn: number) => {
  const now = new Date();
  const expiryTime = now.getTime() + expiresIn * 1000;
  
  localStorage.setItem('spotifyToken', token);
  localStorage.setItem('spotifyTokenExpiry', expiryTime.toString());
};

// Get token from localStorage
export const getStoredToken = () => {
  const token = localStorage.getItem('spotifyToken');
  const expiryTimeStr = localStorage.getItem('spotifyTokenExpiry');
  
  if (!token || !expiryTimeStr) {
    return null;
  }

  const expiryTime = parseInt(expiryTimeStr, 10);
  const now = new Date().getTime();
  
  // Check if token is expired
  if (now > expiryTime) {
    // Clear expired token
    localStorage.removeItem('spotifyToken');
    localStorage.removeItem('spotifyTokenExpiry');
    return null;
  }
  
  return token;
};

// Get the login URL for Spotify authorization
export const getSpotifyLoginUrl = () => {
  const state = generateRandomString(16);
  localStorage.setItem('spotify_auth_state', state);
  
  const args = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: RESPONSE_TYPE,
    scope: SCOPES.join(' '),
    state: state,
    show_dialog: 'true'
  });
  
  return `${AUTH_ENDPOINT}?${args.toString()}`;
};

// Custom hook to manage Spotify authentication
export const useSpotifyAuth = () => {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has a premium account
  const checkPremiumStatus = async (accessToken: string) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await response.json();
      setIsPremium(data.product === 'premium');
      return data.product === 'premium';
    } catch (err) {
      console.error('Error checking premium status:', err);
      setError('Failed to check premium status');
      return false;
    }
  };

  // Trigger Spotify login
  const login = () => {
    window.location.href = getSpotifyLoginUrl();
  };

  // Log out from Spotify
  const logout = () => {
    localStorage.removeItem('spotifyToken');
    localStorage.removeItem('spotifyTokenExpiry');
    setToken(null);
    setIsPremium(null);
  };
  
  // Check URL for token on component mount and when URL changes
  useEffect(() => {
    const checkUrlForToken = async () => {
      const hash = window.location.hash;
      
      if (hash) {
        setLoading(true);
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');
        const state = params.get('state');
        const storedState = localStorage.getItem('spotify_auth_state');
        
        // Verify state to prevent CSRF attacks
        if (state !== storedState) {
          setError('State verification failed. Possible CSRF attack.');
          setLoading(false);
          return;
        }
        
        if (accessToken && expiresIn) {
          saveTokenData(accessToken, parseInt(expiresIn, 10));
          setToken(accessToken);
          
          // Check premium status
          await checkPremiumStatus(accessToken);
          
          // Clear the URL fragment
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        setLoading(false);
      }
    };
    
    checkUrlForToken();
    
    // Check stored token
    const storedToken = getStoredToken();
    if (storedToken && !token) {
      setToken(storedToken);
      checkPremiumStatus(storedToken);
    }
  }, [token]);
  
  return { token, isPremium, loading, error, login, logout };
};

// Export a function to get a track's Spotify URI from its ID
export const getSpotifyUriFromId = (id: string, type: 'track' | 'album' | 'artist' = 'track'): string => {
  return `spotify:${type}:${id}`;
};

// Extract Spotify ID from a Spotify URL
export const getSpotifyIdFromUrl = (url: string): string | null => {
  // Pattern for Spotify track URLs: https://open.spotify.com/track/1234567890
  const pattern = /spotify\.com\/(track|album|artist)\/([a-zA-Z0-9]+)/;
  const match = url.match(pattern);
  
  if (match && match[2]) {
    return match[2];
  }
  
  return null;
};
