'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Copy data from name to title
      await queryInterface.sequelize.query(`
        UPDATE releases 
        SET title = name 
        WHERE title IS NULL AND name IS NOT NULL;
      `);

      // Make name nullable since we're moving to title
      await queryInterface.sequelize.query(`
        ALTER TABLE releases 
        ALTER COLUMN name DROP NOT NULL;
      `);

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Copy data back from title to name
      await queryInterface.sequelize.query(`
        UPDATE releases 
        SET name = title 
        WHERE name IS NULL AND title IS NOT NULL;
      `);

      // Make name non-nullable again
      await queryInterface.sequelize.query(`
        ALTER TABLE releases 
        ALTER COLUMN name SET NOT NULL;
      `);

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
};
