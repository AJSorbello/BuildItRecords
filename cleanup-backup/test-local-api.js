// Local API Test Script
// This script tests the API endpoints locally by running a simple HTTP server
// and making requests to the API endpoints

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Set up environment variables from .env file
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const matches = line.match(/^([^=]+)=(.*)$/);
    if (matches) {
      process.env[matches[1]] = matches[2].replace(/^['"](.*)['"]$/, '$1');
    }
  });
} catch (error) {
  console.log('No .env file found or error reading it. Using existing environment variables.');
}

// Import the API endpoint handlers
const artistsHandler = require('./api/artists/index.js');
const releasesHandler = require('./api/releases/index.js');
const diagnosticHandler = require('./api/db-diagnostic.js');

// Create a simple wrapper to adapt the response object
function adaptResponse(rawRes) {
  // Add common Express.js response methods
  rawRes.status = function(statusCode) {
    this.statusCode = statusCode;
    return this;
  };
  
  rawRes.json = function(data) {
    this.setHeader('Content-Type', 'application/json');
    this.end(JSON.stringify(data));
    return this;
  };
  
  rawRes.send = function(data) {
    if (typeof data === 'object') {
      this.setHeader('Content-Type', 'application/json');
      this.end(JSON.stringify(data));
    } else {
      this.setHeader('Content-Type', 'text/plain');
      this.end(String(data));
    }
    return this;
  };
  
  return rawRes;
}

// Create a simple server to handle requests
const server = http.createServer(async (req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Parse URL to get path and query parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const params = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  // Set up the request object for our handlers
  req.query = params;
  
  // Adapt the response object to have Express-like methods
  const adaptedRes = adaptResponse(res);
  
  // Route the request to the appropriate handler
  try {
    if (pathname === '/api/artists') {
      await artistsHandler(req, adaptedRes);
    } else if (pathname === '/api/releases') {
      await releasesHandler(req, adaptedRes);
    } else if (pathname === '/api/diagnostic') {
      await diagnosticHandler(req, adaptedRes);
    } else {
      adaptedRes.status(404).json({ error: 'Not Found', message: `Endpoint ${pathname} not found` });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    adaptedRes.status(500).json({ error: 'Internal Server Error', message: error.message, stack: error.stack });
  }
});

// Start the server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Available endpoints:');
  console.log(`- http://localhost:${PORT}/api/diagnostic`);
  console.log(`- http://localhost:${PORT}/api/artists?label=buildit-records`);
  console.log(`- http://localhost:${PORT}/api/releases?label=buildit-records`);
  
  // Automatically open the browser
  try {
    console.log('\nOpening diagnostic endpoint in browser...');
    setTimeout(() => {
      try {
        // Try to open the browser based on the platform
        const platform = process.platform;
        if (platform === 'darwin') {  // macOS
          execSync('open http://localhost:3001/api/diagnostic');
        } else if (platform === 'win32') {  // Windows
          execSync('start http://localhost:3001/api/diagnostic');
        } else if (platform === 'linux') {  // Linux
          execSync('xdg-open http://localhost:3001/api/diagnostic');
        }
      } catch (error) {
        console.log('Could not open browser automatically. Please open manually.');
      }
    }, 1000);
  } catch (error) {
    console.log('Could not open browser automatically. Please open manually.');
  }
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server shut down');
    process.exit(0);
  });
});
