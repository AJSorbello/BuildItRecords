# Build It Records Data Mapping Guide

## Overview
This guide ensures consistent data mapping across the Build It Records application. Reference this document before making changes to data structures, API integrations, or database schemas.

## Key Components to Check

### 1. Database Schema (ReleaseService)
- **Track Fields**
  - `id`: string (required)
  - `name`: string (required)
  - `artist_id`: string
  - `release_id`: string
  - `label_id`: string
  - `duration`: number
  - `preview_url`: string | null
  - `spotify_url`: string
  - `external_urls`: object
  - `uri`: string
  - `track_number`: number
  - `disc_number`: number
  - `explicit`: boolean
  - `popularity`: number

- **Album/Release Fields**
  - `id`: string (required)
  - `title`: string (required)
  - `artist_id`: string
  - `label_id`: string
  - `release_date`: Date
  - `images`: array
  - `spotify_url`: string
  - `external_urls`: object
  - `external_ids`: object
  - `popularity`: number
  - `total_tracks`: number
  - `album_type`: string
  - `release_date_precision`: string
  - `available_markets`: array
  - `copyrights`: object

### 2. Spotify Integration (SpotifyService)
- **Track Mapping**
  - Must include all Spotify API fields
  - Convert duration from ms to seconds if needed
  - Handle null preview_urls
  - Map external_urls correctly
  - Map track_number and disc_number correctly
  - Map explicit and popularity correctly

- **Album Mapping**
  - Include all required Spotify metadata
  - Handle release_date_precision
  - Map image arrays correctly
  - Preserve market availability data
  - Map album_type and copyrights correctly

### 3. Frontend Components
- **TrackManager Requirements**
  - Track editing capabilities
  - Track deletion handling
  - Import functionality
  - Proper event handlers

- **ReleasePage Validation**
  - Release object validation
  - Required properties checking
  - Default value handling
  - Image URL fallbacks

### 4. Type Definitions
- **Track Interface**
  ```typescript
  {
    id: string;
    name: string;  // Matches Spotify track.name
    duration: number;
    artists: Artist[];
    preview_url: string | null;
    spotify_url: string;
    external_urls: SpotifyExternalUrls;
    uri: string;
    type: 'track';
    artwork_url?: string;
    album?: Album;
    track_number?: number;
    disc_number?: number;
    label_id?: string;
    remixer?: Artist | null;
    explicit?: boolean;
    popularity?: number;
  }
  ```

- **Album Interface**
  ```typescript
  {
    id: string;
    title: string;
    name?: string;
    artists: Artist[];
    images: SpotifyImage[];
    artwork_url?: string;
    release_date: string;
    release_date_precision?: string;
    total_tracks: number;
    external_urls: SpotifyExternalUrls;
    uri: string;
    type: 'album' | 'single' | 'compilation';
    album_type?: string;
    label_id?: string;
    spotify_url: string;
    popularity?: number;
    available_markets?: string[];
    remixers?: string[];
    copyrights?: object;
  }
  ```

## Checklist Before Making Changes
1. ✓ Verify database schema compatibility
2. ✓ Check Spotify API mapping consistency
3. ✓ Ensure frontend component support
4. ✓ Validate type definitions
5. ✓ Test data flow through services
6. ✓ Verify admin dashboard compatibility
7. ✓ Check track manager functionality
8. ✓ Validate releases page display

## Common Pitfalls
1. Inconsistent URL field naming (`spotify_url` vs `spotifyUrl`)
2. Missing null checks for optional fields
3. Incorrect type assertions
4. Incomplete error handling
5. Missing field transformations
6. Inconsistent date formatting
7. Improper image URL fallbacks

## Best Practices
1. Always use TypeScript interfaces
2. Include proper null checks
3. Provide fallback values
4. Maintain consistent field naming
5. Document API transformations
6. Handle all edge cases
7. Include proper error handling
8. Validate data at service boundaries

## Related Files to Check
- `/src/services/ReleaseService.ts`
- `/src/services/SpotifyService.ts`
- `/src/components/admin/TrackManager.tsx`
- `/src/pages/ReleasesPage.tsx`
- `/src/types/Track.ts`
- `/src/types/Album.ts`
- `/src/types/artist.ts`
- `/src/App.tsx`

