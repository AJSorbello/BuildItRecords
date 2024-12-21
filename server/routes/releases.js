const express = require('express');
const router = express.Router();
const { Release, Artist, Label } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

// GET /api/releases/:labelSlug
router.get('/:labelSlug', async (req, res) => {
  try {
    const { labelSlug } = req.params;
    console.log('Fetching releases for label slug:', labelSlug);
    
    // Map the slugs to label names
    const labelMap = {
      'build-it-records': 'Build It Records',
      'build-it-tech': 'Build It Tech',
      'build-it-deep': 'Build It Deep'
    };

    const labelName = labelMap[labelSlug];
    if (!labelName) {
      console.log('Invalid label slug:', labelSlug);
      return res.status(404).json({ success: false, message: 'Invalid label' });
    }
    
    const label = await Label.findOne({
      where: {
        name: labelName
      }
    });

    if (!label) {
      console.log('Label not found:', labelName);
      return res.status(404).json({ success: false, message: 'Label not found' });
    }

    console.log('Found label:', label.name, 'with ID:', label.id);
    
    const releases = await Release.findAll({
      where: {
        labelId: label.id
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
      artist: {
        name: release.artist.name,
        spotifyUrl: release.artist.spotifyUrl
      },
      imageUrl: release.albumArtUrl || release.artworkUrl,
      releaseDate: release.releaseDate,
      genre: release.genre,
      labelName: label.name,
      label: label.name,
      stores: {
        spotify: release.spotifyUrl,
        beatport: release.beatportUrl,
        soundcloud: release.soundcloudUrl
      },
      spotifyUrl: release.spotifyUrl
    }));

    res.json(transformedReleases);
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ success: false, message: error.message });
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
        recordLabel: labelId
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
        recordLabel: release.recordLabel
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
