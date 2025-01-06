require('dotenv').config();

module.exports = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3001/callback',
  labels: {
    'buildit-tech': {
      name: 'Build It Tech',
      // List of Spotify artist IDs that have released on this label
      artists: [
        // Example: '2CIMQHirSU0MQqyYHq0eOx',
        // Add artist IDs here
      ]
    },
    'buildit-records': {
      name: 'Build It Records',
      artists: []
    },
    'buildit-deep': {
      name: 'Build It Deep',
      artists: []
    }
  }
};
