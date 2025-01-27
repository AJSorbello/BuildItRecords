# Build It Records Project Structure

## Overview

Build It Records is a TypeScript-based web application for managing a record label's music catalog. It integrates with Spotify's API to import and manage tracks, albums, and artists while maintaining a local PostgreSQL database for persistence.

## Core Types and Interfaces

### Track Related Types
```typescript
interface Track {
  id: string;
  name: string;
  type: TrackType;
  status: TrackStatus;
  duration_ms: number;
  uri: string;
  href: string;
  external_urls: SpotifyExternalUrls;
  external_ids: SpotifyExternalIds;
  preview_url?: string;
  popularity?: number;
  explicit: boolean;
  label_id?: string;
  artists: Artist[];
  album?: Album;
  createdAt: Date;
  updatedAt: Date;
}

enum TrackType {
  TRACK = 'track',
  REMIX = 'remix'
}

enum TrackStatus {
  PENDING = 'pending',
  DRAFT = 'draft',
  PUBLISHED = 'published'
}
```

### Album Related Types
```typescript
interface Album {
  id: string;
  name: string;
  type: AlbumType;
  status: AlbumStatus;
  artists: Artist[];
  tracks: Track[];
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  uri: string;
  external_urls: SpotifyExternalUrls;
  external_ids: SpotifyExternalIds;
  images: SpotifyImage[];
  popularity: number;
  createdAt: Date;
  updatedAt: Date;
}

enum AlbumType {
  ALBUM = 'album',
  SINGLE = 'single',
  EP = 'ep',
  COMPILATION = 'compilation',
  REMIX = 'remix'
}
```

## Service Layer Architecture

### 1. DatabaseService.ts

**Implementation Details:**
- Uses a singleton pattern for database connection management
- Implements caching with a 5-minute TTL for frequently accessed data
- Handles all CRUD operations for tracks, artists, and albums

**Key Methods:**
```typescript
class DatabaseService {
  // Cache initialization
  private trackCache: Cache<Track | PaginatedResponse<Track>>;
  private artistCache: Cache<Artist | PaginatedResponse<Artist>>;
  private albumCache: Cache<Album | PaginatedResponse<Album>>;

  // Authentication
  async adminLogin(username: string, password: string): Promise<{ token: string }>;

  // Track Operations
  async getTracks(options?: QueryOptions): Promise<PaginatedResponse<Track>>;
  async getTracksByLabel(labelId: RecordLabelId): Promise<PaginatedResponse<Track>>;
  async createTrack(track: Partial<Track>): Promise<Track>;
  
  // Artist Operations
  async getArtists(options?: QueryOptions): Promise<PaginatedResponse<Artist>>;
  async getArtistTracks(artistId: string): Promise<Track[]>;
  
  // Album Operations
  async getAlbums(options?: QueryOptions): Promise<PaginatedResponse<Album>>;
  async getAlbumPopularityHistory(albumId: string): Promise<PopularityHistory[]>;
}
```

### 2. SpotifyApiClient.ts

**Implementation Details:**
- Handles OAuth 2.0 client credentials flow
- Implements automatic token refresh
- Provides type-safe wrappers around Spotify Web API endpoints

**Key Methods:**
```typescript
class SpotifyApiClient {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  // Authentication
  public async authorize(token?: string): Promise<void>;
  private async refreshAccessToken(): Promise<void>;
  
  // API Operations
  async search(query: string, types: string[]): Promise<SpotifySearchResponse>;
  async getTrack(id: string): Promise<SpotifyTrack | null>;
  async getArtistTopTracks(artistId: string, market = 'US'): Promise<SpotifyTrack[]>;
}
```

### 3. SpotifyService.ts

**Implementation Details:**
- Coordinates data flow between SpotifyApiClient and DatabaseService
- Handles data transformation using spotifyUtils
- Implements intelligent caching and data refresh strategies

**Key Methods:**
```typescript
class SpotifyService {
  // Search and Retrieval
  async searchTracks(query: string): Promise<Track[]>;
  async getTracksByLabel(labelId: RecordLabelId): Promise<Track[]>;
  
  // Import Process
  async importTracks(labelId: RecordLabelId, token?: string): Promise<{
    success: boolean;
    message?: string;
    tracksImported?: number;
  }>;
}
```

### 4. Utility Services

