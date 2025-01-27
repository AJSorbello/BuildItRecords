-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    genres TEXT[],
    popularity INTEGER,
    followers INTEGER,
    images JSONB,
    external_urls JSONB,
    label_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create releases table
CREATE TABLE IF NOT EXISTS releases (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    release_date DATE,
    images JSONB,
    artists JSONB,
    label_id VARCHAR(255),
    artist_id VARCHAR(255) REFERENCES artists(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create tracks table
CREATE TABLE IF NOT EXISTS tracks (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration_ms INTEGER,
    preview_url TEXT,
    popularity INTEGER,
    release_id VARCHAR(255) REFERENCES releases(id),
    artist_id VARCHAR(255) REFERENCES artists(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create related_artists table
CREATE TABLE IF NOT EXISTS related_artists (
    artist_id VARCHAR(255) REFERENCES artists(id),
    related_artist_id VARCHAR(255) REFERENCES artists(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (artist_id, related_artist_id)
);

-- Create top_tracks table
CREATE TABLE IF NOT EXISTS top_tracks (
    id VARCHAR(255),
    artist_id VARCHAR(255) REFERENCES artists(id),
    market VARCHAR(2),
    name VARCHAR(255) NOT NULL,
    popularity INTEGER,
    preview_url TEXT,
    duration_ms INTEGER,
    album_id VARCHAR(255),
    album_name VARCHAR(255),
    album_release_date DATE,
    album_images JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, artist_id, market)
);

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
    id VARCHAR(255) PRIMARY KEY,
    artist_id VARCHAR(255) REFERENCES artists(id),
    include_groups VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    release_date DATE,
    total_tracks INTEGER,
    type VARCHAR(50),
    images JSONB,
    external_urls JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
