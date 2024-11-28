const express = require('express');
const path = require('path');
const helmet = require('helmet');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Configure Helmet CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "https:", "data:", "blob:"],
        fontSrc: ["'self'", "https:", "data:"],
        mediaSrc: ["'self'", "https:", "data:"],
        frameSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Import routes
const adminRouter = require('./server/routes/admin');
const trackManagementRouter = require('./server/routes/trackManagement');

// Mount API routes
app.use('/api/admin', adminRouter);
app.use('/api/track-management', trackManagementRouter);

// Spotify API proxy endpoints
app.post('/api/spotify/token', async (req, res) => {
  try {
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post('https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error getting Spotify token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get Spotify token' });
  }
});

app.get('/api/spotify/track/:trackId', async (req, res) => {
  console.log('Received request for track:', req.params.trackId);
  
  try {
    // Get token first
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
    
    console.log('Using credentials:', { 
      clientId: clientId ? 'present' : 'missing', 
      clientSecret: clientSecret ? 'present' : 'missing' 
    });

    if (!clientId || !clientSecret) {
      throw new Error('Missing Spotify credentials');
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    console.log('Requesting Spotify token...');
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        }
      }
    );

    console.log('Token received successfully');
    const token = tokenResponse.data.access_token;

    // Get track details
    console.log('Fetching track details...');
    const trackResponse = await axios.get(
      `https://api.spotify.com/v1/tracks/${req.params.trackId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('Track details received successfully');
    res.json(trackResponse.data);
  } catch (error) {
    console.error('Error in /api/spotify/track/:trackId:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch track details',
      details: error.response?.data || error.message
    });
  }
});

// Add the track details endpoint
app.get('/api/track-details', async (req, res) => {
  try {
    const spotifyUrl = req.query.url;
    if (!spotifyUrl) {
      return res.status(400).json({ error: 'Spotify URL is required' });
    }

    // Extract track ID from Spotify URL
    const trackId = spotifyUrl.split('/track/')[1]?.split('?')[0];
    if (!trackId) {
      return res.status(400).json({ error: 'Invalid Spotify URL format' });
    }

    // Get access token
    const authResponse = await axios.post('https://accounts.spotify.com/api/token', 
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.REACT_APP_SPOTIFY_CLIENT_ID}:${process.env.REACT_APP_SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );

    const accessToken = authResponse.data.access_token;

    // Get track details
    const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const trackData = trackResponse.data;
    
    // Format the response
    const formattedResponse = {
      name: trackData.name,
      artist: trackData.artists[0].name,
      albumArt: trackData.album.images[0]?.url,
      spotifyUrl: trackData.external_urls.spotify,
      previewUrl: trackData.preview_url,
      duration: trackData.duration_ms,
      album: trackData.album.name,
      releaseDate: trackData.album.release_date
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error('Error fetching track details:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch track details',
      details: error.response?.data || error.message 
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = 3001;
console.log(`Server starting on port ${port}...`);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
