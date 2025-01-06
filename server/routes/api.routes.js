const express = require('express');
const router = express.Router();

// Import route handlers
const tracksRouter = require('./tracks');
const artistsRouter = require('./artists');
const releasesRouter = require('./releases');
const adminRouter = require('./admin');

// Mount routes
router.use('/tracks', tracksRouter);
router.use('/artists', artistsRouter);
router.use('/releases', releasesRouter);
router.use('/admin', adminRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
