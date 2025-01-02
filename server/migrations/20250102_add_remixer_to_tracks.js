'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Tracks', 'remixer_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Artists',
        key: 'id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Tracks', 'remixer_id');
  }
};
