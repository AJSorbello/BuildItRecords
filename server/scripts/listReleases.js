const { sequelize, Release, Label } = require('../models');

async function listReleases() {
  try {
    const labels = await Label.findAll({
      include: [{
        model: Release,
        as: 'releases',
        attributes: ['name', 'release_date', 'release_type', 'spotify_url'],
      }],
      order: [[{ model: Release, as: 'releases' }, 'release_date', 'DESC']]
    });

    for (const label of labels) {
      console.log(`\n${label.name} (${label.releases.length} releases):`);
      console.log('='.repeat(50));
      
      label.releases.forEach((release, index) => {
        console.log(`${index + 1}. ${release.name}`);
        console.log(`   Released: ${release.release_date}`);
        console.log(`   Type: ${release.release_type}`);
        console.log(`   URL: ${release.spotify_url}`);
        console.log('-'.repeat(50));
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listReleases();
