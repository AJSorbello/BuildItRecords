const { seedLabels } = require('../seeders/labelSeeder');
const { sequelize } = require('../models');

const seedAllLabels = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Seed labels
    await seedLabels();
    console.log('Labels seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding labels:', error);
    process.exit(1);
  }
};

seedAllLabels();
