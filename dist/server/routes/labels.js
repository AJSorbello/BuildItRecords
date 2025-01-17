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
const spotifyService = require('../services/spotifyService');
const { models, sequelize } = require('../utils/db');
const { verifyToken } = require('./admin');

// Debug: Log available models
console.log('Available models in labels.js:', {
    Artist: !!models.Artist,
    Label: !!models.Label,
    Release: !!models.Release,
    Track: !!models.Track,
    ImportLog: !!models.ImportLog,
    ReleaseArtist: !!models.ReleaseArtist,
    TrackArtist: !!models.TrackArtist
});
// Debug: Log model methods
console.log('Model methods in labels.js:', {
    Artist: models.Artist ? Object.keys(models.Artist) : null,
    Label: models.Label ? Object.keys(models.Label) : null,
    Release: models.Release ? Object.keys(models.Release) : null,
    Track: models.Track ? Object.keys(models.Track) : null,
    ImportLog: models.ImportLog ? Object.keys(models.ImportLog) : null,
    ReleaseArtist: models.ReleaseArtist ? Object.keys(models.ReleaseArtist) : null,
    TrackArtist: models.TrackArtist ? Object.keys(models.TrackArtist) : null
});
const axios = require('axios');
// Import function
function importTracksForLabel(labelId) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting import process for label:', labelId);
        try {
            console.log('Label model available:', !!models.Label);
            const label = yield models.Label.findByPk(labelId);
            if (!label) {
                throw new Error(`Label not found: ${labelId}`);
            }

            // Initialize Spotify service if needed
            if (!spotifyService.isInitialized()) {
                yield spotifyService.initialize();
            }

            const token = yield spotifyService.getServerSideToken();
            console.log('Got Spotify token');
            const tracks = yield spotifyService.getPlaylistTracks(label.spotify_playlist_id);
            console.log(`Found ${tracks.length} tracks for label: ${label.name}`);
            const result = yield sequelize.transaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const importedTracks = [];
                for (const track of tracks) {
                    console.log('Processing track:', track.id, track.name);
                    console.log('Release model available:', !!models.Release);
                    // Create or update release (album)
                    const [releaseRecord] = yield models.Release.findOrCreate({
                        where: { id: track.album.id },
                        defaults: {
                            id: track.album.id,
                            name: track.album.name,
                            title: track.album.name,
                            release_date: track.album.release_date,
                            artwork_url: (_a = track.album.images[0]) === null || _a === void 0 ? void 0 : _a.url,
                            spotify_url: track.album.external_urls.spotify,
                            spotify_uri: track.album.uri,
                            label_id: labelId,
                            total_tracks: track.album.total_tracks,
                            status: 'published'
                        },
                        transaction
                    });
                    console.log('Track model available:', !!models.Track);
                    // Create or update track
                    const [newTrack] = yield models.Track.findOrCreate({
                        where: { id: track.id },
                        defaults: {
                            id: track.id,
                            name: track.name,
                            duration: track.duration_ms,
                            track_number: track.track_number,
                            disc_number: track.disc_number,
                            preview_url: track.preview_url,
                            spotify_url: track.external_urls.spotify,
                            spotify_uri: track.uri,
                            release_id: releaseRecord.id,
                            label_id: labelId
                        },
                        transaction
                    });
                    importedTracks.push(newTrack);
                    // Process artists
                    for (const artist of track.artists) {
                        console.log('Processing artist:', artist.id, artist.name);
                        console.log('Artist model available:', !!models.Artist);
                        // Create or update artist
                        const [artistRecord] = yield models.Artist.findOrCreate({
                            where: { id: artist.id },
                            defaults: {
                                id: artist.id,
                                name: artist.name,
                                spotify_url: artist.external_urls.spotify,
                                spotify_uri: artist.uri
                            },
                            transaction
                        });
                        console.log('Creating track-artist association:', {
                            track_id: newTrack.id,
                            artist_id: artistRecord.id,
                            TrackArtist: !!models.TrackArtist,
                            TrackArtistMethods: models.TrackArtist ? Object.keys(models.TrackArtist) : null
                        });
                        // Link artist to track
                        yield models.TrackArtist.create({
                            track_id: newTrack.id,
                            artist_id: artistRecord.id
                        }, { transaction });
                    }
                }
                return importedTracks;
            }));
            console.log(`Successfully imported ${result.length} tracks`);
            return result;
        }
        catch (error) {
            console.error('Error in importTracksForLabel:', error);
            throw error;
        }
    });
}
// Import tracks for a label
router.post('/:labelId/import', verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Import endpoint hit:', {
        method: 'POST',
        url: req.url,
        params: req.params,
        labelId: req.params.labelId,
        token: req.headers.authorization ? 'present' : 'missing'
    });
    try {
        const tracks = yield importTracksForLabel(req.params.labelId);
        res.json({ tracks, message: 'Import successful' });
    }
    catch (error) {
        console.error('Error in import route:', error);
        res.status(500).json({ error: error.message });
    }
}));
// Get all labels
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const labels = yield models.Label.findAll();
        res.json(labels);
    }
    catch (error) {
        console.error('Error fetching labels:', error);
        res.status(500).json({ error: error.message });
    }
}));
// Get label statistics
router.get('/stats', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield models.Label.findAll({
            attributes: [
                'name',
                [sequelize.fn('COUNT', sequelize.col('releases.id')), 'releaseCount'],
                [sequelize.fn('COUNT', sequelize.col('tracks.id')), 'trackCount'],
                [sequelize.fn('COUNT', sequelize.col('artists.id')), 'artistCount']
            ],
            include: [
                { model: models.Release, as: 'releases', attributes: [] },
                { model: models.Track, as: 'tracks', attributes: [] },
                { model: models.Artist, as: 'artists', attributes: [] }
            ],
            group: ['Label.id', 'Label.name']
        });
        res.json(stats);
    }
    catch (error) {
        console.error('Error getting label stats:', error);
        res.status(500).json({ error: error.message });
    }
}));
// Get tracks for a label
router.get('/:labelId/tracks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tracks = yield models.Track.findAll({
            where: { label_id: req.params.labelId },
            include: [
                {
                    model: models.Artist,
                    as: 'artists',
                    through: { attributes: [] }
                },
                {
                    model: models.Release,
                    as: 'release'
                }
            ]
        });
        res.json(tracks);
    }
    catch (error) {
        console.error('Error fetching tracks for label:', error);
        res.status(500).json({ error: error.message });
    }
}));
module.exports = {
    router,
    importTracksForLabel
};
