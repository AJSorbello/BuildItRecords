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
const { query, param, body } = require('express-validator');
const { validateRequest, isValidSpotifyId } = require('../utils/validation');
const { getSpotifyToken } = require('../utils/spotify');
const { pool } = require('../utils/db');
const { spotifyService } = require('../../src/services/SpotifyService');
// Format artist data to match Spotify SDK format
const formatArtistData = (spotifyData) => {
    var _a;
    console.log('Formatting artist data:', spotifyData);
    const formattedData = {
        id: spotifyData.id,
        name: spotifyData.name,
        external_urls: spotifyData.external_urls || { spotify: null },
        followers: {
            total: ((_a = spotifyData.followers) === null || _a === void 0 ? void 0 : _a.total) || 0,
            href: null
        },
        images: Array.isArray(spotifyData.images)
            ? spotifyData.images.map(img => ({
                url: img.url,
                height: img.height || null,
                width: img.width || null
            }))
            : [],
        popularity: spotifyData.popularity || 0,
        type: 'artist',
        uri: spotifyData.uri || `spotify:artist:${spotifyData.id}`,
        cached_at: Date.now()
    };
    console.log('Formatted artist data:', formattedData);
    return formattedData;
};
// Search artists - this must come before /:artistId routes
router.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Received search request:', {
        query: req.query,
        headers: req.headers,
        path: req.path
    });
    try {
        const searchQuery = req.query.search || '';
        const label = req.query.label;
        console.log('Searching artists with query:', searchQuery, 'and label:', label);
        let queryText = 'SELECT * FROM artists WHERE 1=1';
        const queryParams = [];
        // Add search condition if search query exists
        if (searchQuery.trim()) {
            queryParams.push(`%${searchQuery.trim()}%`);
            queryText += ` AND name ILIKE $${queryParams.length}`;
        }
        // Add label condition if label exists
        if (label) {
            queryParams.push(label);
            queryText += ` AND label = $${queryParams.length}`;
        }
        queryText += ' ORDER BY name ASC';
        console.log('Executing query:', queryText, 'with params:', queryParams);
        const result = yield pool.query(queryText, queryParams);
        console.log(`Found ${result.rows.length} artists`);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error searching artists:', error);
        res.status(500).json({ error: 'Failed to search artists' });
    }
}));
// Get artist by ID
router.get('/:artistId', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
    query('fields').optional().isString(),
    validateRequest
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('Received artist request:', {
        params: req.params,
        query: req.query,
        headers: req.headers,
        path: req.path
    });
    try {
        const { artistId } = req.params;
        const { fields } = req.query;
        const { rows } = yield pool.query('SELECT * FROM artists WHERE id = $1', [artistId]);
        console.log('Found artist in database:', rows.length);
        if (rows.length === 0) {
            // If not in database, fetch from Spotify
            console.log('No artist found in database, trying Spotify');
            const spotifyArtist = yield spotifyService.getArtist(artistId);
            let formattedArtist = formatArtistData(spotifyArtist);
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
            // Insert artist into database
            yield pool.query(`INSERT INTO artists (
                    id, 
                    name, 
                    external_urls, 
                    followers, 
                    images, 
                    popularity,
                    type,
                    uri,
                    cached_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    external_urls = EXCLUDED.external_urls,
                    followers = EXCLUDED.followers,
                    images = EXCLUDED.images,
                    popularity = EXCLUDED.popularity,
                    type = EXCLUDED.type,
                    uri = EXCLUDED.uri,
                    cached_at = EXCLUDED.cached_at`, [
                formattedArtist.id,
                formattedArtist.name,
                formattedArtist.external_urls,
                formattedArtist.followers,
                formattedArtist.images,
                formattedArtist.popularity,
                formattedArtist.type,
                formattedArtist.uri,
                formattedArtist.cached_at
            ]);
            res.set('X-Data-Source', 'spotify').json(formattedArtist);
        }
        else {
            console.log('Found artist in database:', rows[0]);
            let artist = rows[0];
            // Apply field filtering if requested
            if (fields) {
                const requestedFields = fields.split(',');
                artist = requestedFields.reduce((filtered, field) => {
                    if (field in artist) {
                        filtered[field] = artist[field];
                    }
                    return filtered;
                }, {});
            }
            res.set('X-Data-Source', 'database').json(artist);
        }
    }
    catch (error) {
        console.error('Error in /artist route:', error);
        res.status(((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) || 500).json({
            message: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}));
// Get artist's top tracks
router.get('/:artistId/top-tracks', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
    query('market').optional().isString().isLength({ min: 2, max: 2 }),
    validateRequest
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    console.log('Received top tracks request:', {
        params: req.params,
        query: req.query,
        headers: req.headers,
        path: req.path
    });
    try {
        const { artistId } = req.params;
        const market = req.query.market || 'US';
        const { rows } = yield pool.query('SELECT * FROM top_tracks WHERE artist_id = $1 AND market = $2', [artistId, market]);
        console.log('Found top tracks in database:', rows.length);
        if (rows.length === 0) {
            // If not in database, fetch from Spotify
            console.log('No top tracks found in database, trying Spotify');
            const topTracksResponse = yield spotifyService.getArtistTopTracks(artistId, market);
            console.log('Got Spotify response:', topTracksResponse.tracks.length, 'tracks');
            const topTracks = topTracksResponse.tracks.map(track => ({
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
            // Insert top tracks into database
            yield Promise.all(topTracks.map((track) => __awaiter(void 0, void 0, void 0, function* () {
                yield pool.query('INSERT INTO top_tracks (artist_id, market, id, name, popularity, preview_url, duration_ms, album_id, album_name, album_release_date, album_images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)', [artistId, market, track.id, track.name, track.popularity, track.preview_url, track.duration_ms, track.album.id, track.album.name, track.album.release_date, track.album.images]);
            })));
            res.set('X-Data-Source', 'spotify').json(topTracks);
        }
        else {
            console.log('Found top tracks in database:', rows);
            res.set('X-Data-Source', 'database').json(rows);
        }
    }
    catch (error) {
        console.error('Error in /top-tracks route:', error);
        res.status(((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 500).json({
            message: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}));
// Get artist's albums
router.get('/:artistId/albums', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
    query('include_groups').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    validateRequest
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    console.log('Received albums request:', {
        params: req.params,
        query: req.query,
        headers: req.headers,
        path: req.path
    });
    try {
        const { artistId } = req.params;
        const { include_groups = 'album,single,compilation', limit = 20, offset = 0 } = req.query;
        const { rows } = yield pool.query('SELECT * FROM albums WHERE artist_id = $1 AND include_groups = $2 LIMIT $3 OFFSET $4', [artistId, include_groups, limit, offset]);
        console.log('Found albums in database:', rows.length);
        if (rows.length === 0) {
            // If not in database, fetch from Spotify
            console.log('No albums found in database, trying Spotify');
            const albumsResponse = yield spotifyService.getArtistAlbums(artistId, include_groups, limit, offset);
            console.log('Got Spotify response:', albumsResponse.items.length, 'albums');
            const albums = albumsResponse.items.map(album => ({
                id: album.id,
                name: album.name,
                release_date: album.release_date,
                total_tracks: album.total_tracks,
                type: album.album_type,
                images: album.images,
                external_urls: album.external_urls
            }));
            // Insert albums into database
            yield Promise.all(albums.map((album) => __awaiter(void 0, void 0, void 0, function* () {
                yield pool.query('INSERT INTO albums (artist_id, include_groups, id, name, release_date, total_tracks, type, images, external_urls) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [artistId, include_groups, album.id, album.name, album.release_date, album.total_tracks, album.type, album.images, album.external_urls]);
            })));
            res.set('X-Data-Source', 'spotify').json({
                albums,
                total: albumsResponse.total,
                offset,
                limit
            });
        }
        else {
            console.log('Found albums in database:', rows);
            res.set('X-Data-Source', 'database').json({
                albums: rows,
                total: rows.length,
                offset,
                limit
            });
        }
    }
    catch (error) {
        console.error('Error in /albums route:', error);
        res.status(((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) || 500).json({
            message: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}));
// Get artist's related artists
router.get('/:artistId/related', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
    validateRequest
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    console.log('Received related artists request:', {
        params: req.params,
        query: req.query,
        headers: req.headers,
        path: req.path
    });
    try {
        const { artistId } = req.params;
        const { rows } = yield pool.query('SELECT * FROM related_artists WHERE artist_id = $1', [artistId]);
        console.log('Found related artists in database:', rows.length);
        if (rows.length === 0) {
            // If not in database, fetch from Spotify
            console.log('No related artists found in database, trying Spotify');
            const relatedResponse = yield spotifyService.getArtistRelatedArtists(artistId);
            console.log('Got Spotify response:', relatedResponse.artists.length, 'artists');
            const relatedArtists = relatedResponse.artists.map(formatArtistData);
            // Insert related artists into database
            yield Promise.all(relatedArtists.map((artist) => __awaiter(void 0, void 0, void 0, function* () {
                yield pool.query(`INSERT INTO related_artists (
                        artist_id, 
                        id, 
                        name, 
                        external_urls, 
                        followers, 
                        images, 
                        popularity,
                        type,
                        uri,
                        cached_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                    ON CONFLICT (id) DO UPDATE SET
                        artist_id = EXCLUDED.artist_id,
                        name = EXCLUDED.name,
                        external_urls = EXCLUDED.external_urls,
                        followers = EXCLUDED.followers,
                        images = EXCLUDED.images,
                        popularity = EXCLUDED.popularity,
                        type = EXCLUDED.type,
                        uri = EXCLUDED.uri,
                        cached_at = EXCLUDED.cached_at`, [
                    artistId,
                    artist.id,
                    artist.name,
                    artist.external_urls,
                    artist.followers,
                    artist.images,
                    artist.popularity,
                    artist.type,
                    artist.uri,
                    artist.cached_at
                ]);
            })));
            res.set('X-Data-Source', 'spotify').json(relatedArtists);
        }
        else {
            console.log('Found related artists in database:', rows);
            res.set('X-Data-Source', 'database').json(rows);
        }
    }
    catch (error) {
        console.error('Error in /related route:', error);
        res.status(((_d = error.response) === null || _d === void 0 ? void 0 : _d.status) || 500).json({
            message: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}));
// Get artist's releases (including collaborations)
router.get('/:artistId/releases', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
    validateRequest
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    console.log('Received releases request:', {
        params: req.params,
        query: req.query,
        headers: req.headers,
        path: req.path
    });
    try {
        const { artistId } = req.params;
        const { rows } = yield pool.query('SELECT * FROM releases WHERE artist_id = $1', [artistId]);
        console.log('Found releases in database:', rows.length);
        if (rows.length === 0) {
            // If not in database, fetch from Spotify
            console.log('No releases found in database, trying Spotify');
            const releasesResponse = yield spotifyService.getArtistReleases(artistId);
            console.log('Got Spotify response:', releasesResponse.length, 'releases');
            // Format the releases
            const releases = releasesResponse.map(item => ({
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
            // Insert releases into database
            yield Promise.all(releases.map((release) => __awaiter(void 0, void 0, void 0, function* () {
                yield pool.query('INSERT INTO releases (artist_id, id, name, type, release_date, images, artists) VALUES ($1, $2, $3, $4, $5, $6, $7)', [artistId, release.id, release.name, release.type, release.release_date, release.images, JSON.stringify(release.artists)]);
            })));
            res.set('X-Data-Source', 'spotify').json(releases);
        }
        else {
            console.log('Found releases in database:', rows);
            res.set('X-Data-Source', 'database').json(rows);
        }
    }
    catch (error) {
        console.error('Error in /releases route:', error);
        res.status(((_e = error.response) === null || _e === void 0 ? void 0 : _e.status) || 500).json({
            message: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}));
// Create or update multiple artist profiles
router.post('/batch', [
    body('artists').isArray().withMessage('Artists array is required'),
    validateRequest
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Received batch request:', {
        body: req.body,
        headers: req.headers,
        path: req.path
    });
    try {
        const { artists } = req.body;
        // Process each artist in parallel
        const processedArtists = yield Promise.all(artists.map((artist) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                console.log('Processing artist:', artist.id);
                const spotifyArtist = yield spotifyService.getArtist(artist.id);
                return formatArtistData(spotifyArtist);
            }
            catch (error) {
                console.error(`Error processing artist ${artist.id}:`, error);
                return {
                    id: artist.id,
                    error: error.message,
                    status: 'failed'
                };
            }
        })));
        // Insert artists into database
        yield Promise.all(processedArtists.map((artist) => __awaiter(void 0, void 0, void 0, function* () {
            yield pool.query(`INSERT INTO artists (
                    id, 
                    name, 
                    external_urls, 
                    followers, 
                    images, 
                    popularity,
                    type,
                    uri,
                    cached_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    external_urls = EXCLUDED.external_urls,
                    followers = EXCLUDED.followers,
                    images = EXCLUDED.images,
                    popularity = EXCLUDED.popularity,
                    type = EXCLUDED.type,
                    uri = EXCLUDED.uri,
                    cached_at = EXCLUDED.cached_at`, [
                artist.id,
                artist.name,
                artist.external_urls,
                artist.followers,
                artist.images,
                artist.popularity,
                artist.type,
                artist.uri,
                artist.cached_at
            ]);
        })));
        res.json({
            message: 'Artist profiles processed',
            artists: processedArtists
        });
    }
    catch (error) {
        console.error('Error in /batch route:', error);
        res.status(500).json({
            message: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}));
module.exports = router;
