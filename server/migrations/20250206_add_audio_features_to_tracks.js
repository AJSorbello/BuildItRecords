'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tracks', 'audio_features', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Spotify audio features like danceability, energy, etc.'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tracks', 'audio_features');
  }
};
