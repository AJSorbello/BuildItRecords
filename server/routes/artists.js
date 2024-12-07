const express = require('express');
const router = express.Router();
const axios = require('axios');
const { query, param, body } = require('express-validator');
const { validateRequest, isValidSpotifyId } = require('../utils/validation');
const { cacheMiddleware } = require('../utils/cache');
const { getSpotifyToken } = require('../utils/spotify');

// Format artist data
const formatArtistData = (spotifyData) => ({
    id: spotifyData.id,
    name: spotifyData.name,
    genres: spotifyData.genres,
    popularity: spotifyData.popularity,
    followers: spotifyData.followers.total,
    images: spotifyData.images,
    external_urls: spotifyData.external_urls
});

// Get artist by ID
router.get('/:artistId', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
    query('fields').optional().isString(),
    validateRequest,
    cacheMiddleware
], async (req, res) => {
    try {
        const { artistId } = req.params;
        const { fields } = req.query;
        
        const accessToken = await getSpotifyToken();
        const artistResponse = await axios.get(
            `https://api.spotify.com/v1/artists/${artistId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        let formattedArtist = formatArtistData(artistResponse.data);

        // Apply field filtering if requested
        if (fields) {
            const requestedFields = fields.split(',');
            formattedArtist = requestedFields.reduce((filtered, field) => {
                if (field in formattedArtist) {
                    filtered[field] = formattedArtist[field];
                }
                return filtered;
            }, {});
        }

        res.json(formattedArtist);

    } catch (error) {
        console.error('Error fetching artist:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch artist data',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

// Get artist's top tracks
router.get('/:artistId/top-tracks', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
    query('market').optional().isString().isLength({ min: 2, max: 2 }),
    validateRequest,
    cacheMiddleware
], async (req, res) => {
    try {
        const { artistId } = req.params;
        const market = req.query.market || 'US';
        
        const accessToken = await getSpotifyToken();
        const topTracksResponse = await axios.get(
            `https://api.spotify.com/v1/artists/${artistId}/top-tracks`,
            {
                params: { market },
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        const topTracks = topTracksResponse.data.tracks.map(track => ({
            id: track.id,
            name: track.name,
            popularity: track.popularity,
            preview_url: track.preview_url,
            duration_ms: track.duration_ms,
            album: {
                id: track.album.id,
                name: track.album.name,
                release_date: track.album.release_date,
                images: track.album.images
            }
        }));

        res.json(topTracks);

    } catch (error) {
        console.error('Error fetching top tracks:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch top tracks',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

// Get artist's albums
router.get('/:artistId/albums', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
    query('include_groups').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    validateRequest,
    cacheMiddleware
], async (req, res) => {
    try {
        const { artistId } = req.params;
        const { 
            include_groups = 'album,single,compilation',
            limit = 20,
            offset = 0
        } = req.query;
        
        const accessToken = await getSpotifyToken();
        const albumsResponse = await axios.get(
            `https://api.spotify.com/v1/artists/${artistId}/albums`,
            {
                params: {
                    include_groups,
                    limit,
                    offset,
                    market: 'US'
                },
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        const albums = albumsResponse.data.items.map(album => ({
            id: album.id,
            name: album.name,
            release_date: album.release_date,
            total_tracks: album.total_tracks,
            type: album.album_type,
            images: album.images,
            external_urls: album.external_urls
        }));

        res.json({
            albums,
            total: albumsResponse.data.total,
            offset,
            limit
        });

    } catch (error) {
        console.error('Error fetching albums:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch albums',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

// Get artist's related artists
router.get('/:artistId/related', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
    validateRequest,
    cacheMiddleware
], async (req, res) => {
    try {
        const { artistId } = req.params;
        
        const accessToken = await getSpotifyToken();
        const relatedResponse = await axios.get(
            `https://api.spotify.com/v1/artists/${artistId}/related-artists`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        const relatedArtists = relatedResponse.data.artists.map(formatArtistData);
        res.json(relatedArtists);

    } catch (error) {
        console.error('Error fetching related artists:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch related artists',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

// Get artist's releases (including collaborations)
router.get('/:artistId/releases', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
    validateRequest,
    cacheMiddleware
], async (req, res) => {
    try {
        const { artistId } = req.params;
        const accessToken = await getSpotifyToken();

        // Get artist's tracks and singles
        const tracksResponse = await axios.get(
            `https://api.spotify.com/v1/artists/${artistId}/albums`,
            {
                params: {
                    include_groups: 'single,album',
                    limit: 50,
                    market: 'US'
                },
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        // Format the releases
        const releases = tracksResponse.data.items.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            release_date: item.release_date,
            images: item.images,
            artists: item.artists.map(artist => ({
                id: artist.id,
                name: artist.name
            }))
        }));

        res.json(releases);

    } catch (error) {
        console.error('Error fetching releases:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch releases',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

// Create or update multiple artist profiles
router.post('/batch', [
    body('artists').isArray().withMessage('Artists array is required'),
    validateRequest
], async (req, res) => {
    try {
        const { artists } = req.body;
        
        // Process each artist in parallel
        const processedArtists = await Promise.all(
            artists.map(async (artist) => {
                try {
                    const accessToken = await getSpotifyToken();
                    const artistResponse = await axios.get(
                        `https://api.spotify.com/v1/artists/${artist.id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        }
                    );
                    
                    return formatArtistData(artistResponse.data);
                } catch (error) {
                    console.error(`Error processing artist ${artist.id}:`, error);
                    return {
                        id: artist.id,
                        error: error.message,
                        status: 'failed'
                    };
                }
            })
        );
        
        res.json({
            message: 'Artist profiles processed',
            artists: processedArtists
        });
        
    } catch (error) {
        console.error('Error processing artists:', error);
        res.status(500).json({
            error: 'Failed to process artist profiles',
            message: error.message
        });
    }
});

module.exports = router;
