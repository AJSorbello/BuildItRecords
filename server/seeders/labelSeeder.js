const initModels = require('../models');

const seedLabels = async (sequelize) => {
  try {
    console.log('[Seeder] Creating labels...');
    
    // Initialize models
    const models = initModels(sequelize);
    const { Label } = models;

    await Label.bulkCreate([
      {
        id: 'buildit-records',
        name: 'Build It Records',
        display_name: 'Build It Records',
        slug: 'buildit-records'
      },
      {
        id: 'buildit-tech',
        name: 'Build It Tech',
        display_name: 'Build It Tech',
        slug: 'buildit-tech'
      },
      {
        id: 'buildit-deep',
        name: 'Build It Deep',
        display_name: 'Build It Deep',
        slug: 'buildit-deep'
      }
    ], {
      ignoreDuplicates: true
    });

    console.log('[Seeder] Labels created successfully');
  } catch (error) {
    console.error('[Seeder] Error creating labels:', error);
    throw error;
  }
};

module.exports = seedLabels;
