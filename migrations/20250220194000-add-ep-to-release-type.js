'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // First check if the enum type exists
      const enumExists = await queryInterface.sequelize.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_type 
          WHERE typname = 'enum_releases_release_type'
        );
      `);

      if (enumExists[0][0].exists) {
        // Add 'ep' to existing enum if not already present
        await queryInterface.sequelize.query(`
          ALTER TYPE "enum_releases_release_type" ADD VALUE IF NOT EXISTS 'ep';
        `);
      } else {
        // Create new enum type with all values
        await queryInterface.sequelize.query(`
          CREATE TYPE "enum_releases_release_type" AS ENUM ('album', 'single', 'ep', 'compilation');
        `);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL does not support removing values from an enum type
    console.log('Warning: Cannot remove enum value in down migration');
  }
};
