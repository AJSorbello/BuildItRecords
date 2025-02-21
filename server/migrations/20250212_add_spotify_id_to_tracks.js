'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tracks', 'spotify_id', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tracks', 'spotify_id');
  }
};
