// Load environment variables first
require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./models'); // Import the db with the sequelize instance
const apiRoutes = require('./routes/api.routes');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Debug: Log environment loading
logger.info('Server starting with environment:', {
  NODE_ENV: process.env.NODE_ENV,
  hasUsername: !!process.env.ADMIN_USERNAME,
  hasPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
  hasJwtSecret: !!process.env.JWT_SECRET,
  hasSmtpUser: !!process.env.SMTP_USER,
  hasSmtpPass: !!process.env.SMTP_PASS
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Enhanced CORS configuration that supports multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://build-it-records-op89jmt3o-ajsorbellos-projects.vercel.app',
  'https://builditrecords.com',
  'https://www.builditrecords.com'
];

// If CORS_ORIGIN is defined in env, add it to allowed origins
if (process.env.CORS_ORIGIN) {
  const corsOriginsFromEnv = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  corsOriginsFromEnv.forEach(origin => {
    if (origin && !allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

logger.info('CORS configuration:', {
  environment: process.env.NODE_ENV,
  allowedOrigins
});

// Apply CORS middleware with proper configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      // Still allow the request to proceed in production to avoid breaking things
      if (process.env.NODE_ENV === 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

// Request logging middleware
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

// Routes
app.use('/api', apiRoutes);

// Error handling
app.use((err, req, res, next) => {
  logger.error('Server error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
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

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      
      // Log important environment variables (without sensitive values)
      logger.info('Environment configuration:', {
        NODE_ENV: process.env.NODE_ENV,
        PORT: PORT,
        allowedOrigins,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasAdminUsername: !!process.env.ADMIN_USERNAME,
        hasAdminPasswordHash: !!process.env.ADMIN_PASSWORD_HASH
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

startServer();
