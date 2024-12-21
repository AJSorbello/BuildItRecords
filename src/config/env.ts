export const env = {
  spotify: {
    clientId: process.env.REACT_APP_SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || '',
    redirectUri: process.env.REACT_APP_SPOTIFY_REDIRECT_URI || '',
    recordsPlaylistId: process.env.REACT_APP_SPOTIFY_RECORDS_PLAYLIST_ID || '',
    deepPlaylistId: process.env.REACT_APP_SPOTIFY_DEEP_PLAYLIST_ID || '',
    techPlaylistId: process.env.REACT_APP_SPOTIFY_TECH_PLAYLIST_ID || ''
  },
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
  }
};
