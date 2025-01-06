const { Label } = require('../models');

const seedLabels = async () => {
  try {
    console.log('[Seeder] Seeding labels...');

    const labels = [
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
    ];

    await Label.bulkCreate(labels, {
      ignoreDuplicates: true
    });

    console.log('[Seeder] Labels seeded successfully');
  } catch (error) {
    console.error('[Seeder] Error seeding labels:', error);
    throw error;
  }
};

module.exports = { seedLabels };
