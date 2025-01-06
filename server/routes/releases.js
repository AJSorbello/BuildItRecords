const express = require('express');
const router = express.Router();
const { Release, Artist, Label, Track } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

// Error handler middleware
const handleError = (res, error) => {
  console.error('Releases API Error:', error);
  
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
    message: error.message
  });
};

// GET /api/releases/:labelId
router.get('/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    const { page = 1, limit = 10, sort = 'release_date', order = 'DESC' } = req.query;
    
    console.log('Fetching releases for label ID:', labelId);
    
    const label = await Label.findOne({
      where: {
        [Op.or]: [
          { id: labelId },
          { slug: { [Op.iLike]: labelId } }
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

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows: releases } = await Release.findAndCountAll({
      where: {
        label_id: label.id
      },
      include: [
        {
          model: Artist,
          as: 'primaryArtist'
        },
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] }
        },
        {
          model: Track,
          as: 'tracks'
        }
      ],
      order: [[sort, order]],
      limit: parseInt(limit),
      offset: offset
    });

    console.log(`Found ${count} releases for label ${label.name}`);

    return res.json({
      success: true,
      releases,
      totalReleases: count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      hasMore: offset + releases.length < count
    });

  } catch (error) {
    console.error('Error in GET /releases/:labelId:', error);
    return handleError(res, error);
  }
});

// GET /api/releases/:labelId/:releaseId
router.get('/:labelId/:releaseId', async (req, res) => {
  try {
    const { labelId, releaseId } = req.params;
    
    const release = await Release.findOne({
      where: {
        id: releaseId,
        labelId
      },
      include: [
        {
          model: Artist,
          as: 'primaryArtist',
          attributes: ['id', 'name', 'spotifyUrl', 'imageUrl']
        },
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] },
          attributes: ['id', 'name', 'spotifyUrl', 'imageUrl']
        },
        {
          model: Track,
          as: 'tracks',
          include: [
            {
              model: Artist,
              as: 'remixer',
              attributes: ['id', 'name', 'imageUrl']
            }
          ]
        },
        {
          model: Label,
          as: 'label',
          attributes: ['id', 'name', 'displayName', 'slug']
        }
      ]
    });

    if (!release) {
      return res.status(404).json({
        success: false,
        message: 'Release not found'
      });
    }

    res.json({
      success: true,
      release
    });
  } catch (error) {
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
          as: 'primaryArtist',
          attributes: ['id', 'name', 'spotifyUrl', 'imageUrl']
        },
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] },
          attributes: ['id', 'name', 'spotifyUrl', 'imageUrl']
        },
        {
          model: Track,
          as: 'tracks',
          include: [
            {
              model: Artist,
              as: 'remixer',
              attributes: ['id', 'name', 'imageUrl']
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
          attributes: ['id', 'name', 'spotify_url', 'images']
        },
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] },
          attributes: ['id', 'name', 'spotify_url', 'images']
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
    handleError(res, error);
  }
});

module.exports = router;
