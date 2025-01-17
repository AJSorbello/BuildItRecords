/**
 * @fileoverview Main application entry point
 * @module app
 */

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swagger');
const logger = require('./utils/logger');

// Import routes
const adminRoutes = require('./routes/admin');
const trackRoutes = require('./routes/tracks');
const apiRoutes = require('./routes/api.routes');

// Import middleware
const { securityHeaders, corsMiddleware, preventSqlInjection, preventXss, requestSizeLimiter } = require('./middleware/security');
const { limiter, getTierLimiter } = require('./middleware/rateLimit');
const { validateApiKey } = require('./middleware/validation');

// Load environment variables
dotenv.config();

const app = express();

// Apply security middleware
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(requestSizeLimiter);
app.use(preventSqlInjection);
app.use(preventXss);

// Apply rate limiting
app.use(limiter);
app.use(validateApiKey);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../build')));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Build It Records API Documentation',
}));

// Spotify callback route
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  logger.info('Spotify callback received:', { code: code ? 'present' : 'missing' });
  
  try {
    // Store the authorization code or handle the callback as needed
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/admin?code=${code}`);
  } catch (error) {
    logger.error('Error in Spotify callback:', error);
    res.status(500).json({ error: 'Failed to handle Spotify callback' });
  }
});

// API Routes
app.use('/api', apiRoutes); // Mount the main API router first
app.use('/api/admin', adminRoutes);
app.use('/api/tracks', trackRoutes);

// Log all requests
app.use((req, res, next) => {
  logger.info('Incoming request:', {
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.method === 'POST' ? req.body : undefined,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'present' : 'missing'
    }
  });
  next();
});

// Log registered routes
logger.info('Registered routes:');
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    logger.info(`${Object.keys(middleware.route.methods).join(',')} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        logger.info(`${Object.keys(handler.route.methods).join(',')} ${handler.route.path}`);
      }
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error:', {
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Don't expose internal error details to client
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Catch-all route for debugging
app.use('*', (req, res) => {
  logger.warn('404 Not Found:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// Handle 404
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ message: 'API endpoint not found' });
  } else {
    // Serve React app for all other routes
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  }
});

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    const { pool } = require('./utils/db');
    const { initializeDatabase } = require('./config/database');
    await initializeDatabase();
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
      
      // Log important environment variables (without sensitive values)
      logger.info('Environment configuration:', {
        NODE_ENV: process.env.NODE_ENV,
        PORT: PORT,
        CORS_ORIGIN: process.env.CORS_ORIGIN,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasAdminUsername: !!process.env.ADMIN_USERNAME,
        hasAdminPasswordHash: !!process.env.ADMIN_PASSWORD_HASH
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
