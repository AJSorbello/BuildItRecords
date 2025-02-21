'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('releases', 'popularity', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Spotify popularity score (0-100)'
    });

    // Create an index on popularity for faster sorting
    await queryInterface.addIndex('releases', ['popularity'], {
      name: 'releases_popularity_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('releases', 'releases_popularity_idx');
    await queryInterface.removeColumn('releases', 'popularity');
  }
};
