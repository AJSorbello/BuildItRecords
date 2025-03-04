// Local API Server for testing serverless functions
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3003;

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Log request completion and timing
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// API endpoints - dynamically load from /api directory
const apiDir = path.join(__dirname, '..', 'api');

// Check if api directory exists
if (!fs.existsSync(apiDir)) {
  console.error(`API directory not found: ${apiDir}`);
  process.exit(1);
}

// Helper function to check if a path is a directory
function isDirectory(path) {
  return fs.statSync(path).isDirectory();
}

// Create route handlers for API endpoints
function loadApiRoutes(app, directory, basePath = '/api') {
  const items = fs.readdirSync(directory);
  
  items.forEach(item => {
    const itemPath = path.join(directory, item);
    
    if (isDirectory(itemPath)) {
      // It's a directory - check if it has an index.js file
      const indexFile = path.join(itemPath, 'index.js');
      
      if (fs.existsSync(indexFile)) {
        // Create a route for this endpoint
        const routePath = `${basePath}/${item}`;
        console.log(`Loading API route: ${routePath} from ${indexFile}`);
        
        app.all(routePath, async (req, res) => {
          try {
            // Clear require cache to reload changes
            delete require.cache[require.resolve(indexFile)];
            
            // Load the handler
            const handler = require(indexFile);
            
            // Call the handler
            await handler(req, res);
          } catch (error) {
            console.error(`Error handling route ${routePath}:`, error);
            res.status(500).json({
              error: 'Internal server error',
              details: error.message,
              stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
          }
        });
      }
      
      // Check for dynamic segment files like [id].js
      const dynamicSegmentFiles = fs.readdirSync(itemPath)
        .filter(file => file.startsWith('[') && file.endsWith('].js'));
      
      dynamicSegmentFiles.forEach(dynamicFile => {
        const paramName = dynamicFile.slice(1, -4); // Remove '[' and '].js'
        const routePath = `${basePath}/${item}/:${paramName}`;
        const handlerPath = path.join(itemPath, dynamicFile);
        
        console.log(`Loading dynamic API route: ${routePath} from ${handlerPath}`);
        
        app.all(routePath, async (req, res) => {
          try {
            // Clear require cache to reload changes
            delete require.cache[require.resolve(handlerPath)];
            
            // Load the handler
            const handler = require(handlerPath);
            
            // Add the ID from URL params to the query
            req.query[paramName] = req.params[paramName];
            
            // Call the handler
            await handler(req, res);
          } catch (error) {
            console.error(`Error handling dynamic route ${routePath}:`, error);
            res.status(500).json({
              error: 'Internal server error',
              details: error.message,
              stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
          }
        });
      });
      
      // Recursively load sub-directories
      loadApiRoutes(app, itemPath, `${basePath}/${item}`);
    } else if (item.endsWith('.js') && item !== 'db-utils.js') {
      // It's a JavaScript file - create a route
      const routeName = item.replace('.js', '');
      const routePath = `${basePath}/${routeName}`;
      const handlerPath = path.join(directory, item);
      
      console.log(`Loading API route: ${routePath} from ${handlerPath}`);
      
      app.all(routePath, async (req, res) => {
        try {
          // Clear require cache to reload changes
          delete require.cache[require.resolve(handlerPath)];
          
          // Load the handler
          const handler = require(handlerPath);
          
          // Call the handler
          await handler(req, res);
        } catch (error) {
          console.error(`Error handling route ${routePath}:`, error);
          res.status(500).json({
            error: 'Internal server error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          });
        }
      });
    }
  });
}

// Load API routes
loadApiRoutes(app, apiDir);

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'BuildIt Records API Server',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/test-db',
      '/api/artists',
      '/api/releases',
      '/api/tracks'
    ]
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`
  ┌───────────────────────────────────────────────────┐
  │                                                   │
  │   BuildIt Records Local API Server                │
  │   Running at http://localhost:${PORT}                │
  │                                                   │
  │   Endpoints:                                      │
  │     - http://localhost:${PORT}/api/health            │
  │     - http://localhost:${PORT}/api/test-db           │
  │     - http://localhost:${PORT}/api/artists           │
  │     - http://localhost:${PORT}/api/releases          │
  │     - http://localhost:${PORT}/api/tracks            │
  │                                                   │
  └───────────────────────────────────────────────────┘
  `);
});
