// Load environment variables first
require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Sequelize } = require('sequelize');
const apiRoutes = require('./routes/api.routes');
const logger = require('./utils/logger');
const { verifyEmailConfig } = require('./services/email.service');

const app = express();
const PORT = process.env.PORT || 3001;

// Debug: Log environment loading
logger.info('Server starting with environment:', {
  NODE_ENV: process.env.NODE_ENV,
  hasUsername: !!process.env.ADMIN_USERNAME,
  hasPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
  hasJwtSecret: !!process.env.JWT_SECRET,
  hasSmtpUser: !!process.env.SMTP_USER,
  hasSmtpPass: !!process.env.SMTP_PASS,
  smtpUser: process.env.SMTP_USER
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Configure CORS - simplified for development
const isDevelopment = process.env.NODE_ENV === 'development';
const corsOptions = {
  origin: isDevelopment ? 'http://localhost:3000' : process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Log CORS configuration
logger.info('CORS configuration:', {
  environment: process.env.NODE_ENV,
  origin: corsOptions.origin
});

app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request:', {
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.method === 'POST' ? req.body : undefined,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'present' : 'missing'
    }
  });
  next();
});

// Routes
app.use('/api', apiRoutes);

// Error handling
app.use((err, req, res, next) => {
  logger.error('Server error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle 404
app.use('*', (req, res) => {
  logger.warn('404 Not Found:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });
  res.status(404).json({ 
    error: 'Not found',
    path: req.originalUrl
  });
});

async function startServer() {
  try {
    // Initialize database connection
    const sequelize = new Sequelize(
      process.env.DB_NAME || 'builditrecords',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        dialect: 'postgres',
        logging: (msg) => logger.debug(msg),
        dialectOptions: {
          ssl: false
        },
        define: {
          timestamps: true,
          underscored: true
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Make sequelize instance available globally
    global.sequelize = sequelize;

    // Verify email configuration
    const emailConfigValid = await verifyEmailConfig();
    if (!emailConfigValid) {
      logger.error('Email configuration verification failed');
      process.exit(1);
    }
    logger.info('Email configuration verified successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      
      // Log important environment variables (without sensitive values)
      logger.info('Environment configuration:', {
        NODE_ENV: process.env.NODE_ENV,
        PORT: PORT,
        CORS_ORIGIN: corsOptions.origin,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasAdminUsername: !!process.env.ADMIN_USERNAME,
        hasAdminPasswordHash: !!process.env.ADMIN_PASSWORD_HASH,
        dbConnected: true
      });
    });
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();
