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
 *         duration:
 *           type: integer
 *           description: Track duration in seconds
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
 *         release_date:
 *           type: string
 *           description: Album release date
 *         artists:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Artist'
 *           description: Album artists
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
const formatTrackData = (data) => {
    if (!data) {
        logger.error('Received null or undefined data in formatTrackData');
        return null;
    }

    if (!data.id) {
        logger.error('Track data missing required id field:', data);
        return null;
    }

    try {
        // Check if this is a database record or Spotify data
        const isSpotifyData = !data.release && data.album;
        
        // Helper to safely map artist data
        const mapArtist = (artist) => {
            if (!artist) return null;
            try {
                // Get the best available image URL
                let imageUrl = null;
                if (artist.image_url) {
                    imageUrl = artist.image_url;
                } else if (artist.images && artist.images.length > 0) {
                    // Sort images by size and get the medium one if available
                    const sortedImages = [...artist.images].sort((a, b) => (b.width || 0) - (a.width || 0));
                    const mediumImage = sortedImages.find(img => (img.width || 0) <= 300) || sortedImages[0];
                    imageUrl = mediumImage.url;
                }

                return {
                    id: artist.id || 'unknown',
                    name: artist.name || 'Unknown Artist',
                    image_url: imageUrl,
                    images: artist.images || [],
                    spotify_url: artist.spotify_url || artist.external_urls?.spotify || null,
                    spotify_uri: artist.spotify_uri || artist.uri || null
                };
            } catch (err) {
                logger.error('Error mapping artist:', err, { artist });
                return null;
            }
        };

        // Helper to safely map artists array
        const mapArtists = (artists) => {
            if (!Array.isArray(artists)) {
                logger.warn('Artists is not an array:', artists);
                return [];
            }
            return artists.filter(artist => artist).map(mapArtist).filter(artist => artist);
        };

        // Helper to safely map release/album data
        const mapRelease = (release) => {
            if (!release) return null;
            try {
                // Get the best available artwork URL
                let artworkUrl = null;
                if (release.artwork_url) {
                    artworkUrl = release.artwork_url;
                } else if (release.images && release.images.length > 0) {
                    // Sort images by size and get the medium one if available
                    const sortedImages = [...release.images].sort((a, b) => (b.width || 0) - (a.width || 0));
                    const mediumImage = sortedImages.find(img => (img.width || 0) <= 300) || sortedImages[0];
                    artworkUrl = mediumImage.url;
                }

                return {
                    id: release.id || null,
                    name: release.name || release.title || 'Unknown Album',
                    artwork_url: artworkUrl,
                    images: release.images || [],
                    release_date: release.release_date || null,
                    spotify_url: release.spotify_url || release.external_urls?.spotify || null,
                    spotify_uri: release.spotify_uri || release.uri || null,
                    artists: mapArtists(release.artists || [])
                };
            } catch (err) {
                logger.error('Error mapping release:', err, { release });
                return null;
            }
        };

        const formattedTrack = {
            id: data.id,
            name: data.name || 'Unknown Track',
            duration: data.duration || 0,
            track_number: data.track_number || 0,
            disc_number: data.disc_number || 1,
            isrc: data.isrc || null,
            preview_url: data.preview_url || null,
            spotify_url: data.spotify_url || data.external_urls?.spotify || null,
            spotify_uri: data.spotify_uri || data.uri || null,
            release: mapRelease(isSpotifyData ? data.album : data.release),
            artists: mapArtists(data.artists || []),
            status: data.status || 'published',
            external_urls: data.external_urls || {},
            type: data.type || 'track',
            explicit: data.explicit || false,
            popularity: data.popularity || 0,
            available_markets: data.available_markets || [],
            is_local: data.is_local || false,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString()
        };

        // Validate the formatted track has required fields
        if (!formattedTrack.id || !formattedTrack.name) {
            logger.error('Formatted track missing required fields:', formattedTrack);
            return null;
        }

        // Log the first artist's image data for debugging
        if (formattedTrack.artists && formattedTrack.artists.length > 0) {
            logger.info('First artist image data:', {
                artistId: formattedTrack.artists[0].id,
                artistName: formattedTrack.artists[0].name,
                imageUrl: formattedTrack.artists[0].image_url,
                hasImages: formattedTrack.artists[0].images?.length > 0
            });
        }

        return formattedTrack;
    } catch (error) {
        logger.error('Error in formatTrackData:', error, { data });
        return null;
    }
};

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
 *       - name: page
 *         in: query
 *         description: Page number for pagination
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         description: Number of tracks to return per page
 *         schema:
 *           type: integer
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
  try {
    const labelId = req.query.label;
    const artistId = req.query.artist;
    const albumId = req.query.album;
    const search = req.query.search;
    const sort = req.query.sort || 'created_at';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Increased limit to show more tracks
    const offset = (page - 1) * limit;

    logger.info('GET /tracks request:', { labelId, artistId, albumId, search, sort, page, limit });

    let where = {};
    let include = [
      {
        model: Artist,
        as: 'artists',
        required: false,
        through: { attributes: [] },
        attributes: [
          'id', 
          'name', 
          'spotify_url', 
          'spotify_uri',
          'image_url',
          'images',
          'label_id'
        ]
      },
      {
        model: Release,
        as: 'release',
        required: false,
        attributes: [
          'id', 
          'name', 
          'title', 
          'release_date', 
          'artwork_url', 
          'images', 
          'spotify_url', 
          'spotify_uri', 
          'status'
        ],
        include: [{
          model: Artist,
          as: 'artists',
          through: { attributes: [] },
          attributes: [
            'id', 
            'name', 
            'spotify_url', 
            'spotify_uri',
            'image_url',
            'images',
            'label_id'
          ]
        }]
      }
    ];
    
    if (labelId) {
      try {
        // Get the actual label ID from the database
        const label = await Label.findOne({ 
          where: { 
            [Op.or]: [
              { id: labelId },
              { slug: labelId },
              { name: { [Op.iLike]: labelId } }
            ]
          },
          attributes: ['id', 'name', 'display_name', 'slug']
        });
        
        if (!label) {
          logger.warn('Label not found:', labelId);
          return res.status(404).json({ error: 'Label not found', label: labelId });
        }
        
        where.label_id = label.id;
        logger.info('Found label:', { id: label.id, name: label.name, slug: label.slug });
      } catch (labelError) {
        logger.error('Error finding label:', labelError);
        throw labelError;
      }
    }
    
    if (artistId) {
      include[0].where = { id: artistId };
      include[0].required = true;
      logger.info('Filtering by artist:', artistId);
    }
    if (albumId) {
      include[1].where = { id: albumId };
      include[1].required = true;
      logger.info('Filtering by album:', albumId);
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { '$artists.name$': { [Op.iLike]: `%${search}%` } }
      ];
      logger.info('Searching for:', search);
    }

    const startTime = Date.now();
    
    try {
      logger.info('Executing track query with:', { 
        where, 
        include: include.map(inc => ({
          model: inc.model.name,
          as: inc.as,
          required: inc.required
        })),
        order: [[sort, 'DESC']],
        limit,
        offset
      });

      const [tracks, total] = await Promise.all([
        Track.findAll({
          where,
          include,
          order: [[sort, 'DESC']],
          limit,
          offset,
          distinct: true
        }),
        Track.count({ 
          where, 
          include, 
          distinct: true 
        })
      ]);

      logger.info('Found tracks:', { 
        count: tracks.length, 
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });

      // Format each track using the formatTrackData helper
      const formattedTracks = tracks
        .map(track => {
          try {
            const plainTrack = track.get({ plain: true });
            
            // Debug logging for the first track
            if (tracks.indexOf(track) === 0) {
              logger.info('First track raw data:', {
                trackName: plainTrack.name,
                hasArtists: !!plainTrack.artists,
                artistsCount: plainTrack.artists?.length,
                firstArtist: plainTrack.artists?.[0] ? {
                  name: plainTrack.artists[0].name,
                  image_url: plainTrack.artists[0].image_url,
                  hasImages: !!plainTrack.artists[0].images,
                  imagesCount: plainTrack.artists[0].images?.length,
                  firstImage: plainTrack.artists[0].images?.[0]
                } : null
              });
            }

            const formatted = formatTrackData(plainTrack);
            
            // Debug logging for the formatted track
            if (tracks.indexOf(track) === 0) {
              logger.info('First track formatted data:', {
                trackName: formatted.name,
                hasArtists: !!formatted.artists,
                artistsCount: formatted.artists?.length,
                firstArtist: formatted.artists?.[0] ? {
                  name: formatted.artists[0].name,
                  image_url: formatted.artists[0].image_url,
                  hasImages: !!formatted.artists[0].images,
                  imagesCount: formatted.artists[0].images?.length,
                  firstImage: formatted.artists[0].images?.[0]
                } : null
              });
            }
            
            return formatted;
          } catch (err) {
            logger.error('Error formatting track:', err, { trackId: track?.id });
            return null;
          }
        })
        .filter(track => track !== null);

      const endTime = Date.now();
      logger.info(`Request processed in ${endTime - startTime}ms`);

      return res.json({
        tracks: formattedTracks,
        total: total,
        count: formattedTracks.length,
        page: page,
        totalPages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      });
    } catch (queryError) {
      logger.error('Database query error:', queryError);
      throw queryError;
    }
  } catch (error) {
    logger.error('Error fetching tracks:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch tracks', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all tracks for a label with no pagination (for debugging)
router.get('/all/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    logger.info('Getting all tracks for label:', labelId);

    const tracks = await Track.findAll({
      where: { label_id: labelId },
      include: [
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] },
          attributes: [
            'id', 
            'name', 
            'spotify_url', 
            'spotify_uri',
            'image_url',
            'images',
            'label_id'
          ]
        },
        {
          model: Release,
          as: 'release',
          attributes: [
            'id', 
            'name', 
            'title', 
            'release_date', 
            'artwork_url', 
            'images', 
            'spotify_url', 
            'spotify_uri', 
            'status'
          ],
          include: [{
            model: Artist,
            as: 'artists',
            through: { attributes: [] },
            attributes: [
              'id', 
              'name', 
              'spotify_url', 
              'spotify_uri',
              'image_url',
              'images',
              'label_id'
            ]
          }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    logger.info('Found tracks:', {
      labelId,
      count: tracks.length
    });

    // Format each track using the formatTrackData helper
    const formattedTracks = tracks
      .map(track => {
        try {
          const plainTrack = track.get({ plain: true });
          return formatTrackData(plainTrack);
        } catch (err) {
          logger.error('Error formatting track:', err, { trackId: track?.id });
          return null;
        }
      })
      .filter(track => track !== null);

    res.json({ tracks: formattedTracks });
  } catch (error) {
    logger.error('Error fetching all tracks:', error);
    res.status(500).json({ error: error.message });
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
    try {
        const tracks = [];
        let offset = 0;
        let hasMore = true;
        const limit = 100; // Maximum allowed by Spotify API

        while (hasMore) {
            // Get tracks from playlist with pagination
            const playlistResponse = await makeSpotifyRequest(
                `https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks?limit=${limit}&offset=${offset}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
                hasMore = false;
                continue;
            }

            for (const item of playlistResponse.data.items) {
                if (!item.track) continue;

                // Get full artist details for each track
                const trackArtists = await Promise.all(
                    item.track.artists.map(async (artist) => {
                        const artistResponse = await makeSpotifyRequest(
                            `https://api.spotify.com/v1/artists/${artist.id}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        return artistResponse.data;
                    })
                );

                // Get full album details
                const albumResponse = await makeSpotifyRequest(
                    `https://api.spotify.com/v1/albums/${item.track.album.id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Combine the data
                const trackWithFullDetails = {
                    ...item.track,
                    artists: trackArtists,
                    album: albumResponse.data
                };

                tracks.push(trackWithFullDetails);
            }

            // Update offset and check if we have more tracks
            offset += playlistResponse.data.items.length;
            hasMore = playlistResponse.data.items.length === limit;
        }

        logger.info(`Imported ${tracks.length} tracks from Spotify playlist`);
        return tracks;
    } catch (error) {
        logger.error('Error importing tracks from Spotify:', error);
        throw error;
    }
}

// Helper function to save track to database
async function saveTrackToDatabase(track, labelId, releaseId = null) {
    try {
        const existingTrack = await Track.findOne({ where: { id: track.id } });
        
        const trackData = {
            id: track.id,
            name: track.name,
            duration: track.duration_ms,
            track_number: track.track_number,
            disc_number: track.disc_number,
            isrc: track.external_ids?.isrc,
            preview_url: track.preview_url,
            spotify_url: track.external_urls?.spotify,
            spotify_uri: track.uri,
            release_id: releaseId || track.album?.id,
            label_id: labelId,
            status: track.status || 'published',  // Default to published
            type: track.type || 'track',
            explicit: track.explicit || false,
            popularity: track.popularity || 0,
            available_markets: track.available_markets || [],
            is_local: track.is_local || false,
            external_urls: track.external_urls || {}
        };

        if (existingTrack) {
            await existingTrack.update(trackData);
            logger.info(`Updated track: ${track.name}`);
        } else {
            await Track.create(trackData);
            logger.info(`Created track: ${track.name}`);
        }

        // Process artists
        if (track.artists?.length > 0) {
            for (const artist of track.artists) {
                const [artistRecord] = await Artist.findOrCreate({
                    where: { id: artist.id },
                    defaults: {
                        id: artist.id,
                        name: artist.name,
                        spotify_url: artist.external_urls?.spotify,
                        spotify_uri: artist.uri,
                        image_url: artist.images?.[0]?.url,
                        images: artist.images || [],
                        label_id: labelId
                    }
                });

                await TrackArtist.findOrCreate({
                    where: {
                        track_id: track.id,
                        artist_id: artistRecord.id
                    }
                });
            }
        }

        return true;
    } catch (error) {
        logger.error('Error saving track to database:', error);
        throw error;
    }
}

/**
 * @swagger
 * /tracks/cache:
 *   delete:
 *     summary: Clear track cache
 *     tags: [Tracks]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.delete('/cache', async (req, res) => {
    try {
        // Clear all tracks from the database
        await Track.destroy({ where: {} });
        
        logger.info('Track cache cleared successfully');
        res.json({ message: 'Track cache cleared successfully' });
    } catch (error) {
        logger.error('Error clearing track cache:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
