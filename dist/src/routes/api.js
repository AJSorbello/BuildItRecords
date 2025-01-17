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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pg_1 = require("pg");
const dotenv_1 = require("dotenv");
const web_api_ts_sdk_1 = require("@spotify/web-api-ts-sdk");
const node_fetch_1 = __importDefault(require("node-fetch"));
const auth_1 = require("../middleware/auth");
(0, dotenv_1.config)();
const router = (0, express_1.Router)();
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'builditrecords'
});
// Create a new Spotify API client for each request
const getSpotifyApi = () => __awaiter(void 0, void 0, void 0, function* () {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error('Missing Spotify credentials');
    }
    const response = yield (0, node_fetch_1.default)('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
        },
        body: 'grant_type=client_credentials',
    });
    const data = yield response.json();
    return web_api_ts_sdk_1.SpotifyApi.withAccessToken(clientId, {
        access_token: data.access_token,
        token_type: 'Bearer',
        expires_in: data.expires_in,
    });
});
// Get all tracks for a specific label
router.get('/labels/:labelId/tracks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { labelId } = req.params;
        const query = `
      SELECT t.*, 
             json_agg(DISTINCT a.*) as artists,
             json_agg(DISTINCT r.*) as release
      FROM tracks t
      LEFT JOIN track_artists ta ON t.id = ta.track_id
      LEFT JOIN artists a ON ta.artist_id = a.id
      LEFT JOIN releases r ON t.release_id = r.id
      WHERE t.label_id = $1
      GROUP BY t.id
    `;
        const result = yield pool.query(query, [labelId]);
        res.json({ tracks: result.rows });
    }
    catch (error) {
        console.error('Error fetching tracks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get all tracks (no label filter)
router.get('/tracks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `
      SELECT t.*, 
             json_agg(DISTINCT a.*) as artists,
             json_agg(DISTINCT r.*) as release
      FROM tracks t
      LEFT JOIN track_artists ta ON t.id = ta.track_id
      LEFT JOIN artists a ON ta.artist_id = a.id
      LEFT JOIN releases r ON t.release_id = r.id
      GROUP BY t.id
    `;
        const result = yield pool.query(query);
        res.json({ tracks: result.rows });
    }
    catch (error) {
        console.error('Error fetching tracks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Search tracks for a specific label
router.get('/labels/:labelId/tracks/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { labelId } = req.params;
        const { query } = req.query;
        const searchQuery = `
      SELECT t.*, 
             json_agg(DISTINCT a.*) as artists,
             json_agg(DISTINCT r.*) as release
      FROM tracks t
      LEFT JOIN track_artists ta ON t.id = ta.track_id
      LEFT JOIN artists a ON ta.artist_id = a.id
      LEFT JOIN releases r ON t.release_id = r.id
      WHERE t.label_id = $1
        AND (
          t.name ILIKE $2
          OR a.name ILIKE $2
          OR r.name ILIKE $2
        )
      GROUP BY t.id
    `;
        const result = yield pool.query(searchQuery, [labelId, `%${query}%`]);
        res.json({ tracks: result.rows });
    }
    catch (error) {
        console.error('Error searching tracks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Search all tracks
router.get('/tracks/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.query;
        const searchQuery = `
      SELECT t.*, 
             json_agg(DISTINCT a.*) as artists,
             json_agg(DISTINCT r.*) as release
      FROM tracks t
      LEFT JOIN track_artists ta ON t.id = ta.track_id
      LEFT JOIN artists a ON ta.artist_id = a.id
      LEFT JOIN releases r ON t.release_id = r.id
      WHERE t.name ILIKE $1
        OR a.name ILIKE $1
        OR r.name ILIKE $1
      GROUP BY t.id
    `;
        const result = yield pool.query(searchQuery, [`%${query}%`]);
        res.json({ tracks: result.rows });
    }
    catch (error) {
        console.error('Error searching tracks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get releases for a specific label
router.get('/labels/:labelId/releases', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { labelId } = req.params;
        const query = `
      SELECT r.*, 
             json_agg(DISTINCT a.*) as artists,
             json_agg(DISTINCT t.*) as tracks
      FROM releases r
      LEFT JOIN release_artists ra ON r.id = ra.release_id
      LEFT JOIN artists a ON ra.artist_id = a.id
      LEFT JOIN tracks t ON r.id = t.release_id
      WHERE r.label_id = $1
      GROUP BY r.id
    `;
        const result = yield pool.query(query, [labelId]);
        res.json({ releases: result.rows });
    }
    catch (error) {
        console.error('Error fetching releases:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Import tracks for a specific label
router.post('/labels/:labelId/import', auth_1.verifyAdminToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log('Received import request for label:', req.params.labelId);
    try {
        const { labelId } = req.params;
        // Get the Spotify playlist ID for this label
        const labelQuery = 'SELECT spotify_playlist_id FROM labels WHERE id = $1';
        const labelResult = yield pool.query(labelQuery, [labelId]);
        if (!((_a = labelResult.rows[0]) === null || _a === void 0 ? void 0 : _a.spotify_playlist_id)) {
            return res.status(400).json({ error: 'No Spotify playlist ID found for this label' });
        }
        const playlistId = labelResult.rows[0].spotify_playlist_id;
        const spotifyApi = yield getSpotifyApi();
        // Get tracks from Spotify playlist
        const playlist = yield spotifyApi.playlists.getPlaylistItems(playlistId);
        // Process each track
        for (const item of playlist.items) {
            if (!item.track)
                continue;
            const track = item.track;
            // Get or create artist
            const artistResult = yield pool.query('INSERT INTO artists (name, spotify_id, label_id) VALUES ($1, $2, $3) ON CONFLICT (spotify_id) DO UPDATE SET name = $1 RETURNING id', [track.artists[0].name, track.artists[0].id, labelId]);
            // Get or create release
            const releaseResult = yield pool.query('INSERT INTO releases (name, spotify_id, label_id) VALUES ($1, $2, $3) ON CONFLICT (spotify_id) DO UPDATE SET name = $1 RETURNING id', [track.album.name, track.album.id, labelId]);
            // Insert track
            yield pool.query('INSERT INTO tracks (name, spotify_id, release_id, label_id) VALUES ($1, $2, $3, $4) ON CONFLICT (spotify_id) DO UPDATE SET name = $1', [track.name, track.id, releaseResult.rows[0].id, labelId]);
        }
        res.json({ success: true, message: 'Import completed successfully' });
    }
    catch (error) {
        console.error('Error importing tracks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Update a track
router.put('/tracks/:trackId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { trackId } = req.params;
        const updates = req.body;
        const query = `
      UPDATE tracks 
      SET ${Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ')}
      WHERE id = $1
      RETURNING *
    `;
        const values = [trackId, ...Object.values(updates)];
        const result = yield pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Track not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error updating track:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
// Get all tracks for a release
router.get('/releases/:releaseId/tracks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { releaseId } = req.params;
        const query = `
      SELECT t.*, a.name as artist_name
      FROM tracks t
      LEFT JOIN artists a ON t.artist_id = a.id
      WHERE t.release_id = $1
    `;
        const result = yield pool.query(query, [releaseId]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching release tracks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
