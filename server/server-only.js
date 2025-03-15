// Ultra-minimal server with zero dependencies for Render
// This will help isolate if the issue is with dependencies or something else
const http = require('http');

// Print environment information for debugging
console.log('===== ULTRA MINIMAL SERVER STARTING =====');
console.log(`PORT: ${process.env.PORT || 10000}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`Current directory: ${process.cwd()}`);
console.log('=======================================');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Log all requests
  console.log(`${new Date().toISOString()} - Request: ${req.method} ${req.url}`);
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
  
  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check - root endpoint
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'BuildIt Records API is running',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Test API endpoint - artists
  if (req.url.startsWith('/api/artists')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: [
        { id: 1, name: 'Test Artist 1', image_url: 'https://via.placeholder.com/300' },
        { id: 2, name: 'Test Artist 2', image_url: 'https://via.placeholder.com/300' }
      ]
    }));
    return;
  }
  
  // Test API endpoint - releases
  if (req.url.startsWith('/api/releases')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
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
    }));
    return;
  }
  
  // Default 404 handler
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: 'Not found',
    path: req.url
  }));
});

// Start server on all network interfaces
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ Server running on port ${PORT} (no dependencies used)`);
  console.log(`Health check URL: http://localhost:${PORT}/health`);
});
