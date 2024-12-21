const axios = require('axios');
const config = require('../config/environment');
const SpotifyService = require('../services/SpotifyService');
const { Label, Artist, Release } = require('../models');

const spotifyService = new SpotifyService();

// Helper function to fetch artist details
async function getArtistDetails(artistId, accessToken) {
  console.log(`[Spotify] Fetching details for artist: ${artistId}`);
  try {
    const artist = await Artist.findByPk(artistId);
    if (artist) {
      console.log(`[Spotify] Found artist details for artist: ${artistId}`);
      return artist;
    }

    const response = await axios.get(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );
    
    // Save artist details to database
    await Artist.create(response.data);
    
    console.log(`[Spotify] Successfully fetched details for artist: ${artistId}`);
    return response.data;
  } catch (error) {
    console.error(`[Spotify] Error fetching artist details for ${artistId}:`, error.message);
    if (error.response) {
      console.error(`[Spotify] Response status: ${error.response.status}`);
      console.error(`[Spotify] Response data:`, error.response.data);
    }
    return null;
  }
}

const setupSpotifyRoutes = (app) => {
  // Helper function to get access token
  async function getAccessToken() {
    console.log('[Spotify] Getting access token...');
    const { clientId, clientSecret } = config.spotify;
    
    if (!clientId || !clientSecret) {
      console.error('[Spotify] Missing credentials');
      throw new Error('Missing Spotify credentials');
    }

    try {
      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'client_credentials'
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
          }
        }
      );
      console.log('[Spotify] Successfully obtained access token');
      return tokenResponse.data.access_token;
    } catch (error) {
      console.error('[Spotify] Error getting access token:', error.message);
      throw error;
    }
  }

  // Search tracks
  app.get('/api/spotify/search', async (req, res) => {
    try {
      const { q: query, limit } = req.query;
      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      const results = await spotifyService.searchTracks(query, limit);
      res.json(results);
    } catch (error) {
      console.error('[Spotify Routes] Search error:', error);
      res.status(500).json({ error: 'Failed to search tracks' });
    }
  });

  // Get tracks by label
  app.get('/api/spotify/tracks/label/:label', async (req, res) => {
    try {
      console.log(`[Spotify Routes] Getting tracks for label: ${req.params.label}`);
      const tracks = await spotifyService.getTracksForLabel(req.params.label);
      res.json(tracks);
    } catch (error) {
      console.error('[Spotify Routes] Error getting tracks by label:', error);
      res.status(500).json({ error: 'Failed to get tracks' });
    }
  });

  // Get artists by label
  app.get('/api/spotify/artists/label/:label', async (req, res) => {
    try {
      console.log(`[Spotify Routes] Getting artists for label: ${req.params.label}`);
      const artists = await spotifyService.getArtistsForLabel(req.params.label);
      res.json(artists);
    } catch (error) {
      console.error('[Spotify Routes] Error getting artists by label:', error);
      res.status(500).json({ error: 'Failed to get artists' });
    }
  });

  // Get artist details
  app.get('/api/spotify/artist/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const artist = await Artist.findByPk(id);
      if (!artist) {
        return res.status(404).json({ error: 'Artist not found' });
      }
      res.json(artist);
    } catch (error) {
      console.error('[Spotify Routes] Error getting artist details:', error);
      res.status(500).json({ error: 'Failed to get artist details' });
    }
  });

  // Get release details
  app.get('/api/spotify/release/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const release = await Release.findByPk(id, {
        include: [{
          model: Artist,
          as: 'artist',
          attributes: ['name', 'spotifyUrl']
        }]
      });
      if (!release) {
        return res.status(404).json({ error: 'Release not found' });
      }
      res.json(release);
    } catch (error) {
      console.error('[Spotify Routes] Error getting release details:', error);
      res.status(500).json({ error: 'Failed to get release details' });
    }
  });

  // Get album details
  app.get('/api/spotify/albums/:albumId', async (req, res) => {
    try {
      const albumDetails = await spotifyService.getAlbumDetails(req.params.albumId);
      res.json(albumDetails);
    } catch (error) {
      console.error('[Spotify Routes] Error getting album details:', error);
      res.status(500).json({ error: 'Failed to get album details' });
    }
  });

  // Get top tracks
  app.get('/api/spotify/tracks/top', async (req, res) => {
    try {
      const topTracks = await spotifyService.getTopTracks();
      res.json(topTracks);
    } catch (error) {
      console.error('[Spotify Routes] Error getting top tracks:', error);
      res.status(500).json({ error: 'Failed to get top tracks' });
    }
  });

  app.get('/api/spotify/track/:trackId', async (req, res) => {
    console.log('Received request for track:', req.params.trackId);
    
    try {
      console.log('[Spotify] Getting access token...');
      const accessToken = await getAccessToken();

      // Get track details
      console.log('Fetching track details from Spotify...');
      const trackResponse = await axios.get(
        `https://api.spotify.com/v1/tracks/${req.params.trackId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      const track = trackResponse.data;

      // Fetch details for each artist
      const artistPromises = track.artists.map(artist => getArtistDetails(artist.id, accessToken));
      const artistDetails = await Promise.all(artistPromises);

      // Merge artist details into track data
      track.artists = track.artists.map((artist, index) => ({
        ...artist,
        ...artistDetails[index]
      }));

      res.json(track);
    } catch (error) {
      console.error('Error:', error.message);
      res.status(error.response?.status || 500).json({
        error: 'Failed to fetch track',
        details: error.message
      });
    }
  });
};

module.exports = { setupSpotifyRoutes };