## Notes
- Keep this document updated when making schema changes
- Reference the MEMORIES for historical context
- Test all data flows after making changes
- Update related components when modifying schemas
- We use `name` consistently across our application to match Spotify's schema
- All durations are stored in milliseconds

## Data Mapping Guide

This guide documents how data is mapped between Spotify's API and our database schema.

### Track Data

#### Database Schema (tracks table)
```sql
CREATE TABLE tracks (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL,
  track_number INTEGER,
  disc_number INTEGER DEFAULT 1,
  preview_url TEXT,
  spotify_url TEXT,
  external_urls JSONB,
  external_ids JSONB,
  uri VARCHAR(255),
  type VARCHAR(10) DEFAULT 'track',
  explicit BOOLEAN DEFAULT false,
  popularity INTEGER DEFAULT 0,
  release_id VARCHAR(255),
  label_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

#### Spotify API to Database Mapping
- Spotify Track → Database Track:
  - `track.id` → `id`
  - `track.name` → `name`
  - `track.duration_ms` → `duration`
  - `track.track_number` → `track_number`
  - `track.disc_number` → `disc_number`
  - `track.preview_url` → `preview_url`
  - `track.external_urls.spotify` → `spotify_url`
  - `track.external_urls` → `external_urls`
  - `track.external_ids` → `external_ids`
  - `track.uri` → `uri`
  - `track.type` → `type`
  - `track.explicit` → `explicit`
  - `track.popularity` → `popularity`

### Album Data

#### Database Schema (albums table)
```sql
CREATE TABLE albums (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  album_type VARCHAR(20),
  total_tracks INTEGER DEFAULT 0,
  release_date VARCHAR(20),
  release_date_precision VARCHAR(10),
  external_urls JSONB,
  uri VARCHAR(255),
  available_markets TEXT[],
  popularity INTEGER DEFAULT 0,
  copyrights JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE album_images (
  id SERIAL PRIMARY KEY,
  album_id VARCHAR(255) REFERENCES albums(id),
  url VARCHAR(255) NOT NULL,
  height INTEGER,
  width INTEGER
);

CREATE TABLE album_artists (
  album_id VARCHAR(255) REFERENCES albums(id),
  artist_id VARCHAR(255) REFERENCES artists(id),
  position INTEGER DEFAULT 0,
  PRIMARY KEY (album_id, artist_id)
);
```

#### Spotify API to Database Mapping
- Spotify Album → Database Album:
  - `album.id` → `id`
  - `album.name` → `name`
  - `album.album_type` → `album_type`
  - `album.total_tracks` → `total_tracks`
  - `album.release_date` → `release_date`
  - `album.release_date_precision` → `release_date_precision`
  - `album.external_urls` → `external_urls`
  - `album.uri` → `uri`
  - `album.available_markets` → `available_markets`
  - `album.popularity` → `popularity`
  - `album.copyrights` → `copyrights`
  - `album.images` → Multiple rows in `album_images`
  - `album.artists` → Multiple rows in `album_artists`

### Best Practices

1. **Field Names**: 
   - Use Spotify's field names whenever possible
   - Only deviate when we need to add custom fields

2. **Data Types**:
   - Use appropriate PostgreSQL types that match Spotify's data
   - Store complex objects as JSONB
   - Use arrays for simple lists

3. **Relationships**:
   - Use junction tables for many-to-many relationships
   - Use foreign keys with appropriate ON DELETE actions

4. **Custom Fields**:
   - Prefix custom fields with appropriate context (e.g., `label_` for label-specific fields)
   - Document custom fields thoroughly

5. **Timestamps**:
   - Always include `created_at` and `updated_at`
   - Use TIMESTAMP WITH TIME ZONE for all date/time fields

6. **Nullability**:
   - Match Spotify's nullability where possible
   - Make custom fields nullable unless absolutely required

7. **Indexing**:
   - Index foreign keys
   - Index frequently queried fields
   - Use appropriate index types (B-tree, GiST, etc.)
