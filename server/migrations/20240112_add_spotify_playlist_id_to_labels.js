'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('labels', 'spotify_playlist_id', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add Spotify playlist IDs for existing labels
    await queryInterface.bulkUpdate('labels', 
      { spotify_playlist_id: '37i9dQZF1DX5wDmLW735Yd' }, // Replace with actual playlist ID
      { id: 'buildit-records' }
    );
    await queryInterface.bulkUpdate('labels', 
      { spotify_playlist_id: '37i9dQZF1DX6J5NfMJS675' }, // Replace with actual playlist ID
      { id: 'buildit-tech' }
    );
    await queryInterface.bulkUpdate('labels', 
      { spotify_playlist_id: '37i9dQZF1DX2TRYkJECvfC' }, // Replace with actual playlist ID
      { id: 'buildit-deep' }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('labels', 'spotify_playlist_id');
  }
};
