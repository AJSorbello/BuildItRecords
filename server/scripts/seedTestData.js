const { sequelize, Label, Artist, Release } = require('../models');

const seedTestData = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Find the Build It Records label
    const label = await Label.findOne({ where: { slug: 'buildit-records' } });
    if (!label) {
      throw new Error('Build It Records label not found');
    }

    // Create test artists
    const artists = await Artist.bulkCreate([
      {
        id: 'test-artist-1',
        name: 'Test Artist 1',
        bio: 'Test bio for artist 1',
        image_url: 'https://via.placeholder.com/300',
        spotify_url: 'https://spotify.com/artist1',
        images: [],
        label_id: label.id
      },
      {
        id: 'test-artist-2',
        name: 'Test Artist 2',
        bio: 'Test bio for artist 2',
        image_url: 'https://via.placeholder.com/300',
        spotify_url: 'https://spotify.com/artist2',
        images: [],
        label_id: label.id
      }
    ]);

    // Create test releases
    const releases = await Release.bulkCreate([
      {
        id: 'test-release-1',
        title: 'Test Release 1',
        release_date: new Date(),
        artwork_url: 'https://via.placeholder.com/300',
        spotify_url: 'https://spotify.com/release1',
        images: [],
        total_tracks: 1,
        status: 'published',
        label_id: label.id,
        artist_id: artists[0].id
      },
      {
        id: 'test-release-2',
        title: 'Test Release 2',
        release_date: new Date(),
        artwork_url: 'https://via.placeholder.com/300',
        spotify_url: 'https://spotify.com/release2',
        images: [],
        total_tracks: 1,
        status: 'published',
        label_id: label.id,
        artist_id: artists[1].id
      }
    ]);

    console.log('Test data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
};

seedTestData();
