const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, query, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { validateRequest, isValidSpotifyId } = require('../utils/validation');
const { cacheMiddleware, clearCache } = require('../utils/cache');

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
router.use(limiter);

// Helper function to format track data
const formatTrackData = (spotifyData) => ({
    artists: spotifyData.artists.map(artist => ({
        name: artist.name
    })),
    name: spotifyData.name,
    album: {
        name: spotifyData.album.name,
        label: spotifyData.album.label || 'Unknown Label'
    },
    duration_ms: spotifyData.duration_ms,
    popularity: spotifyData.popularity,
    preview_url: spotifyData.preview_url
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
        res.json({
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
        
        const accessToken = await getSpotifyToken();
        const trackResponse = await axios.get(
            `https://api.spotify.com/v1/tracks/${trackId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        let formattedTrack = formatTrackData(trackResponse.data);

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

        res.json(formattedTrack);

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
        const accessToken = await getSpotifyToken();

        const trackResponses = await Promise.all(
            trackIds.map(async id => {
                try {
                    const response = await axios.get(
                        `https://api.spotify.com/v1/tracks/${id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        }
                    );
                    return { success: true, data: response.data };
                } catch (error) {
                    return { 
                        success: false, 
                        id, 
                        error: error.response?.data?.error?.message || error.message 
                    };
                }
            })
        );

        const results = {
            successful: [],
            failed: []
        };

        trackResponses.forEach(response => {
            if (response.success) {
                let formattedTrack = formatTrackData(response.data);
                
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
                
                results.successful.push(formattedTrack);
            } else {
                results.failed.push({
                    trackId: response.id,
                    error: response.error
                });
            }
        });

        res.json(results);

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
        res.json(recommendations);

    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to get recommendations',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

module.exports = router;
