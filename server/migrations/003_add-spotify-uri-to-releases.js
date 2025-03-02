'use strict';

/** 
 * Migration name: add-spotify-uri-to-releases
 * Description: Adds spotify_uri field to releases table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('releases', 'spotify_uri', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('Successfully added spotify_uri column to releases table');
    } catch (error) {
      console.error('Error adding spotify_uri column:', error.message);
      // If column already exists, consider it a success
      if (error.original && error.original.code === '42701') {
        console.log('Column spotify_uri already exists, continuing...');
        return Promise.resolve();
      }
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('releases', 'spotify_uri');
      console.log('Successfully removed spotify_uri column from releases table');
    } catch (error) {
      console.error('Error removing spotify_uri column:', error.message);
      throw error;
    }
  }
};
