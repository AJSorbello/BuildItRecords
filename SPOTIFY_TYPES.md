# Spotify API Types Reference

This document serves as a reference for Spotify API types and how they map to our application. It helps maintain consistency with Spotify's schema.

## Track Object

### Spotify Track Object
```typescript
interface SpotifyTrack {
  id: string;                    // The Spotify ID for the track
  name: string;                  // The name of the track
  duration_ms: number;           // The track length in milliseconds
  preview_url: string | null;    // A URL to a 30 second preview (MP3 format) of the track
  external_urls: {               // Known external URLs for this track
    spotify: string;             // The Spotify URL for the track
  };
  external_ids: {                // Known external IDs for the track
    isrc: string;               // International Standard Recording Code
    ean: string;                // International Article Number
    upc: string;                // Universal Product Code
  };
  uri: string;                   // The Spotify URI for the track
  type: 'track';                // The object type
  track_number: number;          // The number of the track
  disc_number: number;           // The disc number (usually 1 unless the album consists of more than one disc)
  explicit: boolean;             // Whether or not the track has explicit lyrics
  popularity: number;            // The popularity of the track (0-100)
  artists: SpotifyArtist[];      // The artists who performed the track
  album: SpotifyAlbum;          // The album on which the track appears
}
```

### Our Track Interface (Current)
```typescript
interface Track {
  id: string;
  name: string;                 // ✓ Matches Spotify
  duration: number;             // ✓ Matches Spotify (we removed _ms suffix)
  track_number?: number;        // ✓ Matches Spotify
  disc_number?: number;         // ✓ Matches Spotify
  isrc?: string;               // ✓ Matches Spotify (from external_ids)
  preview_url?: string | null;  // ✓ Matches Spotify
  spotify_url?: string;        // ✓ Derived from external_urls.spotify
  release_id?: string;         // Custom field for our DB
  label_id?: string;          // Custom field for our DB
  label?: string;             // Custom field for our DB
  created_at?: Date;          // Custom field for our DB
  updated_at?: Date;          // Custom field for our DB
  artists: Artist[];          // ✓ Matches Spotify structure
  album?: Album;             // ✓ Matches Spotify structure
  external_urls?: SpotifyExternalUrls;  // ✓ Matches Spotify
  uri?: string;              // ✓ Matches Spotify
  artwork_url?: string;      // ❌ Should be images from album object
  type?: 'track';           // ✓ Matches Spotify
}
```

## Album Object

### Spotify Album Object
```typescript
interface SpotifyAlbum {
  id: string;                   // The Spotify ID for the album
  name: string;                 // The name of the album
  album_type: string;           // The type of the album: album, single, compilation
  total_tracks: number;         // The number of tracks in the album
  release_date: string;         // The date the album was first released
  release_date_precision: string; // The precision with which release_date value is known: year, month, day
  images: SpotifyImage[];       // The cover art for the album in various sizes
  external_urls: {
    spotify: string;
  };
  uri: string;                  // The Spotify URI for the album
  artists: SpotifyArtist[];     // The artists of the album
  type: 'album';               // The object type
}
```

### Our Album Interface (Current)
```typescript
interface Album {
  id: string;                  // ✓ Matches Spotify
  name: string;                // ✓ Matches Spotify
  artwork_url?: string;        // ❌ Should use images array instead
  type?: 'album' | 'single' | 'compilation';  // ✓ Matches Spotify's album_type
  release_date?: string;       // ✓ Matches Spotify
  artists: Artist[];           // ✓ Matches Spotify
  external_urls?: SpotifyExternalUrls;  // ✓ Matches Spotify
  uri?: string;               // ✓ Matches Spotify
}
```

## Needed Changes

1. **Track Interface**:
   - Replace `artwork_url` with `images` array from album object
   - Consider adding `popularity` field
   - Consider adding `explicit` field

2. **Album Interface**:
   - Replace `artwork_url` with `images` array:
   ```typescript
   images: Array<{
     url: string;
     height: number;
     width: number;
   }>;
   ```
   - Add `total_tracks` field
   - Add `release_date_precision` field

3. **Database Schema**:
   - Update tracks table to include `explicit` and `popularity` fields
   - Update albums table to use proper image structure
   - Add `release_date_precision` to albums table

## Best Practices

1. Always use Spotify's field names when possible
2. Keep optional fields optional (marked with ?)
3. Document any custom fields we add
4. Use proper typing for all fields
5. Maintain consistency between TypeScript interfaces and database schema
