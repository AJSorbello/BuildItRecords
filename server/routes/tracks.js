const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, query, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { validateRequest, isValidSpotifyId } = require('../utils/validation');
const { Track, Artist, Release, Label, ImportLog } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

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
    const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
    
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', 
            'grant_type=client_credentials', {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data.access_token;
    } catch (error) {
        logger.error('Error getting Spotify token:', error);
        throw error;
    }
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

// GET /tracks
router.get('/', async (req, res) => {
    try {
        const { label, limit = 50, offset = 0 } = req.query;
        
        const where = {};
        if (label) {
            where.labelId = label;
        }

        const tracks = await Track.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
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
            order: [['createdAt', 'DESC']]
        });

        res.json({
            tracks: tracks.rows,
            total: tracks.count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        logger.error('Error fetching tracks:', error);
        res.status(500).json({ error: 'Failed to fetch tracks', details: error.message });
    }
});

// GET /tracks/:id
router.get('/:id', async (req, res) => {
    try {
        const track = await Track.findByPk(req.params.id, {
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
            ]
        });

        if (!track) {
            return res.status(404).json({ error: 'Track not found' });
        }

        res.json(track);
    } catch (error) {
        logger.error('Error fetching track:', error);
        res.status(500).json({ error: 'Failed to fetch track', details: error.message });
    }
});

