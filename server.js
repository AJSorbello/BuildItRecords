require('dotenv').config();
const express = require('express');
const { setupCommonMiddleware, setupErrorHandling } = require('./middleware/common');
const { getSupabase, getSupabaseAdmin } = require('./utils/database');
const apiRoutes = require('./routes/index');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || process.env.RENDER_PORT || 3001;

// Create Supabase clients
try {
  const supabase = getSupabase();
  const supabaseAdmin = getSupabaseAdmin();
  
  // Make clients available to route handlers
  app.locals.supabase = supabase;
  app.locals.supabaseAdmin = supabaseAdmin;
  
  console.log('Supabase clients initialized successfully');
} catch (err) {
  console.error(`Failed to initialize Supabase clients: ${err.message}`);
  process.exit(1);
}

// Apply common middleware (CORS, body parsing, logging)
setupCommonMiddleware(app);

// Mount API routes under /api
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BuildIt Records API',
    version: process.env.npm_package_version || '0.1.1',
    endpoints: [
      '/api/health',
      '/api/artists',
      '/api/artists/:id',
      '/api/artists/:id/releases',
      '/api/inspect-schema'
    ]
  });
});

// Apply error handling middleware
setupErrorHandling(app);

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} and listening on all interfaces`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; // For testing purposes
