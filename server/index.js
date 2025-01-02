require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/database');
const apiRoutes = require('./routes/api.routes');

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise);
  console.error('[Server] Reason:', reason);
});

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server] Error:', err);
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('[Database] Testing connection...');
    const db = await initializeDatabase();
    console.log('[Database] Connection established successfully');

    const server = app.listen(port, () => {
      console.log(`[${new Date().toISOString()}] Server is running on port ${port}`);
      console.log(`[${new Date().toISOString()}] Health check endpoint: http://localhost:${port}/health`);
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('[Server] Shutting down gracefully...');
      
      // Close server first
      await new Promise((resolve) => {
        server.close((err) => {
          if (err) {
            console.error('[Server] Error closing HTTP server:', err);
          }
          resolve();
        });
      });

      // Close database connection
      if (db) {
        await db.close();
      }

      process.exit(0);
    };

    // Handle shutdown signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

startServer();
