'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('release_artists', 'role', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'primary'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('release_artists', 'role');
  }
};
