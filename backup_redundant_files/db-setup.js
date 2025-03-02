const { models, sequelize } = require('./utils/db');
const { logger } = require('../src/utils/logger');

async function setupDatabase() {
  try {
    // Sync all models with the database
    await sequelize.sync({ force: true });
    logger.info('Database schema created successfully');
  } catch (error) {
    logger.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase().then(() => {
  logger.info('Database setup complete');
  process.exit(0);
});
