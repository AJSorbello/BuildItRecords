// Load environment variables first
require('dotenv').config();

// Debug: Log environment loading
console.log('Server starting with environment:', process.env.NODE_ENV);
console.log('Admin credentials loaded:', {
  hasUsername: !!process.env.ADMIN_USERNAME,
  hasPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
  hasJwtSecret: !!process.env.JWT_SECRET
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Sequelize } = require('sequelize');
const apiRoutes = require('./routes/api.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const startServer = async () => {
  try {
    // Create Sequelize instance
    const sequelize = new Sequelize(
      process.env.DB_NAME || 'builditrecords',
      process.env.DB_USERNAME || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false
      }
    );

    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
