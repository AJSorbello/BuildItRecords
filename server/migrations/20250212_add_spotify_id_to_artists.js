'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('artists', 'spotify_id', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('artists', 'spotify_id');
  }
};
