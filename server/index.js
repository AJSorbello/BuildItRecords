require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./config/database');
const { Label, Artist, Release } = require('./models');
const apiRoutes = require('./routes/api.routes');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Mount API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.originalUrl);
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
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Force sync to recreate tables with new structure
    await sequelize.sync({ force: true });
    console.log('Models synchronized with database');

    // Create default labels if they don't exist
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
    console.log('Default labels created');
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  await initDatabase();
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log('Available routes:');
    app._router.stack.forEach(r => {
      if (r.route && r.route.path) {
        console.log(`${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
      }
    });
  });
};

// Start server
startServer();

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
