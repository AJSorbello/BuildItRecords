'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if column exists before trying to remove it
    const tableInfo = await queryInterface.describeTable('releases');
    if (tableInfo.primary_artist_id) {
      await queryInterface.removeColumn('releases', 'primary_artist_id');
    }
  },

  async down (queryInterface, Sequelize) {
    // Check if column doesn't exist before adding it back
    const tableInfo = await queryInterface.describeTable('releases');
    if (!tableInfo.primary_artist_id) {
      await queryInterface.addColumn('releases', 'primary_artist_id', {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: 'artists',
          key: 'id'
        }
      });
    }
  }
};
