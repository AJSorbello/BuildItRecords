const express = require('express');
const router = express.Router();

const setupRedisRoutes = (app, redisService, spotifyService) => {
  // Ensure Redis service is initialized
  app.use('/api/redis/*', async (req, res, next) => {
    try {
      if (!redisService.isInitialized) {
        await redisService.init();
      }
      next();
    } catch (error) {
      console.error('Failed to initialize Redis service:', error);
      res.status(503).json({ error: 'Redis service unavailable' });
    }
  });

  // Health check endpoint
  app.get('/api/redis/health', async (req, res) => {
    try {
      await redisService.init();
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Redis health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get track by ID
  app.get('/api/redis/track/:trackId', async (req, res) => {
    try {
      const track = await redisService.getTrackJson(req.params.trackId);
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      res.json(track);
    } catch (error) {
      console.error('Error getting track:', error);
      res.status(500).json({ error: 'Failed to get track' });
    }
  });

  // Get track details
  app.get('/api/track/:trackId', async (req, res) => {
    try {
      const { trackId } = req.params;
      const trackDetails = await spotifyService.getTrackDetails(trackId);
      if (!trackDetails) {
        return res.status(404).json({ error: 'Track not found' });
      }
      res.json(trackDetails);
    } catch (error) {
      console.error('Failed to get track details:', error);
      res.status(500).json({ error: 'Failed to get track details' });
    }
  });

  // Get tracks by label
  app.get('/api/redis/tracks/:label', async (req, res) => {
    console.log(`[Redis Routes] Fetching tracks for label: ${req.params.label}`);
    
    // Set a timeout for the entire request
    const timeout = setTimeout(() => {
      console.log('[Redis Routes] Request timed out');
      if (!res.headersSent) {
        res.status(504).json({ error: 'Request timed out' });
      }
    }, 10000); // 10 second timeout

    try {
      // Parse query parameters with defaults
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      console.log('[Redis Routes] Query params:', { page, limit });
      console.log('[Redis Routes] Calling redisService.getTracksForLabel');
      
      const result = await redisService.getTracksForLabel(req.params.label, {
        page,
        limit
      });

      clearTimeout(timeout);

      if (result.error) {
        console.log('[Redis Routes] Error from Redis service:', result.error);
        return res.status(500).json({ error: result.error });
      }

      console.log(`[Redis Routes] Got response from Redis. Tracks found: ${result.tracks ? 'yes' : 'no'}`);
      
      if (!result.tracks) {
        console.log('[Redis Routes] No tracks found, sending 404');
        return res.status(404).json({ error: 'No tracks found for label' });
      }

      console.log(`[Redis Routes] Sending ${result.tracks.length} tracks (page ${result.page} of ${result.totalPages})`);
      res.json(result);
    } catch (error) {
      clearTimeout(timeout);
      console.error('[Redis Routes] Error getting tracks:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to get tracks', details: error.message });
      }
    }
  });

  // Search tracks
  app.get('/api/redis/search', async (req, res) => {
    try {
      const { query, label, minPopularity } = req.query;
      const tracks = await redisService.searchTracks(query, {
        label,
        minPopularity: parseInt(minPopularity) || 0
      });
      res.json(tracks);
    } catch (error) {
      console.error('Error searching tracks:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  });

  // Get artist details
  app.get('/api/redis/artist/:artistId', async (req, res) => {
    try {
      const artist = await redisService.getArtistDetails(req.params.artistId);
      if (!artist) {
        return res.status(404).json({ error: 'Artist not found' });
      }
      res.json(artist);
    } catch (error) {
      console.error('Error getting artist:', error);
      res.status(500).json({ error: 'Failed to get artist' });
    }
  });

  // Track popularity history
  app.get('/api/redis/track/:trackId/popularity', async (req, res) => {
    try {
      const history = await redisService.getPopularityHistory(req.params.trackId);
      res.json(history);
    } catch (error) {
      console.error('Error getting popularity history:', error);
      res.status(500).json({ error: 'Failed to get popularity history' });
    }
  });

  // Test Redis connection
  app.get('/api/redis/test', async (req, res) => {
    try {
      // Try to set a simple key-value pair
      await redisService.executeCommand('set', 'test_key', 'test_value');
      
      // Try to get it back
      const value = await redisService.executeCommand('get', 'test_key');
      
      res.json({
        status: 'success',
        value: value,
        message: 'Redis is working correctly'
      });
    } catch (error) {
      console.error('Redis test failed:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });

  // List all keys in Redis
  app.get('/api/redis/keys', async (req, res) => {
    try {
      const keys = await redisService.executeCommand('keys', '*');
      res.json({
        status: 'success',
        keys: keys
      });
    } catch (error) {
      console.error('Failed to get Redis keys:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });

  // Get artists by label
  app.get('/api/redis/label/:label/artists', async (req, res) => {
    try {
      const { label } = req.params;
      console.log(`[Redis Routes] Getting artists for label: ${label}`);
      
      const artists = await redisService.getArtistsForLabel(label);
      if (!artists || artists.length === 0) {
        return res.status(404).json({ error: 'No artists found for label' });
      }
      
      res.json(artists);
    } catch (error) {
      console.error('[Redis Routes] Error getting artists:', error);
      res.status(500).json({ error: 'Failed to get artists' });
    }
  });

  // Get albums by label
  app.get('/api/redis/label/:label/albums', async (req, res) => {
    try {
      const { label } = req.params;
      console.log(`[Redis Routes] Getting albums for label: ${label}`);
      
      const albums = await redisService.getAlbumsForLabel(label);
      if (!albums || albums.length === 0) {
        return res.status(404).json({ error: 'No albums found for label' });
      }
      
      res.json(albums);
    } catch (error) {
      console.error('[Redis Routes] Error getting albums:', error);
      res.status(500).json({ error: 'Failed to get albums' });
    }
  });

  // Get album details
  app.get('/api/album/:albumId', async (req, res) => {
    try {
      const { albumId } = req.params;
      const albumDetails = await spotifyService.getAlbumDetails(albumId);
      if (!albumDetails) {
        return res.status(404).json({ error: 'Album not found' });
      }
      res.json(albumDetails);
    } catch (error) {
      console.error('Failed to get album details:', error);
      res.status(500).json({ error: 'Failed to get album details' });
    }
  });

  // Test endpoint to verify label data
  app.get('/api/redis/label/:label/verify', async (req, res) => {
    try {
      const { label } = req.params;
      const normalizedLabel = redisService.normalizeLabel(label);
      
      // Get track IDs from the set
      const trackIds = await redisService.executeCommand('smembers', `${normalizedLabel}:tracks`);
      
      // Get track data
      const tracks = [];
      for (const id of trackIds || []) {
        const trackData = await redisService.executeCommand('get', `track:${id}`);
        if (trackData) {
          tracks.push(JSON.parse(trackData));
        }
      }
      
      // Get album IDs from sorted set
      const albumIds = await redisService.executeCommand('zrange', `${normalizedLabel}:albums:bydate`, 0, -1);
      
      // Get album data
      const albums = [];
      for (const id of albumIds || []) {
        const albumData = await redisService.executeCommand('get', `album:${id}`);
        if (albumData) {
          albums.push(JSON.parse(albumData));
        }
      }
      
      res.json({
        label: normalizedLabel,
        trackCount: tracks.length,
        tracks: tracks.map(t => ({ id: t.id, name: t.name })),
        albumCount: albums.length,
        albums: albums.map(a => ({ id: a.id, name: a.name }))
      });
    } catch (error) {
      console.error('Error verifying label data:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Clear all Redis data
  app.post('/api/redis/clear', async (req, res) => {
    try {
      await redisService.clearAllData();
      res.json({ message: 'Redis data cleared successfully' });
    } catch (error) {
      console.error('Failed to clear Redis data:', error);
      res.status(500).json({ error: 'Failed to clear Redis data' });
    }
  });

  // Warmup Redis cache
  app.post('/api/redis/warmup', async (req, res) => {
    try {
      console.log('Starting Redis warmup...');
      
      // Clear existing data first
      await redisService.clearAllData();
      console.log('Cleared existing Redis data');

      // Cache artists and albums for each label
      const labelData = {
        'builditrecords': {
          artists: [
            { 
              id: '5kjLSnLC92rIy7B5knTIH3', 
              name: 'Kwal',
              albums: ['30eZs2IrYuwTe92NiYi0zS'] // No More EP
            },
            { 
              id: '5sobBegrP0b7zmE5Edc8C6', 
              name: 'BELLO',
              albums: ['30eZs2IrYuwTe92NiYi0zS'] // No More EP
            }
          ]
        },
        'buildittech': {
          artists: []
        },
        'builditdeep': {
          artists: []
        }
      };

      for (const [label, data] of Object.entries(labelData)) {
        console.log(`Processing ${label}...`);
        
        // Cache artists
        for (const artist of data.artists) {
          console.log(`Fetching details for artist: ${artist.name}`);
          const artistDetails = await spotifyService.getArtistDetails(artist.id);
          if (artistDetails) {
            await redisService.setArtistDetails(artist.id, artistDetails, label);
          }

          // Cache albums and their tracks
          for (const albumId of artist.albums) {
            console.log(`Fetching details for album: ${albumId}`);
            const albumDetails = await spotifyService.getAlbumDetails(albumId);
            if (albumDetails) {
              await redisService.setAlbumToCache(albumDetails);
              // Add to sorted set by release date
              const releaseDate = new Date(albumDetails.releaseDate).getTime();
              await redisService.executeCommand('zadd', `${label}:albums:bydate`, releaseDate, albumId);
            }

            // Get and cache all tracks from the album
            console.log(`Fetching tracks for album: ${albumId}`);
            const tracks = await spotifyService.getAlbumTracks(albumId);
            if (tracks && tracks.length > 0) {
              // Add label to each track
              const tracksWithLabel = tracks.map(track => ({
                ...track,
                label
              }));
              
              // Cache tracks individually and add to label's track set
              for (const track of tracksWithLabel) {
                await redisService.setTrackToCache(track);
              }
            }
          }
        }
      }

      console.log('Redis warmup completed successfully');
      res.json({ message: 'Redis warmup completed successfully' });
    } catch (error) {
      console.error('Error during Redis warmup:', error);
      res.status(500).json({ error: 'Failed to warm up Redis cache' });
    }
  });

  // ... rest of the code remains the same ...
};

module.exports = { setupRedisRoutes };
