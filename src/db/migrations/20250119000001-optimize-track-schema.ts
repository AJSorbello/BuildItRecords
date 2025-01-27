import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Step 1: Rename columns to match Spotify naming
    await queryInterface.renameColumn('tracks', 'title', 'name');
    await queryInterface.renameColumn('tracks', 'spotify_url', 'uri');
    
    // Step 2: Add new columns
    await queryInterface.addColumn('tracks', 'external_urls', {
      type: DataTypes.JSONB,
      allowNull: true
    });

    await queryInterface.addColumn('tracks', 'external_ids', {
      type: DataTypes.JSONB,
      allowNull: true
    });

    await queryInterface.addColumn('tracks', 'href', {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('tracks', 'duration_ms', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    // Step 3: Migrate data
    await queryInterface.sequelize.query(`
      UPDATE tracks 
      SET external_urls = jsonb_build_object('spotify', uri),
          duration_ms = duration * 1000,
          href = 'https://api.spotify.com/v1/tracks/' || id
      WHERE uri IS NOT NULL;
    `);

    // Step 4: Drop old columns
    await queryInterface.removeColumn('tracks', 'duration');
    await queryInterface.removeColumn('tracks', 'spotify_uri');

    // Step 5: Update enum types
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_tracks_type" RENAME TO "enum_tracks_type_old";
      CREATE TYPE "enum_tracks_type" AS ENUM ('track', 'remix', 'edit', 'radio');
      ALTER TABLE tracks 
        ALTER COLUMN type TYPE "enum_tracks_type" 
        USING type::text::"enum_tracks_type";
      DROP TYPE "enum_tracks_type_old";
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_tracks_status" RENAME TO "enum_tracks_status_old";
      CREATE TYPE "enum_tracks_status" AS ENUM ('draft', 'published', 'archived');
      ALTER TABLE tracks 
        ALTER COLUMN status TYPE "enum_tracks_status" 
        USING status::text::"enum_tracks_status";
      DROP TYPE "enum_tracks_status_old";
    `);

    // Step 6: Update label references
    await queryInterface.sequelize.query(`
      UPDATE tracks
      SET label_id = 'BUILD_IT'
      WHERE label_id = 'buildit-records';

      UPDATE tracks
      SET label_id = 'TECH'
      WHERE label_id = 'buildit-tech';

      UPDATE tracks
      SET label_id = 'HOUSE'
      WHERE label_id = 'buildit-deep';
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    // Step 1: Revert label references
    await queryInterface.sequelize.query(`
      UPDATE tracks
      SET label_id = 'buildit-records'
      WHERE label_id = 'BUILD_IT';

      UPDATE tracks
      SET label_id = 'buildit-tech'
      WHERE label_id = 'TECH';

      UPDATE tracks
      SET label_id = 'buildit-deep'
      WHERE label_id = 'HOUSE';
    `);

    // Step 2: Revert enum types
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_tracks_type" RENAME TO "enum_tracks_type_old";
      CREATE TYPE "enum_tracks_type" AS ENUM ('original', 'remix', 'edit', 'radio');
      ALTER TABLE tracks 
        ALTER COLUMN type TYPE "enum_tracks_type" 
        USING type::text::"enum_tracks_type";
      DROP TYPE "enum_tracks_type_old";
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_tracks_status" RENAME TO "enum_tracks_status_old";
      CREATE TYPE "enum_tracks_status" AS ENUM ('draft', 'scheduled', 'published', 'archived');
      ALTER TABLE tracks 
        ALTER COLUMN status TYPE "enum_tracks_status" 
        USING status::text::"enum_tracks_status";
      DROP TYPE "enum_tracks_status_old";
    `);

    // Step 3: Add back old columns
    await queryInterface.addColumn('tracks', 'duration', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('tracks', 'spotify_uri', {
      type: DataTypes.STRING,
      allowNull: true
    });

    // Step 4: Migrate data back
    await queryInterface.sequelize.query(`
      UPDATE tracks 
      SET duration = duration_ms / 1000,
          spotify_uri = uri
      WHERE duration_ms IS NOT NULL;
    `);

    // Step 5: Remove new columns
    await queryInterface.removeColumn('tracks', 'external_urls');
    await queryInterface.removeColumn('tracks', 'external_ids');
    await queryInterface.removeColumn('tracks', 'href');
    await queryInterface.removeColumn('tracks', 'duration_ms');

    // Step 6: Rename columns back
    await queryInterface.renameColumn('tracks', 'name', 'title');
    await queryInterface.renameColumn('tracks', 'uri', 'spotify_url');
  }
};
