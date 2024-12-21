const { sequelize } = require('../models');

async function initializeDatabase() {
  try {
    // Sync all models with the database
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully');

    // Create default labels
    const labels = [
      {
        name: 'Build It Records',
        slug: 'records',
        description: 'House Music Label',
      },
      {
        name: 'Build It Tech',
        slug: 'tech',
        description: 'Techno & Tech House Label',
      },
      {
        name: 'Build It Deep',
        slug: 'deep',
        description: 'Deep House Label',
      },
    ];

    await sequelize.models.Label.bulkCreate(labels);
    console.log('Default labels created');

    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
