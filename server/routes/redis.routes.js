const express = require('express');
const router = express.Router();

// Redis Routes
router.get('/tracks/:label', async (req, res) => {
  try {
    const redisService = req.app.get('redisService');
    const { label } = req.params;
    const { query, minPopularity } = req.query;

    let tracks;
    if (query) {
      // Use search capabilities if query is provided
      tracks = await redisService.searchTracks(query, { 
        label, 
        minPopularity: parseInt(minPopularity) || 0 
      });
    } else {
      // Otherwise get cached tracks by label
      tracks = await redisService.getCacheByLabel(`tracks:${label}`);
    }

    if (!tracks) {
      return res.status(404).json({ message: 'No tracks found' });
    }
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/tracks', async (req, res) => {
  try {
    const redisService = req.app.get('redisService');
    const { label, tracks, duration } = req.body;

    if (!label || !tracks || !duration) {
      return res.status(400).json({ message: 'Missing required fields: label, tracks, or duration' });
    }

    // Store tracks both as JSON and in label cache
    await redisService.batchSetTracks(tracks);
    await redisService.setCacheWithLabel(`tracks:${label}`, tracks, label);

    // Track popularity for time series
    for (const track of tracks) {
      await redisService.trackPopularityTS(track.id, track.popularity);
    }

    res.json({ message: 'Tracks cached successfully' });
  } catch (error) {
    console.error('Error caching tracks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/track/:trackId', async (req, res) => {
  try {
    const redisService = req.app.get('redisService');
    const { trackId } = req.params;
    const track = await redisService.getTrackJson(trackId);
    
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }
    res.json(track);
  } catch (error) {
    console.error('Error fetching track:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/track/:trackId/popularity-history', async (req, res) => {
  try {
    const redisService = req.app.get('redisService');
    const { trackId } = req.params;
    const { from, to } = req.query;
    
    const history = await redisService.getPopularityHistory(
      trackId,
      from || '-',
      to || '+'
    );
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching popularity history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const redisService = req.app.get('redisService');
    const { q: query, label, minPopularity } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const results = await redisService.searchTracks(query, {
      label,
      minPopularity: parseInt(minPopularity) || 0
    });

    res.json(results);
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
