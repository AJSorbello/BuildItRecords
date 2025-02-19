require('dotenv').config();

module.exports = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  labels: {
    'buildit-records': {
      name: 'Build It Records',
      nameVariations: ['Build It Records', 'BuildIt Records', 'Build-It Records'],
      expectedTracks: 439
    },
    'buildit-tech': {
      name: 'Build It Tech',
      nameVariations: ['Build It Tech', 'BuildIt Tech', 'Build-It Tech'],
      expectedTracks: 85
    },
    'buildit-deep': {
      name: 'Build It Deep',
      nameVariations: ['Build It Deep', 'BuildIt Deep', 'Build-It Deep'],
      expectedTracks: 20
    }
  }
};
