// Simplified standalone server for Render deployment
const express = require('express');
const cors = require('cors');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Log request details
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BuildIt Records API is running',
    version: '0.1.1'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BuildIt Records API is healthy',
    version: process.env.npm_package_version || '0.1.1',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Additional health check endpoint for Render's specific path
app.get('/healthz', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BuildIt Records API is healthy',
    version: process.env.npm_package_version || '0.1.1',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Enhanced diagnostic endpoint
app.get('/api/diagnostic', (req, res) => {
  // Check environment variables
  const environmentVars = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    PORT: process.env.PORT || 'not set',
    SUPABASE_URL: process.env.SUPABASE_URL ? 'set' : 'not set',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'set' : 'not set',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'not set'
  };

  res.status(200).json({
    success: true,
    message: 'Diagnostic information',
    data: {
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      server: 'render-standalone',
      environment_variables: environmentVars,
      headers: req.headers
    }
  });
});

// Basic API routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API health check passed',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error processing ${req.method} ${req.url}:`, err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Render standalone server running on port ${PORT} and listening on all interfaces (0.0.0.0)`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
