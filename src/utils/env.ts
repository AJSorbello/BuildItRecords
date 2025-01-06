export const getRequiredEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not defined`);
  }
  return value;
};

export const getOptionalEnvVar = (key: string, defaultValue: string = ''): string => {
  return process.env[key] || defaultValue;
};

// Required Spotify configuration
export const SPOTIFY_CONFIG = {
  CLIENT_ID: getRequiredEnvVar('REACT_APP_SPOTIFY_CLIENT_ID'),
  CLIENT_SECRET: getRequiredEnvVar('REACT_APP_SPOTIFY_CLIENT_SECRET'),
  REDIRECT_URI: getRequiredEnvVar('REACT_APP_SPOTIFY_REDIRECT_URI'),
  // Core playlists
  RECORDS_PLAYLIST_ID: getRequiredEnvVar('REACT_APP_SPOTIFY_RECORDS_PLAYLIST_ID'),
  TECH_PLAYLIST_ID: getRequiredEnvVar('REACT_APP_SPOTIFY_TECH_PLAYLIST_ID'),
  DEEP_PLAYLIST_ID: getRequiredEnvVar('REACT_APP_SPOTIFY_DEEP_PLAYLIST_ID'),
  // Optional playlists
  PROGRESSIVE_PLAYLIST_ID: getOptionalEnvVar('REACT_APP_SPOTIFY_PROGRESSIVE_PLAYLIST_ID')
} as const;

// Environment helpers
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';
