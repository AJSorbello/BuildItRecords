// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const models = require('./models');
const SpotifyService = require('./services/SpotifyService');
const apiRoutes = require('./routes/api.routes');
const healthCheckRoutes = require('./routes/health-check');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route - must be before API routes
app.use('/api', healthCheckRoutes);

// API Routes
app.use('/api', apiRoutes);

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  // Serve static assets from /dist directory for Vite builds
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
} else {
  app.use(express.static(path.join(__dirname, '../build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something broke!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Connect to database and start server
try {
  console.log('Starting server...');
  // Check if we're in Vercel environment
  if (process.env.VERCEL) {
    console.log('Running in Vercel environment, skipping Sequelize sync');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } else {
    // Regular database initialization
    models.sequelize.sync()
      .then(() => {
        app.listen(PORT, () => {
          console.log(`Server is running on port ${PORT}`);
        });
      })
      .catch(err => {
        console.error('Unable to connect to the database:', err);
      });
  }
} catch (error) {
  console.error('Server initialization error:', error);
}
