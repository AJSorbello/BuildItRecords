const express = require('express');
const router = express.Router();
const { Release, Artist, Label } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

// GET /api/releases/:labelId
router.get('/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    console.log('Fetching releases for label ID:', labelId);
    
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
      return res.status(404).json({ success: false, message: 'Label not found' });
    }

    console.log('Found label:', label.name);
    
    const releases = await Release.findAll({
      where: {
        [Op.or]: [
          { label_id: label.id },
          { record_label: label.id }
        ]
      },
      include: [
        {
          model: Artist,
          as: 'artist',
          attributes: ['id', 'name', 'spotifyUrl']
        }
      ],
      order: [['releaseDate', 'DESC']]
    });

    console.log(`Found ${releases.length} releases for label ${label.name}`);
    
    // Transform the releases to match the frontend expected format
    const transformedReleases = releases.map(release => ({
      id: release.id,
      title: release.title,
      artist: release.artist ? {
        id: release.artist.id,
        name: release.artist.name,
        spotifyUrl: release.artist.spotifyUrl
      } : null,
      artworkUrl: release.artworkUrl,
      releaseDate: release.releaseDate,
      labelName: label.name,
      spotifyUrl: release.spotifyUrl
    }));

    res.json(transformedReleases);
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ success: false, message: 'Error fetching releases', error: error.message });
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
          as: 'artist',
          attributes: ['id', 'name', 'spotifyUrl', 'images']
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
        artist: release.artist,
        album: release.album,
        spotifyUrl: release.spotifyUrl,
        recordLabel: release.labelId
      }))
    });
  } catch (error) {
    console.error('Error fetching featured releases:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching featured releases',
      error: error.message 
    });
  }
});

module.exports = router;
