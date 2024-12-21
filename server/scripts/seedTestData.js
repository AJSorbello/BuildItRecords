const { sequelize, Label, Artist, Release } = require('../models');

async function seedTestData() {
  try {
    // Get the Build It Records label
    const recordsLabel = await Label.findOne({ where: { slug: 'records' } });
    if (!recordsLabel) {
      throw new Error('Build It Records label not found');
    }

    // Create test artists
    const artists = await Artist.bulkCreate([
      {
        name: 'Test Artist 1',
        bio: 'Test bio for artist 1',
        imageUrl: 'https://via.placeholder.com/300',
        spotifyUrl: 'https://spotify.com/artist1',
        labelId: recordsLabel.id
      },
      {
        name: 'Test Artist 2',
        bio: 'Test bio for artist 2',
        imageUrl: 'https://via.placeholder.com/300',
        spotifyUrl: 'https://spotify.com/artist2',
        labelId: recordsLabel.id
      }
    ]);

    // Create test releases
    await Release.bulkCreate([
      {
        title: 'Test Release 1',
        releaseDate: new Date(),
        albumArtUrl: 'https://via.placeholder.com/300',
        spotifyUrl: 'https://spotify.com/release1',
        artistId: artists[0].id,
        labelId: recordsLabel.id
      },
      {
        title: 'Test Release 2',
        releaseDate: new Date(),
        albumArtUrl: 'https://via.placeholder.com/300',
        spotifyUrl: 'https://spotify.com/release2',
        artistId: artists[1].id,
        labelId: recordsLabel.id
      }
    ]);

    console.log('Test data seeded successfully');
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
}

seedTestData();
