const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'builditrecords',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: true,
      underscoredAll: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      max: 3,
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ]
    },
    dialectOptions: {
      connectTimeout: 60000
    }
  }
);

const initializeDatabase = async () => {
  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('[Database] Connection has been established successfully.');

    // Only sync in development
    if (process.env.NODE_ENV === 'development') {
      try {
        // Initialize models
        const models = require('../models');
        
        // Force sync to recreate tables
        await sequelize.sync({ force: true });
        console.log('[Database] Database schema synchronized successfully');

        // Always seed in development after force sync
        console.log('[Database] Seeding initial data...');
        const { seedLabels } = require('../seeders/labelSeeder');
        const { seedReleases } = require('../seeders/releaseSeeder');
        
        await seedLabels();
        await seedReleases();
        console.log('[Database] Initial data seeded successfully');
      } catch (syncError) {
        console.error('[Database] Error syncing database:', syncError);
        throw syncError;
      }
    }

    return sequelize;
  } catch (error) {
    console.error('[Database] Unable to connect to the database:', error);
    
    // Implement exponential backoff for retries
    if (error.name === 'SequelizeConnectionError') {
      console.log('[Database] Attempting to reconnect...');
      for (let i = 0; i < 3; i++) {
        try {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
          await sequelize.authenticate();
          console.log('[Database] Reconnection successful');
          return sequelize;
        } catch (retryError) {
          console.error(`[Database] Reconnection attempt ${i + 1} failed:`, retryError);
        }
      }
    }
    
    throw error;
  }
};

// Handle connection events
sequelize.addHook('beforeConnect', async (config) => {
  console.log('[Database] Attempting to connect to database...');
});

sequelize.addHook('afterConnect', async (connection) => {
  console.log('[Database] Successfully connected to database');
});

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await sequelize.close();
    console.log('[Database] Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[Database] Error closing connection:', error);
    process.exit(1);
  }
});

module.exports = sequelize;
module.exports.initializeDatabase = initializeDatabase;
