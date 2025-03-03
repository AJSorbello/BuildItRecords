const isDevelopment = process.env.NODE_ENV === 'development';

export const config = {
  api: {
    url: isDevelopment ? 'http://localhost:3001/api' : '/api'
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    redirectUri: isDevelopment ? 'http://localhost:3000/callback' : '/callback'
  }
} as const;
