require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./config/database');
const { Label, Artist, Release } = require('./models');
const syncRoutes = require('./routes/sync');
const releasesRoutes = require('./routes/releases');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.use('/api/sync', syncRoutes);
app.use('/api/releases', releasesRoutes);

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

    // Sync models with database
    await sequelize.sync();
    console.log('Models synchronized with database');

    // Create default labels if they don't exist
    const labels = [
      { id: 'build-it-records', name: 'records', displayName: 'Build It Records' },
      { id: 'build-it-tech', name: 'tech', displayName: 'Build It Tech' },
      { id: 'build-it-deep', name: 'deep', displayName: 'Build It Deep' }
    ];

    for (const label of labels) {
      await Label.findOrCreate({
        where: { id: label.id },
        defaults: label
      });
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

startServer();
