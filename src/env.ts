
declare global {
  interface Window {
    ENV?: {
      API_URL?: string;
      SPOTIFY_CLIENT_ID?: string;
      SPOTIFY_REDIRECT_URI?: string;
      SPOTIFY_API_BASE_URL?: string;
      SPOTIFY_ACCOUNTS_URL?: string;
      SPOTIFY_SCOPES?: string;
      NODE_ENV?: string;
    };
  }
}

// These values will be replaced during build time by the server
const defaultEnv = {
  API_URL: 'http://localhost:3001/api',
  SPOTIFY_CLIENT_ID: '',
  SPOTIFY_REDIRECT_URI: '',
  SPOTIFY_API_BASE_URL: 'https://api.spotify.com/v1',
  SPOTIFY_ACCOUNTS_URL: 'https://accounts.spotify.com',
  SPOTIFY_SCOPES: '',
  NODE_ENV: 'development'
};

// In browser, use window.ENV; in Node.js, use process.env
const env = typeof window !== 'undefined' && window.ENV
  ? window.ENV
  : defaultEnv;

export { env };
