BEGIN;

DROP TABLE IF EXISTS import_logs CASCADE;
DROP TABLE IF EXISTS track_artists CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS release_artists CASCADE;
DROP TABLE IF EXISTS releases CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS labels CASCADE;

-- Create labels table
CREATE TABLE labels (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  playlist_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_labels_slug ON labels(slug);

-- Insert default labels
INSERT INTO labels (id, name, display_name, slug)
VALUES 
  ('buildit-records', 'Build It Records', 'Build It Records', 'buildit-records'),
  ('buildit-tech', 'Build It Tech', 'Build It Tech', 'buildit-tech'),
  ('buildit-deep', 'Build It Deep', 'Build It Deep', 'buildit-deep');

-- Create import_logs table
CREATE TABLE import_logs (
  id SERIAL PRIMARY KEY,
  label_id VARCHAR(255) REFERENCES labels(id),
  status VARCHAR(50) NOT NULL,
  message TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_import_logs_label_id ON import_logs(label_id);
CREATE INDEX idx_import_logs_status ON import_logs(status);
CREATE INDEX idx_import_logs_completed_at ON import_logs(completed_at);

-- Create artists table
CREATE TABLE artists (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  image_url VARCHAR(255),
  spotify_url VARCHAR(255),
  label_id VARCHAR(255) REFERENCES labels(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_artists_name ON artists(name);
CREATE INDEX idx_artists_label_id ON artists(label_id);
CREATE INDEX idx_artists_created_at ON artists(created_at);

-- Create releases table
CREATE TABLE releases (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  release_date DATE,
  artwork_url VARCHAR(255),
  spotify_url VARCHAR(255),
  label_id VARCHAR(255) REFERENCES labels(id),
  primary_artist_id VARCHAR(255) REFERENCES artists(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_releases_title ON releases(title);
CREATE INDEX idx_releases_label_id ON releases(label_id);
CREATE INDEX idx_releases_release_date ON releases(release_date);
CREATE INDEX idx_releases_created_at ON releases(created_at);

-- Create tracks table
CREATE TABLE tracks (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL,
  track_number INTEGER,
  disc_number INTEGER,
  isrc VARCHAR(255),
  preview_url VARCHAR(255),
  spotify_url VARCHAR(255),
  release_id VARCHAR(255) REFERENCES releases(id),
  label_id VARCHAR(255) REFERENCES labels(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tracks_name ON tracks(name);
CREATE INDEX idx_tracks_release_id ON tracks(release_id);
CREATE INDEX idx_tracks_label_id ON tracks(label_id);
CREATE INDEX idx_tracks_created_at ON tracks(created_at);

-- Create track_artists join table
CREATE TABLE track_artists (
  track_id VARCHAR(255) REFERENCES tracks(id),
  artist_id VARCHAR(255) REFERENCES artists(id),
  role VARCHAR(50) DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (track_id, artist_id, role)
);

CREATE INDEX idx_track_artists_track_id ON track_artists(track_id);
CREATE INDEX idx_track_artists_artist_id ON track_artists(artist_id);

-- Create release_artists join table
CREATE TABLE release_artists (
  release_id VARCHAR(255) REFERENCES releases(id),
  artist_id VARCHAR(255) REFERENCES artists(id),
  role VARCHAR(50) DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (release_id, artist_id, role)
);

CREATE INDEX idx_release_artists_release_id ON release_artists(release_id);
CREATE INDEX idx_release_artists_artist_id ON release_artists(artist_id);

COMMIT;
