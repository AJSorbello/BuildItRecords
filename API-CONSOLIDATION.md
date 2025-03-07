# BuildItRecords API Consolidation

## Overview
This document describes the API consolidation strategy implemented to work within Vercel's 12 serverless function limit while maintaining all existing functionality.

## Problem
Vercel's free tier limits deployments to 12 serverless functions. Our original API structure used a separate function for each endpoint, resulting in more than 15 functions, which exceeded this limit.

## Solution
We consolidated multiple related endpoints into single serverless functions that handle different operations based on the request path. This approach significantly reduces the number of serverless functions while maintaining the same functionality.

## Consolidated API Structure

### Consolidated Endpoints

1. **Health & Diagnostic Endpoint** (`/api/health.js`)
   - `/api/health` - Basic health check
   - `/api/health?diagnostic=true` or `/api/health/diagnostic` - Detailed diagnostic information

2. **Artist Endpoint** (`/api/artist.js`)
   - `/api/artist` - List all artists
   - `/api/artist?label=id` - List artists by label
   - `/api/artist/[id]` - Get artist by ID
   - `/api/artist/[id]/releases` - Get releases for an artist

3. **Release Endpoint** (`/api/release.js`)
   - `/api/release` - List all releases
   - `/api/release?label=id` - List releases by label
   - `/api/release/[id]` - Get release by ID
   - `/api/release/[id]/tracks` - Get tracks for a release

4. **Track Endpoint** (`/api/track.js`)
   - `/api/track` - List all tracks
   - `/api/track?label=id` - List tracks by label
   - `/api/track/[id]` - Get track by ID

5. **Label Endpoint** (`/api/label.js`)
   - `/api/label` - List all labels
   - `/api/label/[id]` - Get label by ID

## Implementation Details

### Path-Based Routing
Each consolidated endpoint uses URL path analysis to determine the requested operation. For example, in the artist endpoint:

```javascript
// Parse the URL to determine which endpoint was requested
const url = new URL(req.url, `http://${req.headers.host}`);
const pathSegments = url.pathname.split('/').filter(Boolean);

// GET /api/artist - List all artists
if (pathSegments.length === 1) {
  // Check if there's a label query parameter
  const labelId = url.searchParams.get('label');
  
  if (labelId) {
    return await getArtistsByLabelHandler(labelId, req, res);
  } else {
    return await getAllArtistsHandler(req, res);
  }
}
// GET /api/artist/[id] - Get artist by ID
else if (pathSegments.length === 2) {
  const artistId = pathSegments[1];
  return await getArtistByIdHandler(artistId, req, res);
}
```

### Vercel Configuration
The `vercel.json` configuration has been updated to route requests to the appropriate consolidated endpoint:

```json
{
  "src": "/api/artist/([^/]+)/releases",
  "dest": "/api/artist.js"
},
{
  "src": "/api/artist/([^/]+)",
  "dest": "/api/artist.js"
},
{
  "src": "/api/artist",
  "dest": "/api/artist.js"
}
```

### Robust Error Handling
Each endpoint includes comprehensive error handling to maintain the same error response structure and ensure API reliability.

## Benefits

1. **Reduced Function Count**: From 15+ serverless functions to just 5 consolidated functions
2. **Consistent API Responses**: All endpoints maintain the same response format
3. **Improved Maintainability**: Related functionality is grouped together
4. **Enhanced Error Handling**: Consolidated error handling strategies across endpoints
5. **Vercel Deployment Compatibility**: Now works within Vercel's 12 serverless function limit

## Testing

A comprehensive test script (`test-consolidated-api.js`) has been created to validate that all consolidated endpoints function correctly.

Run the test with:
```
node test-consolidated-api.js
```

## Going Forward

When adding new API functionality:
- Add it to the appropriate consolidated endpoint based on the resource it deals with
- Follow the established pattern of path-based routing within each endpoint
- Maintain consistent error handling and response formats
- Test thoroughly to ensure it works with both direct database connections and Supabase
