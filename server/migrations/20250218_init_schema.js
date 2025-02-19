'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Create labels table first since other tables depend on it
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS labels (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          display_name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          spotify_playlist_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for labels
        CREATE INDEX IF NOT EXISTS labels_name ON labels(name);
        CREATE INDEX IF NOT EXISTS labels_slug ON labels(slug);
      `);

      // Create enum types
      await queryInterface.sequelize.query(`
        -- Create release status enum
        DO $$ BEGIN
          CREATE TYPE release_status AS ENUM ('draft', 'scheduled', 'published');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;

        -- Create release type enum
        DO $$ BEGIN
          CREATE TYPE release_type AS ENUM ('single', 'ep', 'album', 'compilation');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;

        -- Create artist role enum
        DO $$ BEGIN
          CREATE TYPE artist_role AS ENUM ('primary', 'featured', 'remixer');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Create artists table which depends on labels
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS artists (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(255) NOT NULL,
          display_name VARCHAR(255),
          spotify_id VARCHAR(255) UNIQUE,
          spotify_url VARCHAR(255),
          profile_image_url VARCHAR(255),
          profile_image_small_url VARCHAR(255),
          profile_image_large_url VARCHAR(255),
          external_urls JSONB DEFAULT '{}',
          spotify_followers INTEGER DEFAULT 0,
          spotify_popularity INTEGER DEFAULT 0,
          spotify_genres TEXT[],
          label_id VARCHAR(255) REFERENCES labels(id) ON DELETE SET NULL ON UPDATE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for artists
        CREATE INDEX IF NOT EXISTS artists_name ON artists(name);
        CREATE INDEX IF NOT EXISTS artists_spotify_id ON artists(spotify_id);
        CREATE INDEX IF NOT EXISTS artists_label_id ON artists(label_id);
      `);

      // Create releases table which depends on labels
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS releases (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          spotify_id VARCHAR(255) UNIQUE,
          release_type release_type NOT NULL,
          release_date TIMESTAMP WITH TIME ZONE NOT NULL,
          artwork_url VARCHAR(255),
          artwork_small_url VARCHAR(255),
          artwork_large_url VARCHAR(255),
          spotify_url VARCHAR(255),
          external_urls JSONB DEFAULT '{}',
          label_id VARCHAR(255) REFERENCES labels(id) ON DELETE SET NULL ON UPDATE CASCADE,
          status release_status NOT NULL DEFAULT 'draft',
          spotify_popularity INTEGER DEFAULT 0,
          total_tracks INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for releases
        CREATE INDEX IF NOT EXISTS releases_label_id ON releases(label_id);
        CREATE INDEX IF NOT EXISTS releases_spotify_id ON releases(spotify_id);
        CREATE INDEX IF NOT EXISTS releases_release_date ON releases(release_date);
        CREATE INDEX IF NOT EXISTS releases_status ON releases(status);
        CREATE INDEX IF NOT EXISTS releases_release_type ON releases(release_type);
      `);

      // Create release_artists table which depends on releases and artists
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS release_artists (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE ON UPDATE CASCADE,
          artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE ON UPDATE CASCADE,
          role artist_role NOT NULL DEFAULT 'primary',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(release_id, artist_id, role)
        );

        -- Create indexes for release_artists
        CREATE INDEX IF NOT EXISTS release_artists_release_id ON release_artists(release_id);
        CREATE INDEX IF NOT EXISTS release_artists_artist_id ON release_artists(artist_id);
        CREATE INDEX IF NOT EXISTS release_artists_role ON release_artists(role);
      `);

      // Create tracks table which depends on releases
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS tracks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          duration_ms INTEGER,
          preview_url VARCHAR(255),
          spotify_id VARCHAR(255) UNIQUE,
          spotify_uri VARCHAR(255),
          spotify_url VARCHAR(255),
          release_id UUID REFERENCES releases(id) ON DELETE CASCADE ON UPDATE CASCADE,
          track_number INTEGER,
          disc_number INTEGER DEFAULT 1,
          isrc VARCHAR(255),
          external_urls JSONB DEFAULT '{}',
          spotify_popularity INTEGER DEFAULT 0,
          explicit BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes for tracks
        CREATE INDEX IF NOT EXISTS tracks_release_id ON tracks(release_id);
        CREATE INDEX IF NOT EXISTS tracks_spotify_id ON tracks(spotify_id);
      `);

      // Create track_artists table which depends on tracks and artists
      await queryInterface.sequelize.query(`
        CREATE TABLE IF NOT EXISTS track_artists (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE ON UPDATE CASCADE,
          artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE ON UPDATE CASCADE,
          role artist_role NOT NULL DEFAULT 'primary',
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(track_id, artist_id, role)
        );

        -- Create indexes for track_artists
        CREATE INDEX IF NOT EXISTS track_artists_track_id ON track_artists(track_id);
        CREATE INDEX IF NOT EXISTS track_artists_artist_id ON track_artists(artist_id);
        CREATE INDEX IF NOT EXISTS track_artists_role ON track_artists(role);
      `);

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query(`
        -- Drop tables in reverse order of creation
        DROP TABLE IF EXISTS track_artists;
        DROP TABLE IF EXISTS tracks;
        DROP TABLE IF EXISTS release_artists;
        DROP TABLE IF EXISTS releases;
        DROP TABLE IF EXISTS artists;
        DROP TABLE IF EXISTS labels;

        -- Drop enum types
        DROP TYPE IF EXISTS artist_role;
        DROP TYPE IF EXISTS release_type;
        DROP TYPE IF EXISTS release_status;
      `);
    } catch (error) {
      console.error('Migration rollback failed:', error);
      throw error;
    }
  }
};
