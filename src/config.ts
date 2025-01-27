export const config = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  SPOTIFY_CLIENT_ID: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET,
  JWT_SECRET: process.env.JWT_SECRET || 'buildit_records_jwt_secret_2025'
};
