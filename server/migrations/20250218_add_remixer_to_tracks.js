'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add remixer_id column to tracks table
      await queryInterface.sequelize.query(`
        ALTER TABLE tracks 
        ADD COLUMN remixer_id UUID REFERENCES artists(id) ON DELETE SET NULL ON UPDATE CASCADE;

        -- Create index for remixer_id
        CREATE INDEX IF NOT EXISTS tracks_remixer_id ON tracks(remixer_id);
      `);

      console.log('Successfully added remixer_id column to tracks table');
    } catch (error) {
      console.error('Error adding remixer_id column:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove remixer_id column from tracks table
      await queryInterface.sequelize.query(`
        ALTER TABLE tracks DROP COLUMN IF EXISTS remixer_id;
      `);

      console.log('Successfully removed remixer_id column from tracks table');
    } catch (error) {
      console.error('Error removing remixer_id column:', error);
      throw error;
    }
  }
};
