const { Release } = require('../models');

const seedReleases = async () => {
  try {
    console.log('Seeding releases...');
    // No initial releases - they will be imported from Spotify
    console.log('No initial releases to seed');
  } catch (error) {
    console.error('Error seeding releases:', error);
    throw error;
  }
};

module.exports = {
  seedReleases
};
