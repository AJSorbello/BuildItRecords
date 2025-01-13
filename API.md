# Build It Records API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All admin endpoints require authentication via JWT token.

## Health Check
```
GET /health
```
Returns server status and timestamp.

## Label Endpoints

### Get All Labels
```
GET /labels
```
Returns a list of all record labels.

### Get Label by ID
```
GET /labels/:labelId
```
Returns details for a specific label.

### Get Label's Tracks
```
GET /labels/:labelId/tracks
```
Returns all tracks associated with a label.

### Import Label's Tracks
```
POST /labels/:labelId/import
```
Imports tracks from Spotify for a specific label.

## Track Endpoints

### Get All Tracks
```
GET /tracks
```
Returns a list of all tracks.

### Get Track by ID
```
GET /tracks/:trackId
```
Returns details for a specific track.

### Search Tracks
```
GET /tracks/search
```
Query Parameters:
- `q`: Search query (required)
- `labelId`: Filter by label ID

### Update Track
```
PUT /tracks/:trackId
```
Update track information.

### Delete Track
```
DELETE /tracks/:trackId
```
Delete a track (requires authentication).

## Artist Endpoints

### Get All Artists
```
GET /artists
```
Returns a list of all artists.

### Get Artist by ID
```
GET /artists/:artistId
```
Returns details for a specific artist.

### Get Artist's Tracks
```
GET /artists/:artistId/tracks
```
Returns all tracks by an artist.

## Release Endpoints

### Get All Releases
```
GET /releases
```
Returns a list of all releases.

### Get Release by ID
```
GET /releases/:releaseId
```
Returns details for a specific release.

### Get Release's Tracks
```
GET /releases/:releaseId/tracks
```
Returns all tracks in a release.

## Response Objects

### Track Object
```json
{
    "id": string,
    "name": string,
    "artists": [{
        "id": string,
        "name": string,
        "images": object[]
    }],
    "album": {
        "name": string,
        "images": object[]
    },
    "duration_ms": number,
    "preview_url": string,
    "spotify_id": string,
    "label_id": string
}
```

### Artist Object
```json
{
    "id": string,
    "name": string,
    "images": object[],
    "spotify_id": string
}
```

### Release Object
```json
{
    "id": string,
    "name": string,
    "artists": [{
        "id": string,
        "name": string
    }],
    "images": object[],
    "release_date": string,
    "spotify_id": string,
    "label_id": string
}
```

### Label Object
```json
{
    "id": string,
    "name": string,
    "spotify_id": string
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
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error
