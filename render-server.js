require('dotenv').config();
const express = require('express');
const { setupCommonMiddleware, setupErrorHandling } = require('./middleware/common');
const { getSupabase, getSupabaseAdmin } = require('./utils/database');
const apiRoutes = require('./routes/index');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

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

// Mount API routes at both root and /api paths for maximum compatibility
app.use('/', apiRoutes);
app.use('/api', apiRoutes);

// Specific health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BuildIt Records API is healthy',
    version: process.env.npm_package_version || '0.1.1',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Apply error handling middleware
setupErrorHandling(app);

// Start the server - IMPORTANT: binding to 0.0.0.0 is critical for Render
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Render server running on port ${PORT} and listening on all interfaces`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL ? 'Configured' : 'Missing'}`);
  console.log(`Supabase Anon Key: ${process.env.SUPABASE_ANON_KEY ? 'Configured' : 'Missing'}`);
});

module.exports = app; // For testing purposes
