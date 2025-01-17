const express = require('express');
const router = express.Router();
const labelsRouter = require('./labels');
const { importTracksForLabel } = require('./labels');
const { Track, Artist, Release, Label } = require('../models');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.error('Invalid token:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  });
};

// Import route handlers
const tracksRouter = require('./tracks');
const artistsRouter = require('./artists');
const releasesRouter = require('./releases');
const adminRouter = require('./admin');

// Mount route handlers
router.use('/tracks', tracksRouter);
router.use('/labels', labelsRouter);
router.use('/artists', artistsRouter);
router.use('/releases', releasesRouter);
router.use('/admin', adminRouter);

// Import tracks for a label
router.post('/labels/:labelId/import', authenticateToken, async (req, res) => {
  const { labelId } = req.params;

  logger.info('Import route hit:', {
    url: req.url,
    method: req.method,
    labelId,
    params: req.params,
    token: req.headers.authorization ? 'present' : 'missing'
  });

  try {
    logger.info('Starting import process in API route', { labelId });
    const result = await importTracksForLabel(labelId);
    logger.info('Import completed successfully in API route', { result });
    res.json(result);
  } catch (error) {
    logger.error('Error in import route:', error);
    res.status(500).json({ 
      error: 'Failed to import tracks',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
