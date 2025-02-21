'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, update existing 'published' values to 'active'
    await queryInterface.sequelize.query(`
      UPDATE releases 
      SET status = 'active' 
      WHERE status = 'published';
    `);

    // Then modify the enum type
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_releases_status RENAME TO enum_releases_status_old;
      CREATE TYPE enum_releases_status AS ENUM ('active', 'draft', 'archived');
      ALTER TABLE releases 
        ALTER COLUMN status TYPE enum_releases_status 
        USING status::text::enum_releases_status;
      DROP TYPE enum_releases_status_old;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the enum type change
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_releases_status RENAME TO enum_releases_status_old;
      CREATE TYPE enum_releases_status AS ENUM ('draft', 'published', 'archived');
      ALTER TABLE releases 
        ALTER COLUMN status TYPE enum_releases_status 
        USING (CASE 
          WHEN status = 'active' THEN 'published'::enum_releases_status 
          ELSE status::text::enum_releases_status 
        END);
      DROP TYPE enum_releases_status_old;
    `);
  }
};
