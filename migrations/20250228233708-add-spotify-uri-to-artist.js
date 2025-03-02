'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add spotify_uri column to artists table
    await queryInterface.addColumn('artists', 'spotify_uri', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove spotify_uri column from artists table
    await queryInterface.removeColumn('artists', 'spotify_uri');
  }
};