#### spotifyUtils.ts
Handles data transformation between Spotify API and our database models:
```typescript
// Transform functions
export const transformSpotifyTrack = (spotifyTrack: SpotifyTrack): Track;
export const transformSpotifyArtist = (spotifyArtist: SpotifyArtist): Artist;
export const transformSpotifyAlbum = (spotifyAlbum: SpotifyAlbum): Album;
```

#### trackUtils.ts
Provides utility functions for track management:
```typescript
export const getTrackDuration = (track: Track): string;
export const getTrackImage = (track: Track): string;
export const getTrackSpotifyUrl = (track: Track): string;
```

## Supporting Folders Structure

### Types Folder (`/src/types`)

**Purpose:**
- Defines core TypeScript interfaces and types
- Ensures type safety across the application
- Provides centralized type definitions for the entire codebase

**Key Files:**

1. `spotify.ts` - Spotify API Types
```typescript
// Raw Spotify API response types
export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  uri: string;
  href: string;
  external_urls: SpotifyExternalUrls;
  external_ids: SpotifyExternalIds;
  preview_url?: string;
  popularity?: number;
  artists: SpotifyArtist[];
  album?: SpotifyAlbum;
}

export interface SpotifySearchResponse {
  tracks?: SpotifyPaging<SpotifyTrack>;
  artists?: SpotifyPaging<SpotifyArtist>;
  albums?: SpotifyPaging<SpotifyAlbum>;
}
```

2. `common.ts` - Shared Types and Enums
```typescript
export enum TrackStatus {
  PENDING = 'pending',
  DRAFT = 'draft',
  PUBLISHED = 'published'
}

export enum ReleaseType {
  SINGLE = 'single',
  EP = 'ep',
  ALBUM = 'album'
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
```

3. `label.ts` - Record Label Types
```typescript
export enum RecordLabelId {
  BUILD_IT = 'build-it-records',
  SUB_LABEL = 'sub-label'
}

export interface Label {
  id: RecordLabelId;
  name: string;
  variations: string[];  // Different ways the label might appear
  website?: string;
  founded?: string;
}
```

### Utils Folder (`/src/utils`)

**Purpose:**
- Houses utility functions and helpers
- Provides shared functionality across components
- Implements common data transformation logic

**Key Files:**

1. `spotifyUtils.ts` - Spotify Data Transformations
```typescript
export const transformSpotifyTrack = (spotifyTrack: SpotifyTrack): Track => ({
  id: spotifyTrack.id,
  name: spotifyTrack.name,
  type: TrackType.TRACK,
  status: TrackStatus.PENDING,
  duration_ms: spotifyTrack.duration_ms,
  uri: spotifyTrack.uri,
  // ... other transformations
});

export const getLabelFromName = (labelName: string): RecordLabelId | undefined => {
  const normalizedName = labelName.toLowerCase();
  return Object.entries(RECORD_LABELS).find(([_, label]) =>
    label.variations.some(v => normalizedName.includes(v.toLowerCase()))
  )?.[0] as RecordLabelId | undefined;
};
```

2. `dateUtils.ts` - Date Formatting and Manipulation
```typescript
export const formatReleaseDate = (date: string, precision: string): string => {
  switch (precision) {
    case 'day':
      return new Date(date).toLocaleDateString();
    case 'month':
      return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    default:
      return date;
  }
};

export const isValidReleaseDate = (date: string): boolean => {
  const releaseDate = new Date(date);
  const now = new Date();
  return releaseDate <= now;
};
```

3. `logger.ts` - Centralized Logging
```typescript
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  error: (message: string, error?: Error, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, error?.message || '', ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  }
};
```

4. `validation.ts` - Data Validation
```typescript
export const validateTrack = (track: Partial<Track>): ValidationResult => {
  const errors: string[] = [];
  
  if (!track.name?.trim()) {
    errors.push('Track name is required');
  }
  
  if (!track.artists?.length) {
    errors.push('Track must have at least one artist');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSpotifyUri = (uri: string): boolean => {
  return /^spotify:track:[a-zA-Z0-9]{22}$/.test(uri);
};
```

### Usage Examples

1. **Type Safety in Components**
```typescript
// In TrackList.tsx
interface TrackListProps {
  tracks: PaginatedResponse<Track>;  // Using PaginatedResponse type
  onTrackSelect: (track: Track) => void;
}

const TrackList: React.FC<TrackListProps> = ({ tracks, onTrackSelect }) => {
  // Type-safe access to track properties
  return (
    <div>
      {tracks.items.map(track => (
        <TrackItem
          key={track.id}
          name={track.name}
          artists={track.artists}
          duration={track.duration_ms}
        />
      ))}
    </div>
  );
};
```

