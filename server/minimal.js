// Minimal server for debugging Render deployment issues
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// Detailed startup logging
console.log('======== MINIMAL SERVER STARTING ========');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`PORT: ${PORT}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Server process ID: ${process.pid}`);
console.log(`Node version: ${process.version}`);
console.log('Environment variables:', Object.keys(process.env));
console.log('========================================');

// Super permissive CORS - allow everything
app.use((req, res, next) => {
  // Log every request
  console.log(`${new Date().toISOString()} Request: ${req.method} ${req.url} from ${req.headers.origin || 'unknown'}`);
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Build It Records API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint for artists
app.get('/api/artists', (req, res) => {
  console.log('Artists endpoint called with query:', req.query);
  
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
  console.log('Releases endpoint called with query:', req.query);
  
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

// Start the server on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ Server is running on port ${PORT} and listening on all interfaces`);
  console.log(`Try accessing: http://localhost:${PORT} or the public URL`);
});
