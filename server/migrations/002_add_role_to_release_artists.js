'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('release_artists', 'role', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await queryInterface.addIndex('release_artists', ['role'], {
        name: 'release_artists_role'
      });
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeIndex('release_artists', 'release_artists_role');
      await queryInterface.removeColumn('release_artists', 'role');
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};
