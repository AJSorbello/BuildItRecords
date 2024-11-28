const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const helmet = require('helmet');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = 3001; // Changed default port to 3001

// Enable CORS for development
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Configure Helmet with CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "https://api.spotify.com", "https://accounts.spotify.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        frameSrc: ["'self'"],
        formAction: ["'self'"]
      },
    },
  })
);

// API Routes
app.get('/api/spotify/track/:trackId', async (req, res) => {
  console.log('Received request for track:', req.params.trackId);
  
  try {
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
    
    console.log('Environment check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      nodeEnv: process.env.NODE_ENV
    });

    if (!clientId || !clientSecret) {
      console.error('Missing Spotify credentials');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing Spotify credentials'
      });
    }

    // Get access token
    console.log('Requesting Spotify access token...');
    let tokenResponse;
    try {
      tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'client_credentials'
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
          }
        }
      );
      console.log('Access token received successfully');
    } catch (tokenError) {
      console.error('Token request failed:', {
        status: tokenError.response?.status,
        data: tokenError.response?.data,
        message: tokenError.message
      });
      return res.status(401).json({
        error: 'Authentication failed',
        details: 'Failed to obtain Spotify access token'
      });
    }

    if (!tokenResponse.data.access_token) {
      console.error('No access token in response:', tokenResponse.data);
      return res.status(500).json({
        error: 'Authentication failed',
        details: 'Invalid token response from Spotify'
      });
    }

    // Get track details
    console.log('Fetching track details from Spotify...');
    let trackResponse;
    try {
      trackResponse = await axios.get(
        `https://api.spotify.com/v1/tracks/${req.params.trackId}`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResponse.data.access_token}`,
            'Accept': 'application/json'
          }
        }
      );
      console.log('Track details received successfully');
    } catch (trackError) {
      console.error('Track request failed:', {
        status: trackError.response?.status,
        data: trackError.response?.data,
        message: trackError.message
      });

      if (trackError.response?.status === 404) {
        return res.status(404).json({
          error: 'Track not found',
          details: 'The requested track does not exist'
        });
      }

      if (trackError.response?.status === 401) {
        return res.status(401).json({
          error: 'Authentication failed',
          details: 'Invalid or expired access token'
        });
      }

      return res.status(trackError.response?.status || 500).json({
        error: 'Spotify API error',
        details: trackError.response?.data?.error?.message || 'Failed to fetch track details'
      });
    }

    // Validate track data
    if (!trackResponse.data || !trackResponse.data.id) {
      console.error('Invalid track data received:', trackResponse.data);
      return res.status(500).json({
        error: 'Invalid response',
        details: 'Received invalid track data from Spotify'
      });
    }

    // Send the track data
    res.json(trackResponse.data);

  } catch (error) {
    console.error('Unexpected error in Spotify endpoint:', {
      message: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Internal server error',
      details: 'An unexpected error occurred while processing your request'
    });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
}

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
