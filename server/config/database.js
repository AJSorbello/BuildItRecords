/**
 * @fileoverview Database configuration and connection management
 * @module config/database
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

const config = {
  database: process.env.DB_NAME || 'builditrecords',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  dialect: 'postgres',
  logging: (msg) => {
    // Add timestamp to logs
    const timestamp = new Date().toISOString();
    if (msg.includes('ERROR') || msg.includes('ROLLBACK') || 
        msg.includes('START TRANSACTION') || msg.includes('COMMIT')) {
      console.log(`[${timestamp}] ${msg}`);
    }
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false // Important for Supabase connection
    } : false,
    statement_timeout: 10000, // 10 second timeout for queries
    idle_in_transaction_session_timeout: 10000
  },
  define: {
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 10000, // Reduced from 30000
    idle: 5000,    // Reduced from 10000
    evict: 1000    // Check for idle connections every second
  }
};

/** @type {import('sequelize').Sequelize | null} */
let sequelize = null;

/**
 * Creates and returns a Sequelize connection instance
 * @returns {import('sequelize').Sequelize} Sequelize instance
 * @throws {Error} If connection configuration is invalid
 */
const createConnection = () => {
  if (sequelize) return sequelize;
  sequelize = new Sequelize(config.database, config.username, config.password, config);
  return sequelize;
};

/**
 * Initializes the database connection
 * @returns {Promise<void>}
 * @throws {Error} If connection fails
 */
const initializeDatabase = async () => {
  try {
    const db = createConnection();
    await db.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

/**
 * Closes the database connection safely
 * @returns {Promise<void>}
 * @throws {Error} If closing the connection fails
 */
const closeConnection = async () => {
  if (sequelize) {
    try {
      await sequelize.close();
      console.log('Database connection closed.');
      sequelize = null;
    } catch (error) {
      console.error('Error closing database connection:', error);
      throw error;
    }
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

/**
 * @typedef {Object} DatabaseModule
 * @property {import('sequelize').Sequelize} sequelize - The Sequelize instance
 * @property {() => import('sequelize').Sequelize} createConnection - Function to create a new connection
 * @property {() => Promise<void>} initializeDatabase - Function to initialize the database
 * @property {() => Promise<void>} closeConnection - Function to close the database connection
 */

/** @type {DatabaseModule} */
module.exports = {
  sequelize: createConnection(),
  createConnection,
  initializeDatabase,
  closeConnection
};
