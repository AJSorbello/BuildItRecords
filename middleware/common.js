const cors = require('cors');
const bodyParser = require('body-parser');

/**
 * Configure common middleware for the Express app
 * @param {Object} app - Express app instance
 */
function setupCommonMiddleware(app) {
  // Read CORS origins from environment
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || ['*'];
  console.log('Configured CORS allowed origins:', allowedOrigins);

  // Enable CORS for all routes with proper configuration
  app.use(cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1 && allowedOrigins[0] !== '*') {
        console.log(`CORS blocked origin: ${origin}`);
        console.log(`Allowed origins:`, allowedOrigins);
      }
      
      // Allow any of the configured origins or all origins if '*' is set
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins[0] === '*' || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow credentials (cookies, auth headers, etc)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  }));
  
  // Parse JSON request bodies
  app.use(bodyParser.json());
  
  // Parse URL-encoded request bodies
  app.use(bodyParser.urlencoded({ extended: true }));
  
  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
  
  // Add database clients to request
  app.use((req, res, next) => {
    // These will be initialized in server.js and attached to app.locals
    req.supabase = req.app.locals.supabase;
    req.supabaseAdmin = req.app.locals.supabaseAdmin;
    next();
  });
}

/**
 * Configure error handling middleware for the Express app
 * @param {Object} app - Express app instance
 */
function setupErrorHandling(app) {
  // 404 handler
  app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.url}`,
      data: null
    });
  });
  
  // Global error handler
  app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.stack || err.message || err}`);
    
    res.status(err.status || 500).json({
      success: false,
      message: 'An error occurred while processing your request',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  });
}

module.exports = {
  setupCommonMiddleware,
  setupErrorHandling
};
