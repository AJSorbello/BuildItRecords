'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};
const logger = require('../utils/logger');

// CRITICAL: Force Node.js to accept self-signed certificates in development
// This should never be used in production environments
if (env === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  logger.warn('SSL certificate validation disabled for development');
}

// Set default connection timeout lower for Render deployments
// This prevents the server from hanging during initialization
const CONNECTION_TIMEOUT = process.env.NODE_ENV === 'production' ? 10000 : 30000;
const CONNECTION_RETRIES = process.env.NODE_ENV === 'production' ? 1 : 3;

let sequelize;

try {
  // Use either the connection URL or individual parameters
  if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
    // Prefer POSTGRES_URL but fall back to DATABASE_URL (Render provides this)
    const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    
    logger.info('Attempting database connection using connection URL', {
      url: dbUrl.replace(/postgres:\/\/[^:]+:[^@]+@/, 'postgres://****:****@') // Mask credentials for logging
    });
    
    sequelize = new Sequelize(dbUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        connectTimeout: CONNECTION_TIMEOUT
      },
      pool: {
        max: 3,
        min: 0,
        acquire: CONNECTION_TIMEOUT,
        idle: 5000
      },
      retry: {
        max: CONNECTION_RETRIES
      }
    });
    
    logger.info('Database connection using connection URL configured successfully');
  } else {
    // Use individual connection parameters
    const dbConfig = {
      host: process.env.DB_HOST || config.host || 'localhost',
      port: process.env.DB_PORT || config.port || 5432,
      database: process.env.DB_NAME || config.database || 'builditrecords',
      username: process.env.DB_USER || config.username || 'postgres',
      password: process.env.DB_PASSWORD || config.password || '',
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 3,
        min: 0,
        acquire: CONNECTION_TIMEOUT,
        idle: 5000
      },
      retry: {
        max: CONNECTION_RETRIES
      }
    };
    
    // Only add SSL options if explicitly enabled
    if (process.env.DB_SSL === 'true' || config.dialectOptions?.ssl) {
      dbConfig.dialectOptions = {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        connectTimeout: CONNECTION_TIMEOUT
      };
    }
    
    logger.info('Attempting database connection using parameters', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      username: dbConfig.username,
      ssl: !!dbConfig.dialectOptions?.ssl
    });
    
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      dbConfig
    );
    
    logger.info(`Database connection configured using parameters`);
  }

  // Test connection immediately to catch any issues early
  logger.info('Testing database connection...');
  
  // Instead of immediately failing, let's handle this asynchronously
  // so we can at least start the server even if DB is initially unavailable
  sequelize.authenticate()
    .then(() => {
      logger.info('Database connection test successful');
    })
    .catch(err => {
      logger.error('Database connection test failed - server will continue but database operations will fail', {
        error: err.message,
        stack: err.stack
      });
      
      // In production, if connection fails immediately, switch to test data mode
      if (process.env.NODE_ENV === 'production') {
        logger.warn('Production database connection failed - switching to test data mode');
        global.USE_TEST_DATA = true;
      }
    });

} catch (error) {
  logger.error('Fatal error initializing database connection', {
    error: error.message,
    stack: error.stack
  });
  
  // Create a fallback sequelize instance that will allow the server to start
  // but will throw clear errors when database operations are attempted
  sequelize = new Sequelize('sqlite::memory:', {
    logging: false
  });
  
  logger.warn('Using in-memory SQLite as fallback to allow server to start');
}

// Automatically import all models in the current directory
try {
  fs
    .readdirSync(__dirname)
    .filter(file => {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
      try {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
        logger.debug(`Loaded model: ${model.name}`);
      } catch (modelError) {
        logger.error(`Failed to load model from file: ${file}`, {
          error: modelError.message
        });
      }
    });

  // Set up model associations
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      try {
        db[modelName].associate(db);
        logger.debug(`Set up associations for model: ${modelName}`);
      } catch (associationError) {
        logger.error(`Failed to set up associations for model: ${modelName}`, {
          error: associationError.message
        });
      }
    }
  });
} catch (error) {
  logger.error('Error loading models', {
    error: error.message,
    stack: error.stack
  });
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
