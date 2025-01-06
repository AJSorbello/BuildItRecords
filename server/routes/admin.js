const express = require('express');
const router = express.Router();
const { ImportLog, Label } = require('../models');
const SpotifyService = require('../services/spotifyService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Debug: Log environment variables
console.log('Environment variables loaded:', {
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  JWT_SECRET: process.env.JWT_SECRET
});

// In-memory admin credentials (replace with database in production)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH; // Store the hashed password in .env

// Create SpotifyService instance
const spotifyService = new SpotifyService({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { 
    receivedUsername: username,
    expectedUsername: ADMIN_USERNAME,
    receivedPassword: password,
    hasPasswordHash: !!ADMIN_PASSWORD_HASH
  });

  try {
    // Verify username
    if (username !== ADMIN_USERNAME) {
      console.log('Username mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    if (!ADMIN_PASSWORD_HASH) {
      console.error('No password hash configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!isValidPassword) {
      console.log('Password mismatch');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: ADMIN_USERNAME },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify admin token
router.get('/verify', verifyToken, (req, res) => {
  res.json({ message: 'Token is valid', user: req.user });
});

// Import Management Endpoints

// Get import status and logs
router.get('/imports', verifyToken, async (req, res) => {
  try {
    const { type, status, startDate, endDate, limit = 50 } = req.query;
    
    // Build query conditions
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.importedAt = {};
      if (startDate) where.importedAt[Op.gte] = new Date(startDate);
      if (endDate) where.importedAt[Op.lte] = new Date(endDate);
    }

    // Get import logs
    const logs = await ImportLog.findAll({
      where,
      order: [['importedAt', 'DESC']],
      limit: parseInt(limit)
    });

    // Get import statistics
    const stats = await ImportLog.findAll({
      attributes: [
        'type',
        'status',
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      where,
      group: ['type', 'status']
    });

    res.json({ logs, stats });
  } catch (error) {
    logger.error('Error fetching import logs:', error);
    res.status(500).json({ message: 'Error fetching import logs' });
  }
});

// Trigger new import for a label
router.post('/imports/:labelId', verifyToken, async (req, res) => {
  try {
    const { labelId } = req.params;
    
    // Get the label
    const label = await Label.findByPk(labelId);
    if (!label) {
      return res.status(404).json({ message: 'Label not found' });
    }

    // Initialize Spotify service
    const spotifyService = new SpotifyService(spotifyConfig);
    await spotifyService.initialize();

    // Start import in background
    res.json({ message: 'Import started' });

    // Import label data
    try {
      logger.info(`Starting import for label: ${label.name}`);
      const releases = await spotifyService.importLabelReleases(labelId, label.name);
      logger.info(`Successfully imported ${releases.length} releases for ${label.name}`);
    } catch (importError) {
      logger.error(`Import failed for label ${label.name}:`, importError);
    }
  } catch (error) {
    logger.error('Error starting import:', error);
    res.status(500).json({ message: 'Error starting import' });
  }
});

// Get import details for a specific item
router.get('/imports/:type/:spotifyId', verifyToken, async (req, res) => {
  try {
    const { type, spotifyId } = req.params;
    
    const logs = await ImportLog.findAll({
      where: { type, spotifyId },
      order: [['importedAt', 'DESC']]
    });

    res.json(logs);
  } catch (error) {
    logger.error('Error fetching import details:', error);
    res.status(500).json({ message: 'Error fetching import details' });
  }
});

// Get import logs
router.get('/import-logs', async (req, res) => {
  try {
    const logs = await ImportLog.findAll({
      order: [['created_at', 'DESC']],
      limit: 100
    });
    res.json(logs);
  } catch (error) {
    logger.error('Error fetching import logs:', error);
    res.status(500).json({ error: 'Failed to fetch import logs' });
  }
});

// Get labels
router.get('/labels', async (req, res) => {
  try {
    const labels = await Label.findAll({
      order: [['name', 'ASC']]
    });
    res.json(labels);
  } catch (error) {
    logger.error('Error fetching labels:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
});

// Import releases from Spotify
router.get('/import-releases/:labelId', verifyToken, async (req, res) => {
  try {
    const { labelId } = req.params;
    console.log('Starting import for label:', labelId);
    
    // Find the label
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
        message: `No label found with ID or slug: ${labelId}`
      });
    }

    console.log('Found label:', label.name);

    // Initialize Spotify service if needed
    if (!spotifyService.isInitialized()) {
      console.log('Initializing Spotify service...');
      await spotifyService.initialize();
    }

    // Create import log
    const importLog = await ImportLog.create({
      label_id: label.id,
      status: 'started',
      type: 'spotify',
      message: `Starting import for ${label.name}`
    });

    try {
      // Import releases using predefined IDs
      console.log('Starting release import...');
      const releases = await spotifyService.importReleases(label);
      console.log(`Imported ${releases.length} releases`);

      // Update import log
      await importLog.update({
        status: 'completed',
        message: `Successfully imported ${releases.length} releases`
      });

      res.json({
        success: true,
        message: `Successfully imported ${releases.length} releases`,
        data: releases
      });
    } catch (error) {
      console.error('Import error:', error);
      
      // Update import log with error
      await importLog.update({
        status: 'failed',
        message: `Import failed: ${error.message}`
      });

      throw error;
    }
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
});

module.exports = router;
