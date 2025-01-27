export const SPOTIFY_CONFIG = {
  CLIENT_ID: process.env.REACT_APP_SPOTIFY_CLIENT_ID || '',
  CLIENT_SECRET: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || '',
  REDIRECT_URI: process.env.REACT_APP_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback',
} as const;

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001'
} as const;
