require('dotenv').config();
const express = require('express');
const { setupCommonMiddleware, setupErrorHandling } = require('./middleware/common');
const { getSupabase, getSupabaseAdmin } = require('./utils/database');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Import route handlers from existing API files
const artistHandler = require('./api/artist');
const artistReleasesHandler = require('./api/artist-releases');
const inspectSchemaHandler = require('./api/inspect-schema');

// Artist routes (support both singular and plural forms)
app.get('/api/artist', (req, res) => artistHandler(req, res));
app.get('/api/artists', (req, res) => artistHandler(req, res));

// Artist by ID routes (support both singular and plural forms)
app.get('/api/artist/:id', (req, res) => {
  const artistId = req.params.id;
  return artistHandler(req, res, artistId);
});
app.get('/api/artists/:id', (req, res) => {
  const artistId = req.params.id;
  return artistHandler(req, res, artistId);
});

// Artist releases routes (support both singular and plural forms)
app.get('/api/artist-releases/:artistId', (req, res) => {
  const artistId = req.params.artistId;
  console.log(`[server] Handling artist releases request for ${artistId}`);
  return artistReleasesHandler(req, res, artistId);
});
app.get('/api/artists/:artistId/releases', (req, res) => {
  const artistId = req.params.artistId;
  console.log(`[server] Handling artist releases (plural) request for ${artistId}`);
  return artistReleasesHandler(req, res, artistId);
});

// Schema inspection endpoint
app.get('/api/inspect-schema', (req, res) => inspectSchemaHandler(req, res));

// Apply error handling middleware
setupErrorHandling(app);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; // For testing purposes
