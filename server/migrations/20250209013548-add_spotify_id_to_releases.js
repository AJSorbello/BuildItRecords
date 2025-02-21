'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, add the column without constraints
    await queryInterface.addColumn('releases', 'spotify_id', {
      type: Sequelize.STRING,
      allowNull: true // temporarily allow null
    });

    // Update existing records to use their id as spotify_id
    await queryInterface.sequelize.query(`
      UPDATE releases 
      SET spotify_id = id 
      WHERE spotify_id IS NULL
    `);

    // Now add the constraints
    await queryInterface.changeColumn('releases', 'spotify_id', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('releases', 'spotify_id');
  }
};
