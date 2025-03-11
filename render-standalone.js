// Simplified standalone server for Render deployment
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { getSupabase, getSupabaseAdmin } = require('./utils/database');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Create Supabase client instances
let supabase, supabaseAdmin;
try {
  supabase = getSupabase();
  supabaseAdmin = getSupabaseAdmin();
  console.log('✅ Supabase client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error.message);
}

// Store Supabase clients in app.locals for access in route handlers
app.locals.supabase = supabase;
app.locals.supabaseAdmin = supabaseAdmin;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Request logging

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoints (required by Render) - MUST BE DEFINED BEFORE ANY OTHER ROUTES
app.get('/health', (req, res) => {
  console.log('Health check received at /health');
  res.status(200).json({ 
    status: 'ok',
    time: new Date().toISOString(),
    message: 'BuildItRecords API is running'
  });
});

app.get('/healthz', (req, res) => {
  console.log('Health check received at /healthz');
  res.status(200).json({ 
    status: 'ok',
    time: new Date().toISOString(),
    message: 'BuildItRecords API is running'
  });
});

// Root path handler
app.get('/', (req, res) => {
  console.log('Request received at root path');
  res.status(200).json({
    status: 'online',
    message: 'BuildItRecords API is running',
    version: '0.1.1',
    endpoints: [
      '/health',
      '/healthz',
      '/api/artists',
      '/api/artists/:id',
      '/api/releases',
      '/api/releases/:id',
      '/api/artist-releases/:id'
    ]
  });
});

// Import route modules
const artistReleasesRouter = require('./routes/artist-releases');

// Mount API routes
// 1. API Routes at /api path (for compatibility with frontend requests)
app.use('/api/artist-releases', artistReleasesRouter);

// Simplified API for common endpoints
app.get('/api/artists', async (req, res) => {
  try {
    const labelId = req.query.label;
    let query = supabase.from('artists').select('*');
    
    // Filter by label if provided
    if (labelId) {
      query = query.eq('label_id', labelId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error(`Error fetching artists: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/artists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error(`Error fetching artist: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/releases', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('releases')
      .select('*');
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error(`Error fetching releases: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.get('/api/releases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('releases')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error(`Error fetching release: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Also mount routes at root for compatibility with some frontend configurations
app.use('/artist-releases', artistReleasesRouter);

// Enhanced diagnostic endpoint
app.get('/api/diagnostic', (req, res) => {
  const diagnosticInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    processUptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    platform: process.platform,
    hostname: require('os').hostname(),
    cpuInfo: require('os').cpus(),
    networkInterfaces: require('os').networkInterfaces(),
    envVars: {
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV,
      // Don't expose sensitive information
      SUPABASE_URL: process.env.SUPABASE_URL ? '[REDACTED]' : 'not set',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '[REDACTED]' : 'not set',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '[REDACTED]' : 'not set'
    }
  };
  
  res.status(200).json({
    success: true,
    message: 'API diagnostic information',
    data: diagnosticInfo
  });
});

// Handle 404 - Keep this as the last route
app.use((req, res) => {
  console.error(`404 - Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BuildItRecords API Server running on port ${PORT} and listening on all interfaces (0.0.0.0)`);
  console.log(`✅ Health check endpoints available at /health and /healthz`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
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

module.exports = app;
