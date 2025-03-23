// Simplified server for Render deployment
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Basic logging
console.log('=============== SERVER STARTING ===============');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`PORT: ${PORT}`);
console.log(`Current directory: ${process.cwd()}`);
console.log('===============================================');

// Define allowed origins
const allowedOrigins = [
  'https://build-it-records.vercel.app',
  'https://build-it-records-h14oi09z2-ajsorbellos-projects.vercel.app',
  'https://build-it-records-git-main-ajsorbellos-projects.vercel.app',
  'https://build-it-records-kx97hqchx-ajsorbellos-projects.vercel.app',
  'https://build-it-records-6r3lg3s9x-ajsorbellos-projects.vercel.app',
  'https://build-it-records-ek4rtnk9w-ajsorbellos-projects.vercel.app',
  'https://build-it-records-itmufu57f-ajsorbellos-projects.vercel.app',
  'https://build-it-records-fuxad54e4-ajsorbellos-projects.vercel.app', 
  'https://builditrecords.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://builditrecords.com'
];

// Configure CORS with specific origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowedOrigins list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } 
    // Check if it's a Vercel preview URL
    else if (origin.includes('vercel.app')) {
      console.log(`Allowing Vercel preview deployment: ${origin}`);
      callback(null, true);
    } 
    else {
      console.log(`CORS blocked request from origin: ${origin}`);
      callback(new Error(`CORS error: Origin ${origin} not allowed`), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  credentials: false,
  maxAge: 86400 
}));

// Enable wildcard CORS for all routes
app.options('*', cors());

// Simple middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} (origin: ${req.headers.origin || 'unknown'})`);
  next();
});

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Build It Records API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'API is operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Database health check endpoint
app.get('/api/db-health', async (req, res) => {
  try {
    // If you have an actual database connection, you can use something like:
    // await db.query('SELECT 1');
    
    // For demonstration, we'll simulate a database check
    if (Math.random() > 0.1) { // 90% success rate for demonstration
      res.json({
        status: 'healthy',
        message: 'Database connection is operational',
        timestamp: new Date().toISOString()
      });
    } else {
      // Simulate occasional database errors
      throw new Error('Simulated database connection error');
    }
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      message: 'Database connection error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint for testing CORS
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API test endpoint successful',
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// CORS diagnostic endpoint
app.get('/api/cors-diagnostic', (req, res) => {
  const origin = req.headers.origin || 'No origin header';
  const referer = req.headers.referer || 'No referer header';
  const host = req.headers.host || 'No host header';
  
  // Get all request headers for debugging
  const headers = { ...req.headers };
  
  // Don't expose potential security-sensitive headers
  delete headers.authorization;
  delete headers.cookie;
  
  // Return diagnostic information
  res.json({
    success: true,
    message: 'CORS diagnostic information',
    data: {
      origin,
      referer,
      host,
      remoteAddress: req.ip || req.connection.remoteAddress,
      requestHeaders: headers,
      allowedOrigins,
      isOriginAllowed: !origin || allowedOrigins.includes(origin),
      corsConfig: {
        credentials: false,
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
      }
    }
  });
});

// Test endpoint for artists
app.get('/api/artists', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Test Artist 1', image_url: 'https://via.placeholder.com/300' },
      { id: 2, name: 'Test Artist 2', image_url: 'https://via.placeholder.com/300' }
    ]
  });
});

// Test endpoint for releases
app.get('/api/releases', (req, res) => {
  // Extract query parameters
  const { label, type } = req.query;
  
  // For debugging, log the query parameters
  console.log('Release endpoint called with query params:', req.query);
  
  let releases = [
    { 
      id: '1', 
      title: 'Test Release 1',
      type: 'album',
      artwork_url: 'https://via.placeholder.com/500',
      spotify_url: 'https://open.spotify.com/album/1234567890'
    },
    { 
      id: '2', 
      title: 'Test Single',
      type: 'single',
      artwork_url: 'https://via.placeholder.com/500',
      spotify_url: 'https://open.spotify.com/album/0987654321'
    },
    { 
      id: '3', 
      title: 'Test EP',
      type: 'single',
      artwork_url: 'https://via.placeholder.com/500',
      spotify_url: 'https://open.spotify.com/album/5555555555'
    },
    { 
      id: '4', 
      title: 'Test Compilation',
      type: 'compilation',
      artwork_url: 'https://via.placeholder.com/500',
      spotify_url: 'https://open.spotify.com/album/6666666666'
    }
  ];
  
  // Apply type filtering if type parameter is provided
  if (type) {
    releases = releases.filter(release => release.type === type);
  }
  
  res.json({
    success: true,
    data: releases
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.originalUrl
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ Server is running on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
});
