-- Create labels table
CREATE TABLE labels (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create artists table
CREATE TABLE artists (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    label_id VARCHAR(255) REFERENCES labels(id),
    spotify_url VARCHAR(255),
    images JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create releases table
CREATE TABLE releases (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist_id VARCHAR(255) REFERENCES artists(id),
    label_id VARCHAR(255) REFERENCES labels(id),
    release_date DATE,
    images JSONB DEFAULT '[]',
    spotify_url VARCHAR(255),
    external_urls JSONB DEFAULT '{}',
    external_ids JSONB DEFAULT '{}',
    popularity INTEGER,
    total_tracks INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tracks table
CREATE TABLE tracks (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist_id VARCHAR(255) REFERENCES artists(id),
    release_id VARCHAR(255) REFERENCES releases(id),
    label_id VARCHAR(255) REFERENCES labels(id),
    duration_ms INTEGER,
    preview_url VARCHAR(255),
    spotify_url VARCHAR(255),
    external_urls JSONB DEFAULT '{}',
    uri VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default labels
INSERT INTO labels (id, name, display_name, slug) VALUES
    ('buildit-records', 'Build It Records', 'Build It Records', 'buildit-records'),
    ('buildit-deep', 'Build It Deep', 'Build It Deep', 'buildit-deep'),
    ('buildit-tech', 'Build It Tech', 'Build It Tech', 'buildit-tech');

-- Create indexes for better performance
CREATE INDEX idx_artists_label_id ON artists(label_id);
CREATE INDEX idx_releases_label_id ON releases(label_id);
CREATE INDEX idx_releases_artist_id ON releases(artist_id);
CREATE INDEX idx_tracks_label_id ON tracks(label_id);
CREATE INDEX idx_tracks_release_id ON tracks(release_id);
CREATE INDEX idx_tracks_artist_id ON tracks(artist_id);
