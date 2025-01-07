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

// GET /api/releases/:labelId
router.get('/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    const { page = 1, limit = 10, sort = 'release_date', order = 'DESC' } = req.query;
    
    console.log('Fetching releases for label ID:', labelId);
    
    // Find the label by ID or slug
    const label = await Label.findOne({
      where: {
        [Op.or]: [
          { id: labelId },
          { slug: labelId }
        ]
      }
    });

    if (!label) {
      console.log('Label not found:', labelId);
      return res.status(404).json({ 
        success: false, 
        error: 'Label not found',
        message: `No label found with ID or slug: ${labelId}`,
        releases: [],
        totalReleases: 0
      });
    }

    console.log('Found label:', label.toJSON());

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('Querying database for releases with params:', {
      labelId: label.id,
      page,
      limit,
      offset,
      sort,
      order
    });

    // Get releases from database
    const { count, rows: releases } = await Release.findAndCountAll({
      where: {
        label_id: label.id
      },
      include: [
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] },
          attributes: ['id', 'name', 'spotify_url', 'profile_image']
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
              attributes: ['id', 'name', 'spotify_url', 'profile_image']
            }
          ]
        }
      ],
      order: [[sort, order]],
      limit: parseInt(limit),
      offset: offset
    });

    console.log(`Found ${count} releases in database`);

    // Format the response
    const formattedReleases = releases.map(release => ({
      id: release.id,
      name: release.name,
      title: release.name,
      releaseDate: release.release_date,
      artworkUrl: release.artwork_url,
      spotifyUrl: release.spotify_url,
      total_tracks: release.total_tracks,
      artists: release.artists,
      tracks: release.tracks,
      external_urls: {
        spotify: release.spotify_url
      },
      uri: release.spotify_uri,
      type: 'release'
    }));

    return res.json({
      success: true,
      releases: formattedReleases,
      totalReleases: count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      hasMore: offset + releases.length < count
    });

  } catch (error) {
    console.error('Error in GET /releases/:labelId:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
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

module.exports = router;
