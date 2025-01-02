require('dotenv').config();
const config = require('./config/environment');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { sequelize } = require('./models');
const SpotifyService = require('./services/SpotifyService');
const apiRoutes = require('./routes/api.routes');
const { setupSpotifyRoutes } = require('./routes/spotify.routes');
const { setupAuthRoutes } = require('./routes/auth.routes');

const app = express();

// Initialize services
const initServices = async () => {
  try {
    // Initialize database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    const spotifyService = new SpotifyService();
    console.log('Spotify service initialized successfully');

    return { spotifyService };
  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw error;
  }
};

// Initialize Express routes and middleware
const initExpress = (spotifyService) => {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  
  // CORS configuration
  app.use(cors({
    origin: config.env === 'production' 
      ? ['https://your-production-domain.com'] 
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../build')));

  // API routes
  app.use('/api', apiRoutes);
  setupSpotifyRoutes(app, spotifyService);
  setupAuthRoutes(app);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Root route
  app.get('/', (req, res) => {
    res.json({ 
      status: 'ok',
      message: 'Build It Records API Server',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        api: '/api/*',
        spotify: '/spotify/*',
        auth: '/auth/*'
      }
    });
  });

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
};

// Start server
const startServer = async () => {
  try {
    const { spotifyService } = await initServices();
    initExpress(spotifyService);

    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log('Available routes:');
      console.log('get /health');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
