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
const axios = require('axios');
const { body, query, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { validateRequest, isValidSpotifyId } = require('../utils/validation');
const { Track, Artist, Release, Label, ImportLog, sequelize } = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../../src/utils/logger');
// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
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
function getSpotifyToken() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
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
            const response = yield makeSpotifyRequest('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: 'grant_type=client_credentials'
            });
            logger.info('Got Spotify token successfully');
            return response.data.access_token;
        }
        catch (error) {
            logger.error('Error getting Spotify token:', {
                message: error.message,
                response: (_a = error.response) === null || _a === void 0 ? void 0 : _a.data
            });
            throw error;
        }
    });
}
// Helper function to make a request with retries
function makeSpotifyRequest(url, options, maxRetries = 3) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.info(`Attempt ${attempt} for ${url}`);
                const response = yield axios(url, options);
                return response;
            }
            catch (error) {
                lastError = error;
                if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 503) {
                    const delay = Math.min(1000 * attempt, 3000); // Exponential backoff, max 3 seconds
                    logger.info(`Service unavailable, retrying in ${delay}ms...`);
                    yield new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 429) {
                    const retryAfter = error.response.headers['retry-after'] || 1;
                    const delay = retryAfter * 1000;
                    logger.info(`Rate limited, retrying in ${delay}ms...`);
                    yield new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw error;
            }
        }
        throw lastError;
    });
}
// Helper function to fetch track from Spotify
function fetchTrackFromSpotify(trackId, accessToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield makeSpotifyRequest(`https://api.spotify.com/v1/tracks/${trackId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        return response.data;
    });
}
// Helper function to handle track caching
function getTrackWithCache(trackId, redisService) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Try to get from cache first
            const cachedTrack = yield redisService.getTrackJson(trackId);
            if (cachedTrack) {
                const cacheAge = Date.now() - cachedTrack.cached_at;
                if (cacheAge < 60 * 60 * 1000) {
                    return { track: cachedTrack, source: 'cache' };
                }
            }
            // If not in cache or cache is stale, fetch from Spotify
            const accessToken = yield getSpotifyToken();
            const spotifyTrack = yield fetchTrackFromSpotify(trackId, accessToken);
            const formattedTrack = formatTrackData(spotifyTrack);
            // Cache the track
            yield redisService.setTrackJson(trackId, formattedTrack);
            return { track: formattedTrack, source: 'spotify' };
        }
        catch (error) {
            // If Spotify fetch fails but we have cached data, return it
            if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 404 && cachedTrack) {
                return { track: cachedTrack, source: 'cache-fallback' };
            }
            throw error;
        }
    });
}
// Get all tracks with optional label filter
router.get('/', [
    query('labelId').optional().isString(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    validateRequest
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { labelId } = req.query;
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 50;
        const where = {};
        if (labelId) {
            where.label_id = labelId;
        }
        const { count, rows } = yield Track.findAndCountAll({
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
            order: [['created_at', 'DESC']],
            offset,
            limit
        });
        res.json({
            items: rows,
            total: count,
            offset,
            limit,
            hasMore: offset + rows.length < count
        });
    }
    catch (error) {
        logger.error('Error fetching tracks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tracks',
            error: error.message
        });
    }
}));
// Search tracks with optional label filter
router.get('/search', [
    query('query').isString().notEmpty(),
    query('labelId').optional().isString(),
    validateRequest
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const tracks = yield Track.findAll({
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
    }
    catch (error) {
        logger.error('Error searching tracks:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching tracks',
            error: error.message
        });
    }
}));
// Import tracks from Spotify
router.post('/import', [
    body('labelId').isString().notEmpty().withMessage('Label ID is required'),
    body('spotifyPlaylistId').isString().notEmpty().withMessage('Spotify playlist ID is required'),
    validateRequest
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { labelId, spotifyPlaylistId } = req.body;
        // Get Spotify token
        const token = yield getSpotifyToken();
        // Import tracks from Spotify
        const spotifyTracks = yield importTracksFromSpotify(token, spotifyPlaylistId);
        // Save tracks to database
        const savedTracks = yield Promise.all(spotifyTracks.map(track => saveTrackToDatabase(track, labelId)));
        res.json({ tracks: savedTracks });
    }
    catch (error) {
        logger.error('Error importing tracks:', error);
        res.status(500).json({
            success: false,
            message: 'Error importing tracks',
            error: error.message
        });
    }
}));
// Helper function to import tracks from Spotify
function importTracksFromSpotify(token, spotifyPlaylistId) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield makeSpotifyRequest(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tracks = response.data.items.map(item => item.track);
        return tracks;
    });
}
// Helper function to save track to database
function saveTrackToDatabase(track, labelId) {
    return __awaiter(this, void 0, void 0, function* () {
        const existingTrack = yield Track.findByPk(track.id);
        if (existingTrack) {
            yield existingTrack.update({
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
        else {
            yield Track.create({
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
    });
}
// Other routes...
module.exports = router;
