# Build It Records API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All admin endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

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

Response:
```json
{
    "success": true,
    "data": [{
        "id": string,
        "name": string,
        "spotify_id": string
    }]
}
```

### Get Label by ID
```
GET /labels/:labelId
```
Returns details for a specific label.

Response:
```json
{
    "success": true,
    "data": {
        "id": string,
        "name": string,
        "spotify_id": string
    }
}
```

## Track Endpoints

### Get Tracks by Label
```
GET /tracks?label=:labelId&sort=:sortField
```
Returns tracks for a specific label, optionally sorted.

Query Parameters:
- `label`: Label ID (required)
- `sort`: Sort field (optional, e.g., 'created_at')

Response:
```json
{
    "success": true,
    "tracks": [{
        "id": string,
        "name": string,
        "artists": [{
            "id": string,
            "name": string
        }],
        "release": {
            "id": string,
            "name": string,
            "artwork_url": string,
            "release_date": string,
            "spotify_uri": string,
            "spotify_url": string,
            "total_tracks": number,
            "label_id": string
        },
        "duration": number,
        "preview_url": string,
        "spotify_uri": string,
        "spotify_url": string,
        "label_id": string,
        "created_at": string,
        "updated_at": string
    }],
    "count": number
}
```

### Get Track by ID
```
GET /tracks/:trackId
```
Returns details for a specific track.

Response:
```json
{
    "success": true,
    "data": {
        "id": string,
        "name": string,
        "artists": [{
            "id": string,
            "name": string,
            "images": object[]
        }],
        "release": {
            "id": string,
            "name": string,
            "images": object[]
        },
        "duration_ms": number,
        "preview_url": string,
        "spotify_id": string,
        "label_id": string,
        "createdAt": string,
        "updatedAt": string
    }
}
```

## Release Endpoints

### Get Releases by Label
```
GET /releases?label=:labelId&offset=:offset&limit=:limit
```
Returns releases for a specific label with pagination.

Query Parameters:
- `label`: Label ID (required)
- `offset`: Starting index (optional, default: 0)
- `limit`: Number of items per page (optional, default: 10, max: 50)

Response:
```json
{
    "success": true,
    "releases": [{
        "id": string,
        "name": string,
        "title": string,
        "release_date": string,
        "artwork_url": string,
        "spotify_uri": string,
        "spotify_url": string,
        "total_tracks": number,
        "label_id": string,
        "artists": [{
            "id": string,
            "name": string
        }],
        "tracks": [{
            "id": string,
            "name": string
        }],
        "created_at": string,
        "updated_at": string
    }],
    "total": number,
    "offset": number,
    "limit": number
}
```

### Get Release by ID
```
GET /releases/:releaseId
```
Returns details for a specific release.

Response:
```json
{
    "success": true,
    "data": {
        "id": string,
        "name": string,
        "artists": [{
            "id": string,
            "name": string
        }],
        "tracks": [{
            "id": string,
            "name": string
        }],
        "images": object[],
        "release_date": string,
        "spotify_id": string,
        "label_id": string,
        "createdAt": string,
        "updatedAt": string
    }
}
```

## Error Responses
All errors follow this format:
```json
{
    "success": false,
    "message": string,
    "error": string
}
```

Common HTTP status codes:
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (invalid or missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error
