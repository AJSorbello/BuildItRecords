const express = require('express');
const router = express.Router();
const { ImportLog, Label } = require('../models');
const SpotifyService = require('../services/spotifyService');
const spotifyConfig = require('../config/spotify');
const logger = require('../config/logger');
const { Op } = require('sequelize');

// In-memory admin credentials (replace with database in production)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH; // Store the hashed password in .env

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

  try {
    // Verify username
    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
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
router.get('/import-releases/:labelId', async (req, res) => {
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
      return res.status(404).json({ 
        success: false, 
        error: 'Label not found' 
      });
    }

    // Initialize Spotify service
    const spotifyService = new SpotifyService({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    });

    // Log the import attempt
    const importLog = await ImportLog.create({
      label_id: label.id,
      status: 'started',
      message: `Starting import for ${label.name}`
    });

    try {
      // Import releases from Spotify
      const result = await spotifyService.importReleases(label);
      
      // Update import log with success
      await importLog.update({
        status: 'completed',
        message: `Successfully imported ${result.length} releases for ${label.name}`,
        completed_at: new Date()
      });

      res.json({
        success: true,
        message: `Successfully imported ${result.length} releases`,
        releases: result
      });
    } catch (error) {
      // Update import log with error
      await importLog.update({
        status: 'failed',
        message: `Import failed: ${error.message}`,
        completed_at: new Date()
      });
      throw error;
    }
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to import releases'
    });
  }
});

module.exports = router;
