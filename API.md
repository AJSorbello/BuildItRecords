# Music Metadata API Documentation

## Base URL
```
http://localhost:3001/api
```

## Rate Limiting
- 100 requests per 15 minutes per IP address
- Cached responses for 1 hour

## Authentication
All endpoints require Spotify API credentials configured in the server's environment variables.

## Common Parameters
- `fields`: Comma-separated list of fields to include in the response
- `limit`: Number of items per page (default: 20, max: 50)
- `offset`: Pagination offset (default: 0)

## Track Endpoints

### Search Tracks
```
GET /tracks/search
```
Query Parameters:
- `q`: Search query (required)
- `limit`: Number of results (1-50)
- `offset`: Pagination offset

### Get Track
```
GET /tracks/:trackId
```
Query Parameters:
- `fields`: Filter fields (e.g., "name,artists,duration_ms")

### Get Multiple Tracks
```
POST /tracks/batch
```
Body Parameters:
- `trackIds`: Array of track IDs (max 50)
- `fields`: Filter fields

### Get Track Recommendations
```
GET /tracks/recommendations
```
Query Parameters:
- `seed_tracks`: Comma-separated track IDs
- `limit`: Number of recommendations (1-100)

## Artist Endpoints

### Get Artist
```
GET /artists/:artistId
```
Query Parameters:
- `fields`: Filter fields

### Get Artist's Top Tracks
```
GET /artists/:artistId/top-tracks
```
Query Parameters:
- `market`: Market code (default: "US")

### Get Artist's Albums
```
GET /artists/:artistId/albums
```
Query Parameters:
- `include_groups`: Album types (album,single,compilation)
- `limit`: Number of albums
- `offset`: Pagination offset

### Get Related Artists
```
GET /artists/:artistId/related
```

## Album Endpoints

### Get Album
```
GET /albums/:albumId
```
Query Parameters:
- `fields`: Filter fields

### Get Album Tracks
```
GET /albums/:albumId/tracks
```
Query Parameters:
- `limit`: Number of tracks
- `offset`: Pagination offset

### Get New Releases
```
GET /albums/new-releases
```
Query Parameters:
- `limit`: Number of albums
- `offset`: Pagination offset

## Response Formats

### Track Object
```json
{
    "artists": [{ "name": string }],
    "name": string,
    "album": {
        "name": string,
        "label": string
    },
    "duration_ms": number,
    "popularity": number,
    "preview_url": string
}
```

### Artist Object
```json
{
    "id": string,
    "name": string,
    "genres": string[],
    "popularity": number,
    "followers": number,
    "images": object[],
    "external_urls": object
}
```

### Album Object
```json
{
    "id": string,
    "name": string,
    "type": string,
    "release_date": string,
    "total_tracks": number,
    "artists": [{
        "id": string,
        "name": string
    }],
    "images": object[],
    "external_urls": object,
    "copyrights": object[],
    "label": string
}
```

## Error Responses
All errors follow this format:
```json
{
    "error": string,
    "message": string
}
```

Common HTTP status codes:
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (invalid credentials)
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error
