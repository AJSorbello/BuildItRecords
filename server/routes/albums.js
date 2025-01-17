const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const { validateRequest } = require('../utils/validation');
const { spotifyService } = require('../../src/services/SpotifyService');
const { models, sequelize } = require('../utils/db');

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
    validateRequest
], async (req, res) => {
    try {
        const { albumId } = req.params;
        const { fields } = req.query;
        
        const album = await models.Release.findByPk(albumId, {
          include: [
            { model: models.Track },
            { model: models.Artist, through: models.ReleaseArtist }
          ]
        });
        
        if (!album) {
          return res.status(404).json({ error: 'Album not found' });
        }

        const spotifyAlbum = await spotifyService.getAlbum(albumId);
        if (spotifyAlbum) {
          album.dataValues.spotify_data = spotifyAlbum;
        }

        let formattedAlbum = formatAlbumData(album.dataValues.spotify_data);

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
    validateRequest
], async (req, res) => {
    try {
        const { albumId } = req.params;
        const { limit = 20, offset = 0 } = req.query;
        
        const album = await models.Release.findByPk(albumId, {
          include: [
            { model: models.Track },
            { model: models.Artist, through: models.ReleaseArtist }
          ]
        });
        
        if (!album) {
          return res.status(404).json({ error: 'Album not found' });
        }

        const spotifyAlbum = await spotifyService.getAlbum(albumId);
        if (spotifyAlbum) {
          album.dataValues.spotify_data = spotifyAlbum;
        }

        const tracks = album.dataValues.tracks.map(track => ({
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
            total: album.dataValues.tracks.length,
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
    validateRequest
], async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        
        const newReleases = await spotifyService.getNewReleases(limit, offset);
        const albums = newReleases.albums.items.map(formatAlbumData);

        res.json({
            albums,
            total: newReleases.albums.total,
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
