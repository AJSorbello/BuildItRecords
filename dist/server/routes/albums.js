"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { albumId } = req.params;
        const { fields } = req.query;
        const album = yield models.Release.findByPk(albumId, {
            include: [
                { model: models.Track },
                { model: models.Artist, through: models.ReleaseArtist }
            ]
        });
        if (!album) {
            return res.status(404).json({ error: 'Album not found' });
        }
        const spotifyAlbum = yield spotifyService.getAlbum(albumId);
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
    }
    catch (error) {
        console.error('Error fetching album:', error);
        res.status(((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) || 500).json({
            error: 'Failed to fetch album data',
            message: ((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || error.message
        });
    }
}));
// Get album tracks
router.get('/:albumId/tracks', [
    param('albumId').custom(isValidSpotifyId).withMessage('Invalid Spotify album ID'),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    validateRequest
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f, _g, _h;
    try {
        const { albumId } = req.params;
        const { limit = 20, offset = 0 } = req.query;
        const album = yield models.Release.findByPk(albumId, {
            include: [
                { model: models.Track },
                { model: models.Artist, through: models.ReleaseArtist }
            ]
        });
        if (!album) {
            return res.status(404).json({ error: 'Album not found' });
        }
        const spotifyAlbum = yield spotifyService.getAlbum(albumId);
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
    }
    catch (error) {
        console.error('Error fetching album tracks:', error);
        res.status(((_e = error.response) === null || _e === void 0 ? void 0 : _e.status) || 500).json({
            error: 'Failed to fetch album tracks',
            message: ((_h = (_g = (_f = error.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.error) === null || _h === void 0 ? void 0 : _h.message) || error.message
        });
    }
}));
// Get new releases
router.get('/new-releases', [
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    validateRequest
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k, _l, _m;
    try {
        const { limit = 20, offset = 0 } = req.query;
        const newReleases = yield spotifyService.getNewReleases(limit, offset);
        const albums = newReleases.albums.items.map(formatAlbumData);
        res.json({
            albums,
            total: newReleases.albums.total,
            offset,
            limit
        });
    }
    catch (error) {
        console.error('Error fetching new releases:', error);
        res.status(((_j = error.response) === null || _j === void 0 ? void 0 : _j.status) || 500).json({
            error: 'Failed to fetch new releases',
            message: ((_m = (_l = (_k = error.response) === null || _k === void 0 ? void 0 : _k.data) === null || _l === void 0 ? void 0 : _l.error) === null || _m === void 0 ? void 0 : _m.message) || error.message
        });
    }
}));
module.exports = router;
