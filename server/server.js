// Load environment variables first
require('dotenv').config();

// Debug: Log environment loading
console.log('Server starting with environment:', process.env.NODE_ENV);
console.log('Admin credentials loaded:', {
  hasUsername: !!process.env.ADMIN_USERNAME,
  hasPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
  hasJwtSecret: !!process.env.JWT_SECRET,
  actualHash: process.env.ADMIN_PASSWORD_HASH
});

const config = require('./config/environment');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const db = require('./models');
const SpotifyService = require('./services/spotifyService');
const apiRoutes = require('./routes/api.routes');
const adminRoutes = require('./routes/admin');

const app = express();

// Initialize services
const initServices = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established successfully');
    
    const spotifyService = new SpotifyService({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3001/callback'
    });
    await spotifyService.initialize();
    console.log('Spotify service initialized successfully');

    return { spotifyService, db, sequelize: db.sequelize };
  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw error;
  }
};

// Initialize Express routes and middleware
const initExpress = (spotifyService, db, sequelize) => {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes
  app.use('/api', apiRoutes);

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../build')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../build/index.html'));
    });
  }

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  return app;
};

const startServer = async () => {
  try {
    const { spotifyService, db, sequelize } = await initServices();
    const app = initExpress(spotifyService, db, sequelize);

    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