2. **Utility Functions in Services**
```typescript
// In SpotifyService.ts
async importTrack(spotifyTrack: SpotifyTrack): Promise<Track> {
  // Using utility functions for data transformation
  const track = transformSpotifyTrack(spotifyTrack);
  
  // Validate track data
  const validation = validateTrack(track);
  if (!validation.isValid) {
    logger.error('Invalid track data:', { errors: validation.errors });
    throw new Error('Invalid track data');
  }
  
  // Format dates
  if (track.release_date) {
    track.formatted_date = formatReleaseDate(
      track.release_date,
      track.release_date_precision
    );
  }
  
  return track;
}
```

### Best Practices

1. **Type Organization**
   - Keep related types in the same file
   - Use barrel exports (index.ts) for clean imports
   - Document complex types with JSDoc comments

2. **Utility Function Design**
   - Keep functions pure when possible
   - Implement proper error handling
   - Add TypeScript generics for reusability

3. **Code Maintainability**
   - Use meaningful variable and function names
   - Add JSDoc comments for complex logic
   - Implement proper error handling and logging

## React Components

### Admin Components

#### ImportTracks.tsx
```typescript
interface ImportTracksProps {
  onImportComplete?: () => void;
}

const ImportTracks: React.FC<ImportTracksProps> = ({ onImportComplete }) => {
  // Handles track import process
  const handleImport = async (labelId: RecordLabelId) => {
    await spotifyService.importTracks(labelId);
  };
};
```

#### TrackManager.tsx
```typescript
interface TrackManagerProps {
  tracks: PaginatedResponse<Track>;
  releases: Release[];
  loading: boolean;
  onRefresh?: () => void;
  onEdit?: (track: Track) => void;
  onDelete?: (trackId: string) => void;
}
```

## Data Flow Examples

### 1. Track Import Process
```typescript
// In ImportTracks.tsx
const handleImport = async () => {
  // 1. Call SpotifyService
  const result = await spotifyService.importTracks(labelId);
  
  // 2. SpotifyService calls SpotifyApiClient
  const tracks = await spotifyApi.search(`label:"${labelId}"`, ['track']);
  
  // 3. Transform data
  const transformedTracks = tracks.map(transformSpotifyTrack);
  
  // 4. Save to database
  await Promise.all(transformedTracks.map(track => 
    databaseService.createTrack(track)
  ));
};
```

### 2. Track Retrieval Process
```typescript
// In TrackManager.tsx
const loadTracks = async () => {
  // 1. Check database first
  const dbTracks = await databaseService.getTracksByLabel(labelId);
  
  if (dbTracks.items.length > 0) {
    return dbTracks;
  }
  
  // 2. If not in database, fetch from Spotify
  const spotifyTracks = await spotifyService.getTracksByLabel(labelId);
  return spotifyTracks;
};
```

## Current System State (as of Jan 19, 2025)

- Total Tracks: 352
- Total Artists: 164
- Label Coverage: Complete for Build It Records
- Notable Artists:
  * John Okins (5 tracks, 2 releases)
  * Other major artists...

## Deployment Architecture

### Database
- PostgreSQL 14
- Connection pooling with pg-pool
- Indexed columns: id, label_id, artist_id
- Materialized views for popular queries

### API Server
- Node.js with Express
- TypeScript for type safety
- JWT authentication
- Rate limiting implemented

### Frontend
- React 18
- Material-UI components
- TypeScript strict mode
- Redux for state management

## Testing Strategy

### Unit Tests
```typescript
describe('SpotifyService', () => {
  it('should transform Spotify track to database format', () => {
    const spotifyTrack = // ... test data
    const result = transformSpotifyTrack(spotifyTrack);
    expect(result).toMatchSnapshot();
  });
});
```

### Integration Tests
```typescript
describe('Track Import Flow', () => {
  it('should import tracks from Spotify to database', async () => {
    const result = await spotifyService.importTracks(labelId);
    expect(result.success).toBe(true);
    expect(result.tracksImported).toBeGreaterThan(0);
  });
});
```

## Future Improvements

1. **Performance Optimizations**
   - Implement GraphQL for more efficient data fetching
   - Add Redis caching layer
   - Implement database query optimization

2. **Feature Enhancements**
   - Add support for playlist management
   - Implement real-time Spotify data sync
   - Add advanced search with filters

3. **Infrastructure**
   - Set up CI/CD pipeline
   - Implement automated testing
   - Add monitoring and alerting
