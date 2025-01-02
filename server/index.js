require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./config/database');
const { Label, Artist, Release, Track } = require('./models');
const apiRoutes = require('./routes/api.routes');

const app = express();
const port = process.env.PORT || 3001;

// Enable detailed logging
const debugLog = (message, ...args) => {
  console.log(`[${new Date().toISOString()}] ${message}`, ...args);
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Body parsing middleware
app.use(express.json());

// Mount API routes
app.use('/api', apiRoutes);

// Debug middleware to log all requests
app.use((req, res, next) => {
  debugLog(`${req.method} ${req.originalUrl}`);
  next();
});

// 404 handler
app.use((req, res) => {
  debugLog('404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({ 
    success: false, 
    message: 'Not Found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'An unexpected error occurred'
  });
});

// Test database connection and sync models
const initDatabase = async () => {
  try {
    debugLog('Testing database connection...');
    await sequelize.authenticate();
    debugLog('Database connection established successfully');

    // Create default labels if they don't exist
    debugLog('Creating default labels...');
    await Promise.all([
      Label.findOrCreate({
        where: { id: 'buildit-records' },
        defaults: { 
          id: 'buildit-records',
          name: 'records',
          displayName: 'Build It Records',
          slug: 'buildit-records'
        }
      }),
      Label.findOrCreate({
        where: { id: 'buildit-tech' },
        defaults: { 
          id: 'buildit-tech',
          name: 'tech',
          displayName: 'Build It Tech',
          slug: 'buildit-tech'
        }
      }),
      Label.findOrCreate({
        where: { id: 'buildit-deep' },
        defaults: { 
          id: 'buildit-deep',
          name: 'deep',
          displayName: 'Build It Deep',
          slug: 'buildit-deep'
        }
      })
    ]);
    debugLog('Default labels created successfully');

    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
};

let server;

const startServer = async () => {
  try {
    debugLog('Initializing database...');
    const dbInitialized = await initDatabase();
    if (!dbInitialized) {
      console.error('Failed to initialize database. Exiting...');
      process.exit(1);
    }

    // Start server
    server = app.listen(port, () => {
      debugLog(`Server is running on port ${port}`);
      debugLog('Available routes:');
      app._router.stack
        .filter(r => r.route)
        .forEach(r => {
          debugLog(`${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
        });
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('[Server] Shutting down gracefully...');
      
      // Close server first
      if (server) {
        await new Promise((resolve) => {
          server.close((err) => {
            if (err) {
              console.error('[Server] Error closing HTTP server:', err);
            }
            resolve();
          });
        });
      }

      // Close database connection
      try {
        await sequelize.close();
        console.log('[Server] Database connection closed');
      } catch (error) {
        console.error('[Server] Error closing database connection:', error);
      }

      // Exit process
      process.exit(0);
    };

    // Listen for shutdown signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    process.on('uncaughtException', (error) => {
      console.error('[Server] Uncaught exception:', error);
      shutdown();
    });
    process.on('unhandledRejection', (error) => {
      console.error('[Server] Unhandled rejection:', error);
      shutdown();
    });

  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

// Start server
startServer();
