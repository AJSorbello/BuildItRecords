BEGIN;

DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS releases CASCADE;
DROP TABLE IF EXISTS artist_labels CASCADE;
DROP TABLE IF EXISTS artists CASCADE;
DROP TABLE IF EXISTS labels CASCADE;

-- Create labels table
CREATE TABLE labels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on slug for faster lookups
CREATE INDEX idx_labels_slug ON labels(slug);

-- Insert default labels
INSERT INTO labels (name, slug) 
VALUES 
    ('Build It Records', 'buildit-records'),
    ('Build It Tech', 'buildit-tech'),
    ('Build It Deep', 'buildit-deep')
ON CONFLICT (slug) DO NOTHING;

-- Create artists table
CREATE TABLE artists (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "spotifyUrl" VARCHAR(255),
    images JSONB,
    genres TEXT[],
    "followersCount" INTEGER DEFAULT 0,
    "primaryLabel" VARCHAR(255),
    bio TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("primaryLabel") REFERENCES labels(name)
);

-- Create indexes for artist lookups
CREATE INDEX idx_artists_name ON artists(name);
CREATE INDEX idx_artists_spotify_url ON artists("spotifyUrl");
CREATE INDEX idx_artists_primary_label ON artists("primaryLabel");

-- Create releases table
CREATE TABLE releases (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    "artistId" VARCHAR(255),
    "labelId" INTEGER,
    "albumArtUrl" VARCHAR(255),
    "releaseDate" DATE,
    "spotifyId" VARCHAR(255),
    "spotifyUrl" VARCHAR(255),
    "beatportUrl" VARCHAR(255),
    "soundcloudUrl" VARCHAR(255),
    popularity INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("artistId") REFERENCES artists(id) ON DELETE CASCADE,
    FOREIGN KEY ("labelId") REFERENCES labels(id) ON DELETE CASCADE
);

-- Create indexes for release lookups
CREATE INDEX idx_releases_title ON releases(title);
CREATE INDEX idx_releases_artist_id ON releases("artistId");
CREATE INDEX idx_releases_label_id ON releases("labelId");
CREATE INDEX idx_releases_release_date ON releases("releaseDate" DESC);
CREATE INDEX idx_releases_spotify_id ON releases("spotifyId");
CREATE INDEX idx_releases_popularity ON releases(popularity DESC);

-- Create artist_labels junction table
CREATE TABLE artist_labels (
    "artistId" VARCHAR(255),
    "labelId" INTEGER,
    PRIMARY KEY ("artistId", "labelId"),
    FOREIGN KEY ("artistId") REFERENCES artists(id) ON DELETE CASCADE,
    FOREIGN KEY ("labelId") REFERENCES labels(id) ON DELETE CASCADE
);

-- Create index for artist_labels lookups
CREATE INDEX idx_artist_labels_label_id ON artist_labels("labelId");

-- Create partial indexes for frequently accessed conditions
CREATE INDEX idx_releases_recent ON releases("releaseDate" DESC) 
WHERE "releaseDate" >= NOW() - INTERVAL '6 months';

CREATE INDEX idx_releases_popular ON releases(popularity DESC) 
WHERE popularity >= 70;

COMMIT;
