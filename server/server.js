require('dotenv').config({ path: './.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');
const { validateSpotifyUrl } = require('./utils/validation');
const { classifyTrack } = require('./utils/trackClassifier');

// Initialize Express app
const app = express();
app.set('trust proxy', 1); // Trust first proxy
const port = process.env.PORT || 3001;

// Redis client setup
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Caching middleware
const cacheMiddleware = async (req, res, next) => {
  try {
    const cacheKey = `spotify:${req.originalUrl}`;
    const cachedData = await redis.get(cacheKey);
    
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      redis.setex(cacheKey, 3600, JSON.stringify(body)); // Cache for 1 hour
      res.sendResponse(body);
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

// Import routes
const tracksRouter = require('./routes/tracks');
const artistsRouter = require('./routes/artists');
const albumsRouter = require('./routes/albums');
const processRouter = require('./routes/process');

// Use routes
app.use('/api/tracks', cacheMiddleware, tracksRouter);
app.use('/api/artists', cacheMiddleware, artistsRouter);
app.use('/api/albums', cacheMiddleware, albumsRouter);
app.use('/api/process', processRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Spotify endpoint
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

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
