# BuildItRecords PostgreSQL Database Schema

This document provides a comprehensive overview of the database schema for the BuildItRecords application. The purpose is to ensure consistency between the database schema and TypeScript type definitions.

## Table of Contents
- [Artists](#artists)
- [Releases](#releases)
- [Tracks](#tracks)
- [Albums](#albums)
- [Related Artists](#related-artists)
- [Top Tracks](#top-tracks)

## Artists

The `artists` table stores information about musical artists.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | VARCHAR(255) | NO (PK) | Primary key |
| name | VARCHAR(255) | NO | Artist name |
| genres | TEXT[] | YES | Array of genres associated with the artist |
| popularity | INTEGER | YES | Popularity score from Spotify |
| followers | INTEGER | YES | Number of followers |
| followers_count | INTEGER | YES | Alternative follower count field |
| images | JSONB | YES | JSON array of image URLs in different sizes |
| external_urls | JSONB | YES | JSON object containing URLs to external platforms |
| image_url | VARCHAR(255) | YES | Main image URL for the artist |
| label | VARCHAR(50) | YES | Label identifier (e.g., 'records') |
| label_id | VARCHAR(255) | YES | Foreign key to labels table |
| spotify_id | VARCHAR(255) | YES | Spotify ID for the artist |
| created_at | TIMESTAMP | YES | Record creation timestamp |
| updated_at | TIMESTAMP | YES | Record update timestamp |

**TypeScript Interface:**
```typescript
export interface Artist {
  id: string;
  name: string;
  genres?: string[];
  popularity?: number;
  followers?: number;
  followers_count?: number;
  images?: SpotifyImage[];
  external_urls?: SpotifyExternalUrls;
  image_url?: string;
  label?: string;
  label_id?: string;
  spotify_id?: string;
  spotify_uri?: string;
  uri?: string;
  type: 'artist';
  created_at?: string;
  updated_at?: string;
}
```

## Releases

The `releases` table stores information about music releases (albums, singles, EPs).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | VARCHAR(255) | NO (PK) | Primary key |
| name | VARCHAR(255) | NO | Release name (renamed from title) |
| type | VARCHAR(50) | YES | Release type (album, single, compilation) |
| release_type | VARCHAR(50) | YES | Alternative field for release type |
| release_date | DATE | YES | Release date |
| images | JSONB | YES | JSON array of image URLs |
| artists | JSONB | YES | JSON array of artists |
| label_id | VARCHAR(255) | YES | Foreign key to labels table |
| artist_id | VARCHAR(255) | YES | Foreign key to artists table |
| total_tracks | INTEGER | YES | Total number of tracks |
| external_urls | JSONB | YES | JSON object with external URLs |
| spotify_uri | VARCHAR(255) | YES | Spotify URI |
| spotify_id | VARCHAR(255) | YES | Spotify ID |
| popularity | INTEGER | YES | Popularity score |
| created_at | TIMESTAMP | YES | Record creation timestamp |
| updated_at | TIMESTAMP | YES | Record update timestamp |
| status | VARCHAR | YES | Status of the release (active, draft, archived) |

**TypeScript Interface:**
```typescript
export interface Release {
  id: string;
  name: string;
  type: 'album' | 'single' | 'compilation';
  release_type?: string;
  release_date: string;
  images: SpotifyImage[];
  artists: Artist[];
  label_id: string;
  artist_id?: string;
  total_tracks: number;
  external_urls: SpotifyExternalUrls;
  uri: string;
  spotify_uri: string;
  spotify_id?: string;
  album_type: 'album' | 'single' | 'compilation';
  popularity?: number;
  tracks: Track[];
  created_at?: string;
  updated_at?: string;
  status?: 'active' | 'draft' | 'archived';
}
```

## Tracks

The `tracks` table stores information about individual music tracks.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | VARCHAR(255) | NO (PK) | Primary key |
| name | VARCHAR(255) | NO | Track name (renamed from title) |
| duration_ms | INTEGER | YES | Track duration in milliseconds |
| preview_url | TEXT | YES | URL to preview audio |
| popularity | INTEGER | YES | Popularity score |
| release_id | VARCHAR(255) | YES | Foreign key to releases table |
| artist_id | VARCHAR(255) | YES | Foreign key to artists table |
| spotify_uri | VARCHAR(255) | YES | Spotify URI |
| spotify_id | VARCHAR(255) | YES | Spotify ID |
| external_urls | JSONB | YES | JSON object with external URLs |
| explicit | BOOLEAN | YES | Whether the track has explicit content |
| track_number | INTEGER | YES | Position of the track in its album |
| disc_number | INTEGER | YES | Disc number for multi-disc albums |
| audio_features | JSONB | YES | Spotify audio features data |
| remixer_id | UUID | YES | Artist ID of the remixer, if any |
| created_at | TIMESTAMP | YES | Record creation timestamp |
| updated_at | TIMESTAMP | YES | Record update timestamp |
| status | VARCHAR | YES | Status of the track (active, draft, archived) |

**TypeScript Interface:**
```typescript
export interface Track {
  id: string;
  name: string;
  duration: number; // maps to duration_ms
  track_number?: number;
  disc_number?: number;
  artists: TrackArtist[];
  album?: Album;
  uri?: string;
  external_urls?: SpotifyExternalUrls;
  preview_url: string | null | undefined;
  is_playable?: boolean;
  explicit?: boolean;
  popularity?: number;
  release_id?: string;
  artist_id?: string;
  remixer_id?: string;
  spotify_uri?: string;
  spotify_id?: string;
  release_date?: string;
  label_id?: string;
  audio_features?: {
    loudness: number;
    tempo: number;
    time_signature: number;
    key: number;
    mode: number;
  };
  metadata?: {
    bpm?: number;
    key?: string;
    genre?: string[];
    mood?: string[];
    tags?: string[];
  };
  created_at?: string;
  updated_at?: string;
  status?: 'active' | 'draft' | 'archived';
}
```

## Albums

The `albums` table stores detailed album information.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | VARCHAR(255) | NO (PK) | Primary key |
| artist_id | VARCHAR(255) | YES | Foreign key to artists table |
| include_groups | VARCHAR(50) | YES | Album grouping information |
| name | VARCHAR(255) | NO | Album name |
| release_date | DATE | YES | Release date |
| total_tracks | INTEGER | YES | Total number of tracks |
| type | VARCHAR(50) | YES | Album type |
| images | JSONB | YES | JSON array of image URLs |
| external_urls | JSONB | YES | JSON object with external URLs |
| created_at | TIMESTAMP | YES | Record creation timestamp |
| updated_at | TIMESTAMP | YES | Record update timestamp |

**TypeScript Interface:**
```typescript
export type Album = {
  id: string;
  name: string;
  type: 'album' | 'single' | 'compilation';
  artists: Artist[];
  tracks: Track[];
  images: Image[];
  artwork_url?: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  external_urls: ExternalUrls;
  uri: string;
  spotify_uri: string;
  label: RecordLabelId;
  label_id?: string;
  album_type: 'album' | 'single' | 'compilation';
  artist_id?: string;
  copyrights?: Copyright[];
  popularity?: number;
  available_markets?: string[];
  status?: 'active' | 'draft' | 'archived';
  created_at?: string;
  updated_at?: string;
};
```

## Related Artists

The `related_artists` table stores relationships between artists.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| artist_id | VARCHAR(255) | NO (PK) | Primary key, foreign key to artists table |
| related_artist_id | VARCHAR(255) | NO (PK) | Primary key, foreign key to artists table |
| created_at | TIMESTAMP | YES | Record creation timestamp |

## Top Tracks

The `top_tracks` table stores information about an artist's top tracks.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | VARCHAR(255) | NO (PK) | Primary key |
| artist_id | VARCHAR(255) | NO (PK) | Primary key, foreign key to artists table |
| market | VARCHAR(2) | NO (PK) | Primary key, market code |
| name | VARCHAR(255) | NO | Track name |
| popularity | INTEGER | YES | Popularity score |
| preview_url | TEXT | YES | URL to preview audio |
| duration_ms | INTEGER | YES | Track duration in milliseconds |
| album_id | VARCHAR(255) | YES | Album ID |
| album_name | VARCHAR(255) | YES | Album name |
| album_release_date | DATE | YES | Album release date |
| album_images | JSONB | YES | JSON array of album image URLs |
| created_at | TIMESTAMP | YES | Record creation timestamp |

## Important Notes

1. The database has undergone several migrations, notably:
   - Renaming `title` to `name` in both `releases` and `tracks` tables
   - Adding Spotify integration fields
   - Consolidating artist image columns
   - Adding label references

2. Type consistency requirements:
   - Always use `name` instead of `title` for tracks and releases
   - Use `spotify_uri` instead of `spotify_url`
   - Use proper reference to `label_id` in appropriate tables

3. TypeScript Integration:
   - Ensure all TypeScript interfaces match the corresponding database tables
   - Use optional fields (with `?`) for nullable database columns
   - Maintain consistent naming between database columns and TypeScript properties

4. Common Issues to Avoid:
   - Mixing `title` and `name` properties
   - Incorrect nesting of properties in interfaces
   - Missing required fields in database queries
