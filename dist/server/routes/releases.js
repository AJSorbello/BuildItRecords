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
const { Release, Artist, Track, Label } = require('../models');
const { Op } = require('sequelize');
const { query, validationResult } = require('express-validator');
const { logger } = require('../../src/utils/logger');
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
// Get releases by label ID with pagination
router.get('/', [
    query('labelId').optional().isString(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    validateRequest
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { labelId, offset = 0, limit = 10 } = req.query;
        const where = {};
        if (labelId) {
            where.label_id = labelId;
        }
        const releases = yield Release.findAndCountAll({
            where,
            include: [
                {
                    model: Artist,
                    as: 'artists',
                    through: { attributes: [] }
                },
                {
                    model: Track,
                    as: 'tracks'
                },
                {
                    model: Label,
                    as: 'label'
                }
            ],
            order: [['release_date', 'DESC']],
            offset: parseInt(offset),
            limit: parseInt(limit)
        });
        res.json({
            items: releases.rows,
            total: releases.count,
            offset: parseInt(offset),
            limit: parseInt(limit)
        });
    }
    catch (error) {
        logger.error('Error fetching releases:', error);
        res.status(500).json({ error: error.message });
    }
}));
// Get a single release by ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const release = yield Release.findByPk(req.params.id, {
            include: [
                {
                    model: Artist,
                    as: 'artists',
                    through: { attributes: [] }
                },
                {
                    model: Track,
                    as: 'tracks',
                    include: [
                        {
                            model: Artist,
                            as: 'artists',
                            through: { attributes: [] }
                        }
                    ]
                },
                {
                    model: Label,
                    as: 'label'
                }
            ]
        });
        if (!release) {
            return res.status(404).json({ error: 'Release not found' });
        }
        res.json(release);
    }
    catch (error) {
        logger.error('Error fetching release:', error);
        res.status(500).json({ error: error.message });
    }
}));
// Import releases from Spotify
router.post('/:labelId/import', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { labelId } = req.params;
        // Find the label
        const label = yield Label.findOne({
            where: {
                [Op.or]: [
                    { id: labelId },
                    { slug: labelId }
                ]
            }
        });
        if (!label) {
            return res.status(404).json({ error: 'Label not found' });
        }
        // Initialize Spotify service
        const spotifyService = new SpotifyService(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET, process.env.SPOTIFY_REDIRECT_URI);
        // Search and import releases
        console.log('Starting Spotify search for label:', label.name);
        const albums = yield spotifyService.searchAlbumsByLabel(label.name);
        console.log(`Found ${albums.length} releases, starting import...`);
        // Use a transaction to ensure data consistency
        const result = yield sequelize.transaction((t) => __awaiter(void 0, void 0, void 0, function* () {
            // Import the releases
            yield spotifyService.importReleases(label, albums, t);
            // Return the imported releases
            const { count, rows: releases } = yield Release.findAndCountAll({
                where: { label_id: label.id },
                include: [
                    {
                        model: Artist,
                        as: 'artists',
                        through: { attributes: [] }
                    },
                    {
                        model: Track,
                        as: 'tracks',
                        include: [
                            {
                                model: Artist,
                                as: 'artists',
                                through: { attributes: [] }
                            }
                        ]
                    }
                ],
                order: [['release_date', 'DESC']],
                transaction: t
            });
            return { count, releases };
        }));
        console.log(`Successfully imported ${result.count} releases for label: ${label.name}`);
        res.json({
            success: true,
            message: `Successfully imported ${albums.length} releases`,
            totalReleases: result.count,
            releases: result.releases
        });
    }
    catch (error) {
        console.error('Error importing releases:', error);
        logger.error('Error importing releases:', error);
        handleError(res, error);
    }
}));
// GET /api/releases/:labelId
router.get('/:labelId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { labelId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        // Find the label
        const label = yield Label.findOne({
            where: {
                [Op.or]: [
                    { id: labelId },
                    { slug: labelId }
                ]
            }
        });
        if (!label) {
            return res.status(404).json({ error: 'Label not found' });
        }
        // Get releases from database with pagination
        const { count, rows: releases } = yield Release.findAndCountAll({
            where: { label_id: label.id },
            include: [
                {
                    model: Artist,
                    as: 'artists',
                    through: { attributes: [] }
                },
                {
                    model: Track,
                    as: 'tracks',
                    include: [
                        {
                            model: Artist,
                            as: 'artists',
                            through: { attributes: [] }
                        }
                    ]
                }
            ],
            order: [['release_date', 'DESC']],
            limit,
            offset
        });
        // Transform the releases to include all necessary data
        const transformedReleases = releases.map(release => {
            const releaseJson = release.toJSON();
            return Object.assign(Object.assign({}, releaseJson), { artists: releaseJson.artists.map(artist => ({
                    id: artist.id,
                    name: artist.name
                })), albumCover: releaseJson.artworkUrl || releaseJson.artwork, tracks: releaseJson.tracks.map(track => (Object.assign(Object.assign({}, track), { artists: track.artists.map(artist => ({
                        id: artist.id,
                        name: artist.name
                    })) }))) });
        });
        console.log('Transformed releases:', JSON.stringify(transformedReleases, null, 2));
        res.json({
            releases: transformedReleases,
            totalReleases: count,
            currentPage: page,
            totalPages: Math.ceil(count / limit)
        });
    }
    catch (error) {
        console.error('Error fetching releases:', error);
        logger.error('Error fetching releases:', error);
        handleError(res, error);
    }
}));
// GET /api/releases/:labelId/:releaseId
router.get('/:labelId/:releaseId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { labelId, releaseId } = req.params;
        const release = yield Release.findOne({
            where: {
                id: releaseId,
                label_id: labelId
            },
            include: [
                {
                    model: Artist,
                    as: 'artists',
                    through: { attributes: ['role'] },
                    attributes: ['id', 'name', 'spotify_url']
                },
                {
                    model: Track,
                    as: 'tracks',
                    attributes: ['id', 'name', 'duration', 'preview_url', 'spotify_url', 'track_number'],
                    order: [['track_number', 'ASC']]
                }
            ]
        });
        if (!release) {
            return res.status(404).json({
                success: false,
                error: 'Release not found'
            });
        }
        res.json({
            success: true,
            release: {
                id: release.id,
                name: release.name,
                release_date: release.release_date,
                artwork_url: release.artwork_url,
                spotify_url: release.spotify_url,
                total_tracks: release.total_tracks,
                artists: release.artists,
                tracks: release.tracks
            }
        });
    }
    catch (error) {
        console.error('Error in GET /releases/:labelId/:releaseId:', error);
        logger.error('Error in GET /releases/:labelId/:releaseId:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            code: error.code
        });
        handleError(res, error);
    }
}));
// POST /api/releases
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield sequelize.transaction();
    try {
        const { release, artists, tracks } = req.body;
        // Create release
        const newRelease = yield Release.create(release, { transaction });
        // Create or find artists and associate with release
        for (const artistData of artists) {
            const [artist] = yield Artist.findOrCreate({
                where: { id: artistData.id },
                defaults: artistData,
                transaction
            });
            yield newRelease.addArtist(artist, { transaction });
        }
        // Create tracks
        for (const trackData of tracks) {
            const track = yield Track.create(Object.assign(Object.assign({}, trackData), { releaseId: newRelease.id }), { transaction });
            if (trackData.remixer) {
                const [remixer] = yield Artist.findOrCreate({
                    where: { id: trackData.remixer.id },
                    defaults: trackData.remixer,
                    transaction
                });
                yield track.setRemixer(remixer, { transaction });
            }
        }
        yield transaction.commit();
        // Fetch the complete release with associations
        const completeRelease = yield Release.findByPk(newRelease.id, {
            include: [
                {
                    model: Artist,
                    as: 'artists',
                    through: { attributes: ['role'] },
                    attributes: ['id', 'name', 'spotify_url']
                },
                {
                    model: Track,
                    as: 'tracks',
                    attributes: ['id', 'name', 'duration', 'preview_url', 'spotify_url', 'track_number'],
                    include: [
                        {
                            model: Artist,
                            as: 'artists',
                            through: { attributes: [] },
                            attributes: ['id', 'name', 'spotify_url']
                        }
                    ]
                }
            ]
        });
        res.status(201).json({
            success: true,
            message: 'Release created successfully',
            release: completeRelease
        });
    }
    catch (error) {
        console.error('Error in POST /releases:', error);
        logger.error('Error in POST /releases:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            code: error.code
        });
        yield transaction.rollback();
        handleError(res, error);
    }
}));
// GET /api/releases/featured
router.get('/featured', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { label } = req.query;
        if (!label) {
            return res.status(400).json({
                success: false,
                message: 'Label parameter is required'
            });
        }
        // Convert label query param to actual label ID
        const labelMap = {
            'records': 'build-it-records',
            'tech': 'build-it-tech',
            'deep': 'build-it-deep'
        };
        const labelId = labelMap[label];
        if (!labelId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid label'
            });
        }
        // Get the 6 most recent releases for this label
        const releases = yield Release.findAll({
            where: {
                [Op.or]: [
                    { label_id: labelId },
                    { record_label: labelId }
                ]
            },
            include: [
                {
                    model: Artist,
                    as: 'primaryArtist',
                    attributes: ['id', 'name', 'spotify_url']
                },
                {
                    model: Artist,
                    as: 'artists',
                    through: { attributes: [] },
                    attributes: ['id', 'name', 'spotify_url']
                }
            ],
            order: [
                [sequelize.fn('RANDOM')] // Randomly select releases
            ],
            limit: 6
        });
        res.json({
            success: true,
            releases: releases.map(release => ({
                id: release.id,
                name: release.name,
                trackTitle: release.trackTitle,
                artist: release.primaryArtist,
                album: release.album,
                spotifyUrl: release.spotify_url,
                recordLabel: release.labelId
            }))
        });
    }
    catch (error) {
        console.error('Error in GET /releases/featured:', error);
        logger.error('Error in GET /releases/featured:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            code: error.code
        });
        handleError(res, error);
    }
}));
// Get all releases with pagination
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { labelId } = req.query;
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const where = {};
        if (labelId) {
            where.label_id = labelId;
        }
        const { count, rows } = yield Release.findAndCountAll({
            where,
            include: [
                {
                    model: Artist,
                    as: 'artists',
                    through: { attributes: [] }
                },
                {
                    model: Track,
                    as: 'tracks'
                },
                {
                    model: Label,
                    as: 'label'
                }
            ],
            order: [['release_date', 'DESC']],
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
        console.error('Error fetching releases:', error);
        logger.error('Error fetching releases:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching releases',
            error: error.message
        });
    }
}));
// Get a specific release by ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const release = yield Release.findByPk(req.params.id, {
            include: [
                {
                    model: Artist,
                    as: 'artists',
                    through: { attributes: [] }
                },
                {
                    model: Track,
                    as: 'tracks'
                },
                {
                    model: Label,
                    as: 'label'
                }
            ]
        });
        if (!release) {
            return res.status(404).json({
                success: false,
                message: 'Release not found'
            });
        }
        res.json(release);
    }
    catch (error) {
        console.error('Error fetching release:', error);
        logger.error('Error fetching release:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching release',
            error: error.message
        });
    }
}));
// Get release by ID
router.get('/:releaseId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { releaseId } = req.params;
        const { rows } = yield sequelize.query('SELECT * FROM releases WHERE id = $1', {
            replacements: [releaseId],
            type: sequelize.QueryTypes.SELECT
        });
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Release not found' });
        }
        res.json(rows[0]);
    }
    catch (error) {
        console.error('Error fetching release:', error);
        logger.error('Error fetching release:', error);
        res.status(500).json({ error: 'Failed to fetch release' });
    }
}));
// Get release's tracks
router.get('/:releaseId/tracks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { releaseId } = req.params;
        const { rows: tracks } = yield sequelize.query('SELECT * FROM tracks WHERE release_id = $1 ORDER BY track_number ASC', {
            replacements: [releaseId],
            type: sequelize.QueryTypes.SELECT
        });
        res.json({ tracks });
    }
    catch (error) {
        console.error('Error fetching release tracks:', error);
        logger.error('Error fetching release tracks:', error);
        res.status(500).json({ error: 'Failed to fetch release tracks' });
    }
}));
module.exports = router;
