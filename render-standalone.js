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

// Health check endpoints (required by Render)
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

// Import route modules
const artistReleasesRouter = require('./routes/artist-releases');

// Mount API routes
// 1. API Routes at /api path (for compatibility with frontend requests)
app.use('/api/artist-releases', artistReleasesRouter);

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

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

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 BuildItRecords API Server running on port ${PORT}`);
  console.log(`✅ Health check endpoints available at /health and /healthz`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
