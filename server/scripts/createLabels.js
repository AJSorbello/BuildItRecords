const { sequelize, Label } = require('../models');

async function createLabels() {
  try {
    await sequelize.sync();

    const labels = [
      {
        name: 'Build It Records',
        slug: 'records',
        display_name: 'Build It Records',
        status: 'active'
      },
      {
        name: 'Build It Tech',
        slug: 'tech',
        display_name: 'Build It Tech',
        status: 'active'
      },
      {
        name: 'Build It Deep',
        slug: 'deep',
        display_name: 'Build It Deep',
        status: 'active'
      }
    ];

    for (const labelData of labels) {
      const [label, created] = await Label.findOrCreate({
        where: { name: labelData.name },
        defaults: labelData
      });

      console.log(`Label ${label.name} ${created ? 'created' : 'already exists'}`);
    }

    console.log('All labels created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating labels:', error);
    process.exit(1);
  }
}

createLabels();
