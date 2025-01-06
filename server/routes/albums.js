const express = require('express');
const router = express.Router();
const axios = require('axios');
const { query, param } = require('express-validator');
const { validateRequest, isValidSpotifyId } = require('../utils/validation');
const { cacheMiddleware } = require('../utils/cache');
const { getSpotifyToken } = require('../utils/spotify');

// Format album data
const formatAlbumData = (spotifyData) => ({
    id: spotifyData.id,
    name: spotifyData.name,
    type: spotifyData.album_type,
    release_date: spotifyData.release_date,
    total_tracks: spotifyData.total_tracks,
    artists: spotifyData.artists.map(artist => ({
        id: artist.id,
        name: artist.name
    })),
    images: spotifyData.images,
    external_urls: spotifyData.external_urls,
    copyrights: spotifyData.copyrights,
    label: spotifyData.label
});

// Get album by ID
router.get('/:albumId', [
    param('albumId').custom(isValidSpotifyId).withMessage('Invalid Spotify album ID'),
    query('fields').optional().isString(),
    validateRequest,
    cacheMiddleware
], async (req, res) => {
    try {
        const { albumId } = req.params;
        const { fields } = req.query;
        
        const accessToken = await getSpotifyToken();
        const albumResponse = await axios.get(
            `https://api.spotify.com/v1/albums/${albumId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        let formattedAlbum = formatAlbumData(albumResponse.data);

        // Apply field filtering if requested
        if (fields) {
            const requestedFields = fields.split(',');
            formattedAlbum = requestedFields.reduce((filtered, field) => {
                if (field in formattedAlbum) {
                    filtered[field] = formattedAlbum[field];
                }
                return filtered;
            }, {});
        }

        res.json(formattedAlbum);

    } catch (error) {
        console.error('Error fetching album:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch album data',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

// Get album tracks
router.get('/:albumId/tracks', [
    param('albumId').custom(isValidSpotifyId).withMessage('Invalid Spotify album ID'),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    validateRequest,
    cacheMiddleware
], async (req, res) => {
    try {
        const { albumId } = req.params;
        const { limit = 20, offset = 0 } = req.query;
        
        const accessToken = await getSpotifyToken();
        const tracksResponse = await axios.get(
            `https://api.spotify.com/v1/albums/${albumId}/tracks`,
            {
                params: {
                    limit,
                    offset,
                    market: 'US'
                },
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        const tracks = tracksResponse.data.items.map(track => ({
            id: track.id,
            name: track.name,
            track_number: track.track_number,
            duration_ms: track.duration_ms,
            preview_url: track.preview_url,
            artists: track.artists.map(artist => ({
                id: artist.id,
                name: artist.name
            }))
        }));

        res.json({
            tracks,
            total: tracksResponse.data.total,
            offset,
            limit
        });

    } catch (error) {
        console.error('Error fetching album tracks:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch album tracks',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

// Get new releases
router.get('/new-releases', [
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    validateRequest,
    cacheMiddleware
], async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        
        const accessToken = await getSpotifyToken();
        const newReleasesResponse = await axios.get(
            'https://api.spotify.com/v1/browse/new-releases',
            {
                params: {
                    limit,
                    offset,
                    country: 'US'
                },
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        const albums = newReleasesResponse.data.albums.items.map(formatAlbumData);

        res.json({
            albums,
            total: newReleasesResponse.data.albums.total,
            offset,
            limit
        });

    } catch (error) {
        console.error('Error fetching new releases:', error);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch new releases',
            message: error.response?.data?.error?.message || error.message
        });
    }
});

module.exports = router;
