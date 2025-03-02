const express = require('express');
const router = express.Router();

router.get('/health-check', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.1.0'
  });
});

module.exports = router;
