const { sequelize, Release, Label } = require('../models');

async function checkCounts() {
  try {
    const labels = await Label.findAll({
      include: [{ model: Release, as: 'releases' }]
    });

    labels.forEach(label => {
      console.log(`${label.name}: ${label.releases.length} releases`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCounts();
