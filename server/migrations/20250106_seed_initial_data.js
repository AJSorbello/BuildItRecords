'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Insert initial labels
      await queryInterface.bulkInsert('labels', [
        {
          id: 'buildit-records',
          name: 'Build It Records',
          display_name: 'Build It Records',
          slug: 'buildit-records',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'buildit-tech',
          name: 'Build It Tech',
          display_name: 'Build It Tech',
          slug: 'buildit-tech',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'buildit-deep',
          name: 'Build It Deep',
          display_name: 'Build It Deep',
          slug: 'buildit-deep',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      // Insert some test artists
      await queryInterface.bulkInsert('artists', [
        {
          id: 'artist1',
          name: 'Test Artist 1',
          spotify_url: 'https://open.spotify.com/artist/1',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'artist2',
          name: 'Test Artist 2',
          spotify_url: 'https://open.spotify.com/artist/2',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      // Insert a test release
      await queryInterface.bulkInsert('releases', [
        {
          id: 'release1',
          name: 'Test Release 1',
          label_id: 'buildit-tech',
          release_date: new Date(),
          artwork_url: 'https://example.com/artwork1.jpg',
          spotify_url: 'https://open.spotify.com/album/1',
          total_tracks: 1,
          status: 'published',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      // Link both artists to the release
      await queryInterface.bulkInsert('release_artists', [
        {
          release_id: 'release1',
          artist_id: 'artist1',
          role: 'primary',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          release_id: 'release1',
          artist_id: 'artist2',
          role: 'primary',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      // Insert a test track
      await queryInterface.bulkInsert('tracks', [
        {
          id: 'track1',
          name: 'Test Track 1',
          release_id: 'release1',
          duration: 180000,
          track_number: 1,
          preview_url: 'https://example.com/preview1.mp3',
          spotify_url: 'https://open.spotify.com/track/1',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });

      // Link both artists to the track
      await queryInterface.bulkInsert('track_artists', [
        {
          track_id: 'track1',
          artist_id: 'artist1',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          track_id: 'track1',
          artist_id: 'artist2',
          created_at: new Date(),
          updated_at: new Date()
        }
      ], { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete('track_artists', null, { transaction });
      await queryInterface.bulkDelete('tracks', null, { transaction });
      await queryInterface.bulkDelete('release_artists', null, { transaction });
      await queryInterface.bulkDelete('releases', null, { transaction });
      await queryInterface.bulkDelete('artists', null, { transaction });
      await queryInterface.bulkDelete('labels', null, { transaction });
    });
  }
};
