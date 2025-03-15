// Load environment variables first
require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./models'); // Import the db with the sequelize instance
const apiRoutes = require('./routes/api.routes');
const logger = require('./utils/logger');

const app = express();
// CRITICAL: Use the PORT that Render assigns, default to 3001 for local development
const PORT = process.env.PORT || 3001;

// Log the environment very early for debugging
console.log('============= SERVER STARTING =============');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`PORT: ${PORT}`);
console.log(`Current directory: ${process.cwd()}`);
console.log('============================================');

// Debug: Log environment loading
logger.info('Server starting with environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  hasUsername: !!process.env.ADMIN_USERNAME,
  hasPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
  hasJwtSecret: !!process.env.JWT_SECRET,
  hasSmtpUser: !!process.env.SMTP_USER,
  hasSmtpPass: !!process.env.SMTP_PASS,
  currentDir: process.cwd()
});

// Add uncaught exception handler to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Server will continue running:');
  console.error(err);
  logger.error('Uncaught exception', {
    error: err.message,
    stack: err.stack
  });
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CRITICAL FIX: Use permissive CORS that will always work
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log all requests with their origin for debugging
  console.log(`Request from origin: ${origin || 'unknown'} to ${req.method} ${req.url}`);
  
  // Always allow all origins in production for stability
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return res.status(204).end();
  }
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request:', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    origin: req.get('origin')
  });
  next();
});

// Mount main API router
app.use('/api', apiRoutes);

// Basic route for testing server health
app.get('/', (req, res) => {
  res.json({
    message: 'Build It Records API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Application error handler
app.use((err, req, res, next) => {
  logger.error('Application error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle 404
app.use('*', (req, res) => {
  logger.warn('404 Not Found:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });
  res.status(404).json({ 
    error: 'Not found',
    path: req.originalUrl
  });
});

async function startServer() {
  try {
    // Use the sequelize instance from models/index.js instead of creating a new one
    // Test the connection, but don't exit if it fails
    try {
      await db.sequelize.authenticate();
      logger.info('Database connection verified successfully');
    } catch (dbError) {
      logger.error('Database connection verification failed, but continuing startup:', {
        error: dbError.message,
        stack: dbError.stack
      });
      // Don't exit here - allow the server to start anyway
    }

    // Start server and explicitly log which port we're binding to
    // This is CRITICAL for Render to work properly
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`⚡ Server is running on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV})`);
      logger.info(`Server started successfully on port ${PORT}`);
      
      // Log important environment variables (without sensitive values)
      logger.info('Environment configuration:', {
        NODE_ENV: process.env.NODE_ENV,
        PORT: PORT,
        listening: true,
        address: server.address(),
        corsMode: process.env.NODE_ENV === 'production' ? 'permissive' : 'strict',
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasAdminUsername: !!process.env.ADMIN_USERNAME,
        hasAdminPasswordHash: !!process.env.ADMIN_PASSWORD_HASH
      });
    });

    // Log any server errors
    server.on('error', (err) => {
      console.error('SERVER ERROR:', err);
      logger.error('Server error event:', {
        error: err.message,
        stack: err.stack
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', {
      error: error.message,
      stack: error.stack
    });
    // Don't exit process, but log the error
    logger.warn('Server startup encountered errors but will attempt to continue');
  }
}

// Immediately invoked function to allow for top-level await
(async () => {
  console.log('Starting server initialization...');
  await startServer();
  console.log('Server initialization complete.');
})();
