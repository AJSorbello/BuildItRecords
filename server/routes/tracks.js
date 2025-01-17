/**
 * @fileoverview Track management routes
 * @module routes/tracks
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, query, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { validateRequest, isValidSpotifyId } = require('../utils/validation');
const { Track, Artist, Release, Label, ImportLog, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * @swagger
 * components:
 *   parameters:
 *     idParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: Track ID
 *     limitParam:
 *       in: query
 *       name: limit
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 50
 *       description: Number of tracks to return
 *     offsetParam:
 *       in: query
 *       name: offset
 *       schema:
 *         type: integer
 *         minimum: 0
 *       description: Offset for pagination
 *   schemas:
 *     Track:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Track ID
 *         name:
 *           type: string
 *           description: Track name
 *         artists:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Artist'
 *           description: Track artists
 *         album:
 *           type: object
 *           $ref: '#/components/schemas/Album'
 *           description: Track album
 *         duration_ms:
 *           type: integer
 *           description: Track duration in milliseconds
 *         popularity:
 *           type: integer
 *           description: Track popularity
 *         preview_url:
 *           type: string
 *           description: Track preview URL
 *         external_urls:
 *           type: object
 *           description: Track external URLs
 *         cached_at:
 *           type: integer
 *           description: Timestamp when track data was cached
 *     Artist:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Artist ID
 *         name:
 *           type: string
 *           description: Artist name
 *     Album:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Album ID
 *         name:
 *           type: string
 *           description: Album name
 *         label:
 *           type: string
 *           description: Album label
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Image'
 *           description: Album images
 *     Image:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           description: Image URL
 *         width:
 *           type: integer
 *           description: Image width
 *         height:
 *           type: integer
 *           description: Image height
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Track'
 *           description: Paginated list of tracks
 *         total:
 *           type: integer
 *           description: Total number of tracks
 *         offset:
 *           type: integer
 *           description: Offset for pagination
 *         limit:
 *           type: integer
 *           description: Number of tracks to return
 *         hasMore:
 *           type: boolean
 *           description: Whether there are more tracks available
 *   responses:
 *     ValidationError:
 *       description: Validation error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Error message
 *               error:
 *                 type: string
 *                 description: Error details
 *     NotFoundError:
 *       description: Not found error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Error message
 *               error:
 *                 type: string
 *                 description: Error details
 *     UnauthorizedError:
 *       description: Unauthorized error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Error message
 *               error:
 *                 type: string
 *                 description: Error details
 *     Error:
 *       description: Generic error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Error message
 *               error:
 *                 type: string
 *                 description: Error details
 */

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
router.use(limiter);

// Helper function to format track data
const formatTrackData = (spotifyData) => ({
    id: spotifyData.id,
    artists: spotifyData.artists.map(artist => ({
        id: artist.id,
        name: artist.name
    })),
    name: spotifyData.name,
    album: {
        id: spotifyData.album.id,
        name: spotifyData.album.name,
        label: spotifyData.album.label || 'Unknown Label',
        images: spotifyData.album.images
    },
    duration_ms: spotifyData.duration_ms,
    popularity: spotifyData.popularity,
    preview_url: spotifyData.preview_url,
    external_urls: spotifyData.external_urls,
    cached_at: Date.now()
});

// Helper function to get Spotify access token
async function getSpotifyToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        logger.error('Missing Spotify credentials:', { 
            hasClientId: !!clientId, 
            hasClientSecret: !!clientSecret 
        });
        throw new Error('Spotify credentials not configured');
    }

    try {
        logger.info('Getting Spotify token...');
        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await makeSpotifyRequest('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: 'grant_type=client_credentials'
        });
        logger.info('Got Spotify token successfully');
        return response.data.access_token;
    } catch (error) {
        logger.error('Error getting Spotify token:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            config: error.config
        });
        throw error;
    }
}

