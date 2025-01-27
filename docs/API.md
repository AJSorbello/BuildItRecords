# Build It Records API Documentation

## Overview

The Build It Records API provides endpoints for managing music tracks, albums, artists, and labels. It includes features for searching, importing, and managing music data from Spotify.

## Authentication

All API endpoints require authentication. The API uses token-based authentication with rate limiting to prevent abuse.

```typescript
Authorization: Bearer <your_token>
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **General API**: 100 requests per 15 minutes
- **Search Endpoints**: 10 searches per minute
- **Import Operations**: 5 imports per hour
- **Authentication**: 5 attempts per 15 minutes

When rate limit is exceeded, the API returns a 429 status code with a `Retry-After` header.

## Error Handling

The API uses standard HTTP status codes and returns errors in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional information
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SPOTIFY_API_ERROR`: Error from Spotify API
- `DATABASE_ERROR`: Database operation failed

## Endpoints

### Tracks

#### GET /api/tracks/search
Search for tracks.

**Parameters:**
- `query` (string, required): Search query
- `limit` (number, optional): Results per page (default: 20, max: 50)
- `offset` (number, optional): Pagination offset
- `type` (string, optional): Filter by type (track, album, artist)

**Response:**
```json
{
  "tracks": [
    {
      "id": "string",
      "name": "string",
      "artists": [],
      "album": {},
      "duration_ms": 0
    }
  ],
  "total": 0
}
```

#### GET /api/tracks/:id
Get track by ID.

**Parameters:**
- `id` (string, required): Spotify track ID

#### POST /api/tracks/import/:labelId
Import tracks for a label.

**Parameters:**
- `labelId` (string, required): Label ID
- `options` (object, optional):
  - `includeArtists` (boolean)
  - `includeAlbums` (boolean)
  - `startDate` (string)
  - `endDate` (string)

### Labels

#### GET /api/labels
Get all labels.

#### GET /api/labels/:id
Get label by ID.

#### POST /api/labels
Create a new label.

**Body:**
```json
{
  "name": "string",
  "description": "string",
  "website": "string",
  "social_media": {
    "facebook": "string",
    "twitter": "string",
    "instagram": "string"
  }
}
```

## Data Models

### Track
```typescript
interface Track {
  id: string;
  name: string;
  duration_ms: number;
  artists: Artist[];
  album?: Album;
  track_number: number;
  disc_number: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}
```

### Album
```typescript
interface Album {
  id: string;
  name: string;
  album_type: 'album' | 'single' | 'compilation';
  total_tracks: number;
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  artists: Artist[];
  images: Image[];
}
```

### Artist
```typescript
interface Artist {
  id: string;
  name: string;
  genres?: string[];
  images?: Image[];
  external_urls: {
    spotify: string;
  };
}
```

## Middleware

### Validation
All requests are validated using Zod schemas. Invalid requests receive a 400 response with detailed error messages.

### Rate Limiting
Rate limiting is implemented using Redis for distributed rate limiting across multiple server instances.

### Logging
All requests are logged with unique request IDs for tracing. Logs include:
- Request details (method, URL, body)
- Response status and timing
- Error details when applicable

## Best Practices

1. **Pagination**
   - Always use pagination for list endpoints
   - Default limit is 20 items
   - Maximum limit is 50 items

2. **Error Handling**
   - Check response status codes
   - Handle rate limiting (429) with exponential backoff
   - Log error details for debugging

3. **Caching**
   - Use ETags for caching when available
   - Cache responses according to Cache-Control headers
   - Implement local caching for frequently accessed data

4. **Performance**
   - Minimize request payload size
   - Use compression for large responses
   - Batch operations when possible

## Development Guidelines

1. **Testing**
   - Write tests for all new endpoints
   - Use mock data for external dependencies
   - Test error scenarios and edge cases

2. **Security**
   - Always validate input data
   - Use HTTPS for all requests
   - Implement proper authentication
   - Sanitize user input

3. **Monitoring**
   - Monitor rate limit usage
   - Track response times
   - Set up alerts for errors
   - Use request IDs for tracing

## Examples

### Search Tracks
```typescript
const response = await fetch('/api/tracks/search?query=test&limit=10');
const data = await response.json();
```

### Import Tracks
```typescript
const response = await fetch('/api/tracks/import/label123', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    options: {
      includeArtists: true,
      startDate: '2025-01-01'
    }
  })
});
```
