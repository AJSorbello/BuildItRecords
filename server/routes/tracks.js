const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, query, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { validateRequest, isValidSpotifyId } = require('../utils/validation');
const { cacheMiddleware, clearCache } = require('../utils/cache');
const { Track, Artist, Release, Label } = require('../models');
const { Op } = require('sequelize');

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
router.use(limiter);

// Cache durations
const CACHE_DURATION = {
    SHORT: 60 * 60, // 1 hour
    MEDIUM: 24 * 60 * 60, // 1 day
    LONG: 7 * 24 * 60 * 60 // 1 week
};

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
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Missing Spotify credentials');
    }

    const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
            grant_type: 'client_credentials'
        }).toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
            }
        }
    );

    return tokenResponse.data.access_token;
}

// Helper function to fetch track from Spotify
async function fetchTrackFromSpotify(trackId, accessToken) {
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
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
            if (cacheAge < CACHE_DURATION.MEDIUM * 1000) {
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

// Search tracks
router.get('/search', [
    query('q').notEmpty().withMessage('Search query is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    validateRequest,
    cacheMiddleware
], async (req, res) => {
    try {
        const { q, limit = 20, offset = 0 } = req.query;
        const redisService = req.app.get('redisService');
        
        // Try to get results from cache
        const cacheKey = `search:${q}:${limit}:${offset}`;
        const cachedResults = await redisService.getCacheByLabel(cacheKey);
        
        if (cachedResults) {
            return res.set('X-Data-Source', 'cache').json(cachedResults);
        }

        // If not in cache, fetch from Spotify
        const accessToken = await getSpotifyToken();
        const searchResponse = await axios.get(
            `https://api.spotify.com/v1/search`,
            {
                params: {
                    q,
                    type: 'track',
                    limit,
                    offset
                },
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        const tracks = searchResponse.data.tracks.items.map(formatTrackData);
        
        // Cache the results
        await redisService.setCacheWithLabel(cacheKey, tracks, 'search');
        
        // Cache individual tracks
        await redisService.batchSetTracks(tracks);

        res.set('X-Data-Source', 'spotify').json({
            tracks,
            total: searchResponse.data.tracks.total,
            offset,
            limit
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to search tracks',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

// Get track by ID with filtering
router.get('/:trackId', [
    param('trackId').custom(isValidSpotifyId).withMessage('Invalid Spotify track ID'),
    query('fields').optional().isString(),
    validateRequest,
    cacheMiddleware
], async (req, res) => {
    try {
        const { trackId } = req.params;
        const { fields } = req.query;
        const redisService = req.app.get('redisService');
        
        const { track, source } = await getTrackWithCache(trackId, redisService);
        
        let formattedTrack = track;

        // Apply field filtering if requested
        if (fields) {
            const requestedFields = fields.split(',');
            formattedTrack = requestedFields.reduce((filtered, field) => {
                if (field in formattedTrack) {
                    filtered[field] = formattedTrack[field];
                }
                return filtered;
            }, {});
        }

        res.set('X-Data-Source', source).json(formattedTrack);

    } catch (error) {
        console.error('Error fetching track:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch track data',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

// Get multiple tracks with filtering
router.post('/batch', [
    body('trackIds').isArray().withMessage('trackIds must be an array'),
    body('trackIds.*').custom(isValidSpotifyId).withMessage('Invalid Spotify track ID'),
    body('trackIds').custom(value => value.length <= 50).withMessage('Maximum 50 tracks per request'),
    body('fields').optional().isString(),
    validateRequest
], async (req, res) => {
    try {
        const { trackIds, fields } = req.body;
        const redisService = req.app.get('redisService');
        
        const results = await Promise.all(
            trackIds.map(id => getTrackWithCache(id, redisService)
                .then(result => ({ id, ...result }))
                .catch(error => ({ id, error: error.message }))
            )
        );

        const tracks = results.reduce((acc, { id, track, error }) => {
            if (track) {
                let formattedTrack = track;
                
                // Apply field filtering if requested
                if (fields) {
                    const requestedFields = fields.split(',');
                    formattedTrack = requestedFields.reduce((filtered, field) => {
                        if (field in formattedTrack) {
                            filtered[field] = formattedTrack[field];
                        }
                        return filtered;
                    }, {});
                }
                
                acc[id] = formattedTrack;
            }
            if (error) acc[id] = { error };
            return acc;
        }, {});

        res.json(tracks);

    } catch (error) {
        console.error('Error fetching tracks:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch tracks data',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

// Get recommendations based on tracks
router.get('/recommendations', [
    query('seed_tracks').notEmpty().withMessage('At least one seed track is required'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    validateRequest,
    cacheMiddleware
], async (req, res) => {
    try {
        const { seed_tracks, limit = 20 } = req.query;
        const redisService = req.app.get('redisService');
        
        // Try to get results from cache
        const cacheKey = `recommendations:${seed_tracks}:${limit}`;
        const cachedResults = await redisService.getCacheByLabel(cacheKey);
        
        if (cachedResults) {
            return res.set('X-Data-Source', 'cache').json(cachedResults);
        }

        // If not in cache, fetch from Spotify
        const accessToken = await getSpotifyToken();
        const recommendationsResponse = await axios.get(
            'https://api.spotify.com/v1/recommendations',
            {
                params: {
                    seed_tracks: seed_tracks,
                    limit
                },
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        const recommendations = recommendationsResponse.data.tracks.map(formatTrackData);
        
        // Cache the results
        await redisService.setCacheWithLabel(cacheKey, recommendations, 'recommendations');
        
        // Cache individual tracks
        await redisService.batchSetTracks(recommendations);

        res.set('X-Data-Source', 'spotify').json(recommendations);

    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to get recommendations',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

// Get tracks by label ID or slug
router.get('/:labelId', async (req, res) => {
    try {
        const { labelId } = req.params;
        console.log('Fetching tracks for label:', labelId);

        // Find the label
        const label = await Label.findOne({
            where: {
                [Op.or]: [
                    { id: labelId },
                    { slug: labelId }
                ]
            }
        });

        if (!label) {
            console.log('Label not found:', labelId);
            return res.status(404).json({ success: false, message: 'Label not found' });
        }

        console.log('Found label:', label.name);

        // Get all tracks for this label
        const tracks = await Track.findAll({
            where: {
                recordLabel: label.id
            },
            include: [
                {
                    model: Artist,
                    attributes: ['id', 'name', 'spotifyUrl']
                },
                {
                    model: Release,
                    attributes: ['id', 'title', 'releaseDate', 'artworkUrl', 'spotifyUrl']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        console.log(`Found ${tracks.length} tracks for label ${label.name}`);

        // Transform the data to match the frontend interface
        const transformedTracks = tracks.map(track => ({
            id: track.id,
            title: track.title || track.name, // Use title if available, fallback to name
            artistId: track.artistId,
            artist: track.Artist ? {
                id: track.Artist.id,
                name: track.Artist.name,
                spotifyUrl: track.Artist.spotifyUrl
            } : null,
            releaseId: track.releaseId,
            release: track.Release ? {
                id: track.Release.id,
                title: track.Release.title,
                releaseDate: track.Release.releaseDate,
                artworkUrl: track.Release.artworkUrl,
                spotifyUrl: track.Release.spotifyUrl
            } : null,
            duration_ms: track.duration_ms,
            preview_url: track.preview_url,
            spotifyUrl: track.spotifyUrl,
            uri: track.uri
        }));

        res.json(transformedTracks);
    } catch (error) {
        console.error('Error fetching tracks:', error);
        res.status(500).json({ success: false, message: 'Error fetching tracks', error: error.message });
    }
});

module.exports = router;
