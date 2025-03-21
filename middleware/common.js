const bodyParser = require('body-parser');

/**
 * Configure common middleware for the Express app
 * @param {Object} app - Express app instance
 */
function setupCommonMiddleware(app) {
  // Enable required middleware including Express body parsing
  // Read CORS origins from environment or default to all
  const corsOrigins = process.env.CORS_ORIGIN || '*';
  console.log('CORS configuration:', { corsOrigins });

  // Simple CORS configuration that won't crash the server
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).send();
    }
    next();
  });

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
