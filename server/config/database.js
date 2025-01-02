const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE || 'buildit_records',
  process.env.DB_USERNAME || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

async function initializeDatabase() {
  try {
    console.log('[Database] Connecting to database...');
    await sequelize.authenticate();
    console.log('[Database] Connection established successfully');

    // Initialize models
    console.log('[Database] Initializing models...');
    const models = require('../models')(sequelize);
    console.log('[Database] Models initialized');

    // Drop and recreate all tables
    console.log('[Database] Syncing database...');
    await sequelize.sync({ force: true });
    console.log('[Database] Models synced successfully');

    // Run seeders
    console.log('[Database] Running seeders...');
    await require('../seeders/labelSeeder')(sequelize);
    console.log('[Database] Seeders completed successfully');

    return sequelize;
  } catch (error) {
    console.error('[Database] Error initializing database:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  initializeDatabase
};
