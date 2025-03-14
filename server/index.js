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

// Enhanced CORS configuration that handles dynamic domains
const allowedOrigins = [
  'http://localhost:3000', 
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
  allowedOrigins,
  corsFromEnv: process.env.CORS_ORIGIN || 'not set'
});

// Apply CORS middleware with dynamic origin validation
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow any origin in production, but log it for monitoring
    if (process.env.NODE_ENV === 'production') {
      // Always allow known origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Check for vercel preview domains (ajsorbellos-projects.vercel.app)
      if (origin.includes('vercel.app') && 
          (origin.includes('builditrecords') || 
           origin.includes('build-it-records') || 
           origin.includes('ajsorbellos-projects'))) {
        logger.info(`Allowing Vercel preview domain: ${origin}`);
        return callback(null, true);
      }
      
      // In production, allow but log unknown origins for monitoring
      logger.warn(`Allowing request from non-whitelist origin in production: ${origin}`);
      return callback(null, true);
    }
    
    // For development, be stricter about origins
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin in development: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

// CORS preflight response for all routes
app.options('*', cors());

// Add middleware to explicitly set CORS headers for all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    // For Vercel preview domains or known origins, add the explicit header
    if (origin.includes('vercel.app') || 
        origin.includes('builditrecords.com') || 
        allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      // For other origins in production, still set the header
      if (process.env.NODE_ENV === 'production') {
        res.header('Access-Control-Allow-Origin', origin);
      }
    }
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  next();
});

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
        corsMode: process.env.NODE_ENV === 'production' ? 'permissive' : 'strict',
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
