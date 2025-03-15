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

// Allow all CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  credentials: true
}));

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

// Test endpoint for testing CORS
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working correctly',
    cors: 'enabled',
    origin: req.headers.origin || 'unknown'
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
  res.json({
    success: true,
    data: [
      { 
        id: 1, 
        title: 'Test Release 1', 
        artwork_url: 'https://via.placeholder.com/500',
        spotify_url: 'https://open.spotify.com/album/1234567890'
      },
      { 
        id: 2, 
        title: 'Test Release 2', 
        artwork_url: 'https://via.placeholder.com/500',
        spotify_url: 'https://open.spotify.com/album/0987654321'
      }
    ]
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
