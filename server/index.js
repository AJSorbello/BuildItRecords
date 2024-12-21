require('dotenv').config();
const config = require('./config/environment');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { sequelize } = require('./models');
const SpotifyService = require('./services/SpotifyService');
const { setupSpotifyRoutes } = require('./routes/spotify.routes');
const { setupApiRoutes } = require('./routes/api.routes');
const { setupAuthRoutes } = require('./routes/auth.routes');
const syncRoutes = require('./routes/sync');
const releasesRoutes = require('./routes/releases');

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

  // Setup routes
  app.use('/api/sync', syncRoutes);
  app.use('/api/releases', releasesRoutes);
  setupSpotifyRoutes(app);
  setupApiRoutes(app);
  setupAuthRoutes(app);

  // Serve static files in production
  if (config.env === 'production') {
    app.use(express.static(path.join(__dirname, '../build')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../build', 'index.html'));
    });
  }
};

// Start server
const startServer = async () => {
  try {
    const { spotifyService } = await initServices();
    initExpress(spotifyService);

    const port = config.port;
    app.listen(port, () => {
      console.log(`Server running on port ${port} in ${config.env} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
