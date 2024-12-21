const express = require('express');
const router = express.Router();
const SpotifyService = require('../services/SpotifyService');
const { Label } = require('../models');

// Create a new instance of SpotifyService
const spotifyService = new SpotifyService();

// POST /api/sync/label/:id
router.post('/label/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the label
    const label = await Label.findByPk(id);
    if (!label) {
      return res.status(404).json({ 
        success: false, 
        message: `Label with id "${id}" not found` 
      });
    }

    // Sync artists and tracks for this label
    const results = await spotifyService.syncLabelArtists(id);
    
    return res.json({ 
      success: true, 
      message: `Successfully synced ${results.artists.length} artists and ${results.tracks.length} tracks for ${label.displayName}`,
      data: results
    });
  } catch (error) {
    console.error('Error in sync route:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'An error occurred while syncing data'
    });
  }
});

// POST /api/sync/label/:labelId/tracks
router.post('/label/:labelId/tracks', async (req, res) => {
  try {
    const { labelId } = req.params;
    const results = await spotifyService.syncAllLabelTracks(labelId);
    res.json({
      success: true,
      message: `Successfully synced ${results.artists.length} artists and ${results.tracks.length} tracks`,
      data: results
    });
  } catch (error) {
    console.error('Error syncing label tracks:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing label tracks',
      error: error.message
    });
  }
});

// POST /api/sync/track/:id
router.post('/track/:id', async (req, res) => {
  try {
    const results = await spotifyService.syncLabelFromTrack(req.params.id);
    return res.json({ 
      success: true, 
      message: `Successfully synced ${results.artists.length} artists and ${results.tracks.length} tracks`,
      data: results
    });
  } catch (error) {
    console.error('Error in sync track route:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'An error occurred while syncing track'
    });
  }
});

// POST /api/sync/all
router.post('/all', async (req, res) => {
  try {
    const labels = await Label.findAll();
    const results = [];

    for (const label of labels) {
      try {
        const labelResults = await spotifyService.syncLabelArtists(label.id);
        results.push({
          label: label.displayName,
          success: true,
          artists: labelResults.artists.length,
          tracks: labelResults.tracks.length
        });
      } catch (error) {
        console.error(`Error syncing label ${label.displayName}:`, error);
        results.push({
          label: label.displayName,
          success: false,
          error: error.message
        });
      }
    }

    return res.json({
      success: true,
      message: 'Sync completed',
      results
    });
  } catch (error) {
    console.error('Error in sync all route:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while syncing all labels'
    });
  }
});

module.exports = router;
