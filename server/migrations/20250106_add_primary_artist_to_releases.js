'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('releases', 'primary_artist_id', {
      type: Sequelize.STRING,
      references: {
        model: 'artists',
        key: 'id'
      },
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('releases', 'primary_artist_id');
  }
};