// Helper function to make a request with retries
async function makeSpotifyRequest(url, options, maxRetries = 3) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            logger.info(`Attempt ${attempt} for ${url}`);
            const response = await axios(url, options);
            return response;
        } catch (error) {
            lastError = error;
            if (error.response?.status === 503) {
                const delay = Math.min(1000 * attempt, 3000); // Exponential backoff, max 3 seconds
                logger.info(`Service unavailable, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            if (error.response?.status === 429) {
                const retryAfter = error.response.headers['retry-after'] || 1;
                const delay = retryAfter * 1000;
                logger.info(`Rate limited, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

// Helper function to fetch track from Spotify
async function fetchTrackFromSpotify(trackId, accessToken) {
    const response = await makeSpotifyRequest(`https://api.spotify.com/v1/tracks/${trackId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return response.data;
}

// Helper function to handle track caching
async function getTrackWithCache(trackId, redisService) {
    try {
        // Try to get from cache first
        const cachedTrack = await redisService.getTrackJson(trackId);
        
        if (cachedTrack) {
            const cacheAge = Date.now() - cachedTrack.cached_at;
            if (cacheAge < 60 * 60 * 1000) {
                return { track: cachedTrack, source: 'cache' };
            }
        }

        // If not in cache or cache is stale, fetch from Spotify
        const accessToken = await getSpotifyToken();
        const spotifyTrack = await fetchTrackFromSpotify(trackId, accessToken);
        const formattedTrack = formatTrackData(spotifyTrack);

        // Cache the track
        await redisService.setTrackJson(trackId, formattedTrack);

        return { track: formattedTrack, source: 'spotify' };
    } catch (error) {
        // If Spotify fetch fails but we have cached data, return it
        if (error.response?.status === 404 && cachedTrack) {
            return { track: cachedTrack, source: 'cache-fallback' };
        }
        throw error;
    }
}

/**
 * @swagger
 * /tracks:
 *   get:
 *     summary: Get all tracks
 *     description: Retrieve a paginated list of tracks
 *     tags: [Tracks]
 *     parameters:
 *       - $ref: '#/components/parameters/limitParam'
 *       - $ref: '#/components/parameters/offsetParam'
 *       - name: search
 *         in: query
 *         description: Search term for track name
 *         schema:
 *           type: string
 *       - name: artist
 *         in: query
 *         description: Filter by artist ID
 *         schema:
 *           type: string
 *       - name: album
 *         in: query
 *         description: Filter by album ID
 *         schema:
 *           type: string
 *       - name: label
 *         in: query
 *         description: Filter by label ID
 *         schema:
 *           type: string
 *       - name: sort
 *         in: query
 *         description: Sort tracks by field
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A paginated list of tracks
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Track'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/', async (req, res) => {
  const requestStart = Date.now();
  logger.info('Starting GET /tracks request');
  
  // Set a timeout for the response
  res.setTimeout(10000, () => {
    logger.error('Request timeout after 10 seconds');
    res.status(503).json({ error: 'Request timed out' });
  });

  try {
    const { label, sort = 'created_at' } = req.query;
    logger.info(`[${Date.now() - requestStart}ms] Query params:`, { label, sort });

    // First check if label exists
    if (label) {
      logger.info(`[${Date.now() - requestStart}ms] Checking label existence`);
      const labelExists = await Label.findByPk(label);
      if (!labelExists) {
        logger.info(`Label ${label} not found`);
        return res.status(404).json({ error: 'Label not found' });
      }
    }

    // Simple query without associations first
    logger.info(`[${Date.now() - requestStart}ms] Starting basic track query`);
    const basicQuery = {
      where: label ? { label_id: label } : {},
      order: [['created_at', 'DESC']],
      limit: 50, // Add pagination to prevent large result sets
      raw: true // Get raw data for faster query
    };

    const { count } = await Track.findAndCountAll(basicQuery);
    logger.info(`[${Date.now() - requestStart}ms] Found ${count} tracks`);

    if (count === 0) {
      logger.info('No tracks found, returning empty result');
      return res.json({ tracks: [], total: 0 });
    }

    // Now get tracks with associations
    logger.info(`[${Date.now() - requestStart}ms] Fetching tracks with associations`);
    const tracksWithAssociations = await Track.findAll({
      where: basicQuery.where,
      order: basicQuery.order,
      limit: basicQuery.limit,
      include: [
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] },
          required: false
        },
        {
          model: Release,
          as: 'release',
          required: false
        },
        {
          model: Label,
          as: 'label',
          required: false
        }
      ],
      nest: true // Nest the associated models for cleaner output
    });

    logger.info(`[${Date.now() - requestStart}ms] Successfully fetched tracks with associations`);
    
    // Send response
    const response = {
      tracks: tracksWithAssociations,
      total: count,
      queryTime: Date.now() - requestStart
    };
    
    logger.info(`[${Date.now() - requestStart}ms] Sending response`);
    res.json(response);

  } catch (error) {
    const errorTime = Date.now() - requestStart;
    logger.error(`[${errorTime}ms] Error fetching tracks:`, {
      message: error.message,
      stack: error.stack,
      sql: error.sql,
      queryTime: errorTime
    });
    res.status(500).json({ 
      error: 'Failed to fetch tracks', 
      details: error.message,
      queryTime: errorTime
    });
  }
});

/**
 * @swagger
 * /tracks/search:
 *   get:
 *     summary: Search tracks
 *     description: Retrieve a list of tracks matching the search query
 *     tags: [Tracks]
 *     parameters:
 *       - name: query
 *         in: query
 *         description: Search query
 *         schema:
 *           type: string
 *         required: true
 *       - name: labelId
 *         in: query
 *         description: Filter by label ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of tracks matching the search query
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Track'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/search', [
  query('query').isString().notEmpty(),
  query('labelId').optional().isString(),
  validateRequest
], async (req, res) => {
  try {
    const { query: searchQuery, labelId } = req.query;

    const where = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${searchQuery}%` } },
        { '$artists.name$': { [Op.iLike]: `%${searchQuery}%` } },
        { '$release.title$': { [Op.iLike]: `%${searchQuery}%` } }
      ]
    };

    if (labelId) {
      where.label_id = labelId;
    }

    const tracks = await Track.findAll({
      where,
      include: [
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] }
        },
        {
          model: Release,
          as: 'release'
        },
        {
          model: Label,
          as: 'label'
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(tracks);
  } catch (error) {
    logger.error('Error searching tracks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching tracks',
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /tracks/import:
 *   post:
 *     summary: Import tracks from Spotify
 *     description: Import tracks from a Spotify playlist
 *     tags: [Tracks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               labelId:
 *                 type: string
 *                 description: Label ID
 *     responses:
 *       201:
 *         description: Tracks imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Track'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post('/import', async (req, res) => {
  try {
    const { labelId } = req.body;
    if (!labelId) {
      return res.status(400).json({ success: false, message: 'Label ID is required' });
    }

    // Get label name from config
    const labelConfig = LABEL_CONFIGS[labelId];
    if (!labelConfig) {
      return res.status(400).json({ success: false, message: 'Invalid label ID' });
    }

    try {
      // Initialize Spotify service and ensure valid token
      await spotifyService.ensureValidToken();

      // Search for albums by label
      const albums = await spotifyService.searchAlbumsByLabel(labelConfig.spotifyLabel);
      
      // Import the releases
      await spotifyService.importReleases({ id: labelId, name: labelConfig.spotifyLabel }, albums);

      res.json({ success: true, message: 'Import started successfully' });
    } catch (error) {
      if (error.statusCode === 401) {
        // Try one more time with a fresh token
        await spotifyService.ensureValidToken();
        const albums = await spotifyService.searchAlbumsByLabel(labelConfig.spotifyLabel);
        await spotifyService.importReleases({ id: labelId, name: labelConfig.spotifyLabel }, albums);
        res.json({ success: true, message: 'Import started successfully (after token refresh)' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error importing tracks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error importing tracks', 
      error: error.message || 'Unknown error' 
    });
  }
});

// Helper function to import tracks from Spotify
async function importTracksFromSpotify(token, spotifyPlaylistId) {
  const response = await makeSpotifyRequest(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const tracks = response.data.items.map(item => item.track);
  return tracks;
}

// Helper function to save track to database
async function saveTrackToDatabase(track, labelId) {
  const existingTrack = await Track.findByPk(track.id);
  if (existingTrack) {
    await existingTrack.update({
      name: track.name,
      artists: track.artists,
      album: track.album,
      albumCover: track.albumCover || track.artwork_url,
      releaseDate: track.releaseDate || track.release_date,
      spotifyUrl: track.spotifyUrl,
      preview_url: track.preview_url,
      label_id: labelId
    });
  } else {
    await Track.create({
      id: track.id,
      name: track.name,
      artists: track.artists,
      album: track.album,
      albumCover: track.albumCover || track.artwork_url,
      releaseDate: track.releaseDate || track.release_date,
      spotifyUrl: track.spotifyUrl,
      preview_url: track.preview_url,
      label_id: labelId
    });
  }

  return track;
}

module.exports = router;
