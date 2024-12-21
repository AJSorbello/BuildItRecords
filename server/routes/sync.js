const express = require('express');
const router = express.Router();
const SyncService = require('../services/SyncService');

// POST /api/sync/label/:labelSlug
router.post('/label/:labelSlug', async (req, res) => {
  try {
    const { labelSlug } = req.params;
    const labelName = labelSlug.charAt(0).toUpperCase() + labelSlug.slice(1);
    const result = await SyncService.syncLabel(labelName, labelSlug);
    res.json(result);
  } catch (error) {
    console.error('Error syncing label:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/sync/all
router.post('/all', async (req, res) => {
  try {
    const results = await SyncService.syncAllLabels();
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error syncing all labels:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
