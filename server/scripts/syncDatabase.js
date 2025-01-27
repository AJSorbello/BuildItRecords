const { sequelize } = require('../models');

const syncDatabase = async () => {
  try {
    // Force sync all models
    await sequelize.sync({ force: true });
    console.log('Database synced successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
};

syncDatabase();
