const express = require('express');
const router = express.Router();
const { Release, Artist, Label, Track } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');
const SpotifyService = require('../services/spotifyService');
require('dotenv').config();

// Create spotify config from environment variables
const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
};

// Initialize SpotifyService with config
const spotifyService = new SpotifyService(
  process.env.SPOTIFY_CLIENT_ID,
  process.env.SPOTIFY_CLIENT_SECRET,
  process.env.SPOTIFY_REDIRECT_URI
);

// Debug: Log Spotify config (without sensitive data)
console.log('Spotify config loaded:', {
  hasClientId: !!spotifyConfig.clientId,
  hasClientSecret: !!spotifyConfig.clientSecret,
  redirectUri: spotifyConfig.redirectUri
});

// Error handler middleware
const handleError = (res, error) => {
  console.error('Releases API Error:', error);
  console.error('Error stack:', error.stack);
  
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

// Import releases from Spotify
router.post('/:labelId/import', async (req, res) => {
  try {
    const { labelId } = req.params;
    
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
      return res.status(404).json({ error: 'Label not found' });
    }

    // Initialize Spotify service
    const spotifyService = new SpotifyService(
      process.env.SPOTIFY_CLIENT_ID,
      process.env.SPOTIFY_CLIENT_SECRET,
      process.env.SPOTIFY_REDIRECT_URI
    );

    // Search and import releases
    console.log('Starting Spotify search for label:', label.name);
    const albums = await spotifyService.searchAlbumsByLabel(label.name);
    console.log(`Found ${albums.length} releases, starting import...`);

    // Use a transaction to ensure data consistency
    const result = await sequelize.transaction(async (t) => {
      // Import the releases
      await spotifyService.importReleases(label, albums, t);

      // Return the imported releases
      const { count, rows: releases } = await Release.findAndCountAll({
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
    });

    console.log(`Successfully imported ${result.count} releases for label: ${label.name}`);

    res.json({
      success: true,
      message: `Successfully imported ${albums.length} releases`,
      totalReleases: result.count,
      releases: result.releases
    });

  } catch (error) {
    console.error('Error importing releases:', error);
    handleError(res, error);
  }
});

// GET /api/releases/:labelId
router.get('/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
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
      return res.status(404).json({ error: 'Label not found' });
    }

    // Get releases from database with pagination
    const { count, rows: releases } = await Release.findAndCountAll({
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
      return {
        ...releaseJson,
        artists: releaseJson.artists.map(artist => ({
          id: artist.id,
          name: artist.name
        })),
        albumCover: releaseJson.artworkUrl || releaseJson.artwork,
        tracks: releaseJson.tracks.map(track => ({
          ...track,
          artists: track.artists.map(artist => ({
            id: artist.id,
            name: artist.name
          }))
        }))
      };
    });

    console.log('Transformed releases:', JSON.stringify(transformedReleases, null, 2));

    res.json({
      releases: transformedReleases,
      totalReleases: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error fetching releases:', error);
    handleError(res, error);
  }
});

// GET /api/releases/:labelId/:releaseId
router.get('/:labelId/:releaseId', async (req, res) => {
  try {
    const { labelId, releaseId } = req.params;
    
    const release = await Release.findOne({
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
  } catch (error) {
    console.error('Error in GET /releases/:labelId/:releaseId:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    handleError(res, error);
  }
});

// POST /api/releases
router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { release, artists, tracks } = req.body;
    
    // Create release
    const newRelease = await Release.create(release, { transaction });
    
    // Create or find artists and associate with release
    for (const artistData of artists) {
      const [artist] = await Artist.findOrCreate({
        where: { id: artistData.id },
        defaults: artistData,
        transaction
      });
      await newRelease.addArtist(artist, { transaction });
    }
    
    // Create tracks
    for (const trackData of tracks) {
      const track = await Track.create({
        ...trackData,
        releaseId: newRelease.id
      }, { transaction });
      
      if (trackData.remixer) {
        const [remixer] = await Artist.findOrCreate({
          where: { id: trackData.remixer.id },
          defaults: trackData.remixer,
          transaction
        });
        await track.setRemixer(remixer, { transaction });
      }
    }
    
    await transaction.commit();
    
    // Fetch the complete release with associations
    const completeRelease = await Release.findByPk(newRelease.id, {
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
  } catch (error) {
    console.error('Error in POST /releases:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    await transaction.rollback();
    handleError(res, error);
  }
});

// GET /api/releases/featured
router.get('/featured', async (req, res) => {
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
    const releases = await Release.findAll({
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
  } catch (error) {
    console.error('Error in GET /releases/featured:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    handleError(res, error);
  }
});

// Get all releases
router.get('/', async (req, res) => {
  try {
    const { labelId, artistId } = req.query;
    let queryText = 'SELECT * FROM releases';
    const queryParams = [];

    if (labelId || artistId) {
      queryText += ' WHERE';
      if (labelId) {
        queryText += ' label_id = $1';
        queryParams.push(labelId);
      }
      if (artistId) {
        if (labelId) queryText += ' AND';
        queryText += ` artist_id = $${queryParams.length + 1}`;
        queryParams.push(artistId);
      }
    }

    queryText += ' ORDER BY release_date DESC';

    const { rows: releases } = await sequelize.query(queryText, {
      replacements: queryParams,
      type: sequelize.QueryTypes.SELECT
    });
    res.json(releases);
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ error: 'Failed to fetch releases' });
  }
});

// Get release by ID
router.get('/:releaseId', async (req, res) => {
  try {
    const { releaseId } = req.params;
    
    const { rows } = await sequelize.query(
      'SELECT * FROM releases WHERE id = $1',
      {
        replacements: [releaseId],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Release not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching release:', error);
    res.status(500).json({ error: 'Failed to fetch release' });
  }
});

// Get release's tracks
router.get('/:releaseId/tracks', async (req, res) => {
  try {
    const { releaseId } = req.params;
    
    const { rows: tracks } = await sequelize.query(
      'SELECT * FROM tracks WHERE release_id = $1 ORDER BY track_number ASC',
      {
        replacements: [releaseId],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    res.json({ tracks });
  } catch (error) {
    console.error('Error fetching release tracks:', error);
    res.status(500).json({ error: 'Failed to fetch release tracks' });
  }
});

module.exports = router;