// Search tracks
router.get('/search', [
    query('q').notEmpty().withMessage('Search query is required'),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    validateRequest
], async (req, res) => {
    try {
        const { q, limit = 20, offset = 0 } = req.query;

        const tracks = await Track.findAndCountAll({
            where: {
                [Op.or]: [
                    { name: { [Op.iLike]: `%${q}%` } },
                    { '$artists.name$': { [Op.iLike]: `%${q}%` } }
                ]
            },
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
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            tracks: tracks.rows,
            total: tracks.count,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        logger.error('Error searching tracks:', error);
        res.status(500).json({ error: 'Failed to search tracks', details: error.message });
    }
});

// Get track by ID with filtering
router.get('/:trackId', [
    param('trackId').custom(isValidSpotifyId).withMessage('Invalid Spotify track ID'),
    query('fields').optional().isString(),
    validateRequest
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
    validateRequest
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

// Update track details
router.put('/:trackId', [
    param('trackId').custom(isValidSpotifyId).withMessage('Invalid Spotify track ID'),
    body('title').optional().isString(),
    body('artistId').optional().custom(isValidSpotifyId),
    body('releaseId').optional().custom(isValidSpotifyId),
    validateRequest
], async (req, res) => {
    try {
        const { trackId } = req.params;
        const updates = req.body;

        // Find the track
        const track = await Track.findByPk(trackId);
        if (!track) {
            return res.status(404).json({ message: 'Track not found' });
        }

        // Update track details
        await track.update(updates);

        // Log the update
        await ImportLog.create({
            type: 'track',
            spotifyId: trackId,
            status: 'success',
            importedAt: new Date()
        });

        // Clear cache
        const redisService = req.app.get('redisService');
        await redisService.deleteTrackJson(trackId);

        // Get updated track with associations
        const updatedTrack = await Track.findByPk(trackId, {
            include: [
                {
                    model: Artist,
                    attributes: ['id', 'name', 'spotifyUrl']
                },
                {
                    model: Release,
                    attributes: ['id', 'title', 'releaseDate', 'artworkUrl', 'spotifyUrl']
                }
            ]
        });

        res.json(updatedTrack);
    } catch (error) {
        logger.error('Error updating track:', error);
        res.status(500).json({
            error: 'Failed to update track',
            message: error.message
        });
    }
});

// Delete track
router.delete('/:trackId', [
    param('trackId').custom(isValidSpotifyId).withMessage('Invalid Spotify track ID'),
    validateRequest
], async (req, res) => {
    try {
        const { trackId } = req.params;

        // Find the track
        const track = await Track.findByPk(trackId);
        if (!track) {
            return res.status(404).json({ message: 'Track not found' });
        }

        // Delete track
        await track.destroy();

        // Log the deletion
        await ImportLog.create({
            type: 'track',
            spotifyId: trackId,
            status: 'success',
            importedAt: new Date()
        });

        // Clear cache
        const redisService = req.app.get('redisService');
        await redisService.deleteTrackJson(trackId);

        res.json({ message: 'Track deleted successfully' });
    } catch (error) {
        logger.error('Error deleting track:', error);
        res.status(500).json({
            error: 'Failed to delete track',
            message: error.message
        });
    }
});

// Get track import history
router.get('/:trackId/imports', [
    param('trackId').custom(isValidSpotifyId).withMessage('Invalid Spotify track ID'),
    validateRequest
], async (req, res) => {
    try {
        const { trackId } = req.params;

        const imports = await ImportLog.findAll({
            where: {
                type: 'track',
                spotifyId: trackId
            },
            order: [['importedAt', 'DESC']],
            limit: 10
        });

        res.json(imports);
    } catch (error) {
        logger.error('Error fetching track import history:', error);
        res.status(500).json({
            error: 'Failed to fetch import history',
            message: error.message
        });
    }
});

// Import multiple tracks
router.post('/import', [
    body('tracks').isArray().withMessage('tracks must be an array'),
    validateRequest
], async (req, res) => {
    try {
        const { tracks } = req.body;
        console.log('Importing tracks:', tracks);

        const importedTracks = await Promise.all(tracks.map(async (track) => {
            try {
                // Create or update track
                const [dbTrack, created] = await Track.findOrCreate({
                    where: { id: track.id },
                    defaults: {
                        name: track.name,
                        artists: track.artists,
                        album: track.album,
                        albumCover: track.albumCover || track.artwork_url,
                        releaseDate: track.releaseDate || track.release_date,
                        spotifyUrl: track.spotifyUrl,
                        preview_url: track.preview_url,
                        label_id: track.label_id
                    }
                });

                if (!created) {
                    // Update existing track
                    await dbTrack.update({
                        name: track.name,
                        artists: track.artists,
                        album: track.album,
                        albumCover: track.albumCover || track.artwork_url,
                        releaseDate: track.releaseDate || track.release_date,
                        spotifyUrl: track.spotifyUrl,
                        preview_url: track.preview_url,
                        label_id: track.label_id
                    });
                }

                return dbTrack;
            } catch (error) {
                console.error('Error importing track:', error);
                return null;
            }
        }));

        const successfulImports = importedTracks.filter(track => track !== null);
        console.log('Successfully imported tracks:', successfulImports);

        res.json({
            success: true,
            message: `Successfully imported ${successfulImports.length} tracks`,
            tracks: successfulImports
        });
    } catch (error) {
        console.error('Error importing tracks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to import tracks',
            message: error.message
        });
    }
});

// Save multiple tracks in batch
router.post('/batch', [
    body('tracks').isArray().withMessage('tracks must be an array'),
    validateRequest
], async (req, res) => {
    try {
        const { tracks } = req.body;
        console.log('Saving tracks in batch:', tracks);

        const savedTracks = await Promise.all(tracks.map(async (track) => {
            try {
                // Create or update track
                const [dbTrack, created] = await Track.findOrCreate({
                    where: { id: track.id },
                    defaults: {
                        name: track.name,
                        artists: track.artists,
                        album: track.album,
                        albumCover: track.albumCover || track.artwork_url,
                        releaseDate: track.releaseDate || track.release_date,
                        spotifyUrl: track.spotifyUrl,
                        preview_url: track.preview_url,
                        label_id: track.label_id
                    }
                });

                if (!created) {
                    // Update existing track
                    await dbTrack.update({
                        name: track.name,
                        artists: track.artists,
                        album: track.album,
                        albumCover: track.albumCover || track.artwork_url,
                        releaseDate: track.releaseDate || track.release_date,
                        spotifyUrl: track.spotifyUrl,
                        preview_url: track.preview_url,
                        label_id: track.label_id
                    });
                }

                return dbTrack;
            } catch (error) {
                console.error('Error saving track:', error);
                return null;
            }
        }));

        const successfulSaves = savedTracks.filter(track => track !== null);
        console.log('Successfully saved tracks:', successfulSaves);

        res.json({
            success: true,
            message: `Successfully saved ${successfulSaves.length} tracks`,
            tracks: successfulSaves
        });
    } catch (error) {
        console.error('Error saving tracks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save tracks',
            message: error.message
        });
    }
});

module.exports = router;
