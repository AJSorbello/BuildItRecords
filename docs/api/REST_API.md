# REST API Documentation

## Authentication

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

### Refresh Token
```http
POST /api/v1/auth/refresh
Authorization: Bearer {token}
```

## Tracks

### Get Tracks
```http
GET /api/v1/tracks
Query:
  - limit: number
  - offset: number
  - label: string
```

### Create Track
```http
POST /api/v1/tracks
Content-Type: application/json

{
  "name": "string",
  "artists": string[],
  "label": string
}
```

## Artists

### Get Artists
```http
GET /api/v1/artists
Query:
  - limit: number
  - offset: number
```

### Get Artist
```http
GET /api/v1/artists/{id}
```

## Error Responses

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Server Error
