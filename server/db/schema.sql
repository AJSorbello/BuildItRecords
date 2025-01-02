BEGIN;

DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS albums CASCADE;
DROP TABLE IF EXISTS artist_labels CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS labels CASCADE;

-- Create labels table
CREATE TABLE labels (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    "displayName" VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on slug for faster lookups
CREATE INDEX idx_labels_slug ON labels(slug);

-- Insert default labels
INSERT INTO labels (id, name, "displayName", slug) 
VALUES 
    ('buildit-records', 'records', 'Build It Records', 'buildit-records'),
    ('buildit-tech', 'tech', 'Build It Tech', 'buildit-tech'),
    ('buildit-deep', 'deep', 'Build It Deep', 'buildit-deep')
ON CONFLICT (id) DO NOTHING;

-- Create artists table
CREATE TABLE artists (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    images JSONB,
    genres TEXT[],
    external_urls JSONB,
    followers INTEGER DEFAULT 0,
    popularity INTEGER DEFAULT 0,
    uri VARCHAR(255),
    "labelId" VARCHAR(255) REFERENCES labels(id),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for artist lookups
CREATE INDEX idx_artists_name ON artists(name);
CREATE INDEX idx_artists_label_id ON artists("labelId");
CREATE INDEX idx_artists_popularity ON artists(popularity DESC);

-- Create albums table
CREATE TABLE albums (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "artistId" VARCHAR(255) REFERENCES artists(id) ON DELETE CASCADE,
    "labelId" VARCHAR(255) REFERENCES labels(id) ON DELETE CASCADE,
    images JSONB,
    release_date DATE,
    total_tracks INTEGER DEFAULT 0,
    external_urls JSONB,
    uri VARCHAR(255),
    album_type VARCHAR(50),
    popularity INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for album lookups
CREATE INDEX idx_albums_name ON albums(name);
CREATE INDEX idx_albums_artist_id ON albums("artistId");
CREATE INDEX idx_albums_label_id ON albums("labelId");
CREATE INDEX idx_albums_release_date ON albums(release_date DESC);
CREATE INDEX idx_albums_popularity ON albums(popularity DESC);

-- Create tracks table
CREATE TABLE tracks (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "albumId" VARCHAR(255) REFERENCES albums(id) ON DELETE CASCADE,
    "artistId" VARCHAR(255) REFERENCES artists(id) ON DELETE CASCADE,
    duration_ms INTEGER,
    preview_url VARCHAR(255),
    external_urls JSONB,
    uri VARCHAR(255),
    popularity INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for track lookups
CREATE INDEX idx_tracks_name ON tracks(name);
CREATE INDEX idx_tracks_album_id ON tracks("albumId");
CREATE INDEX idx_tracks_artist_id ON tracks("artistId");

-- Create artist_labels junction table
CREATE TABLE artist_labels (
    "artistId" VARCHAR(255) REFERENCES artists(id) ON DELETE CASCADE,
    "labelId" VARCHAR(255) REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY ("artistId", "labelId")
);

-- Create index for artist_labels lookups
CREATE INDEX idx_artist_labels_label_id ON artist_labels("labelId");

COMMIT;
