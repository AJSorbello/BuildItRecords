const express = require('express');
const router = express.Router();

// Import individual API handlers
const artistHandler = require('../api/artist');
const artistReleasesHandler = require('../api/artist-releases');
const inspectSchemaHandler = require('../api/inspect-schema');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Artist routes (support both singular and plural forms)
router.get('/artist', (req, res) => artistHandler(req, res));
router.get('/artists', (req, res) => artistHandler(req, res));

// Artist by ID routes (support both singular and plural forms)
router.get('/artist/:id', (req, res) => {
  const artistId = req.params.id;
  return artistHandler(req, res, artistId);
});
router.get('/artists/:id', (req, res) => {
  const artistId = req.params.id;
  return artistHandler(req, res, artistId);
});

// Artist releases routes (support both singular and plural forms)
router.get('/artist-releases/:artistId', (req, res) => {
  const artistId = req.params.artistId;
  console.log(`[routes] Handling artist releases request for ${artistId}`);
  return artistReleasesHandler(req, res, artistId);
});
router.get('/artists/:artistId/releases', (req, res) => {
  const artistId = req.params.artistId;
  console.log(`[routes] Handling artist releases (plural) request for ${artistId}`);
  return artistReleasesHandler(req, res, artistId);
});

// Schema inspection endpoint
router.get('/inspect-schema', (req, res) => inspectSchemaHandler(req, res));

module.exports = router;
