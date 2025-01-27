'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tracks', 'status', {
      type: Sequelize.ENUM('draft', 'scheduled', 'published'),
      allowNull: false,
      defaultValue: 'draft'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tracks', 'status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tracks_status";');
  }
};
