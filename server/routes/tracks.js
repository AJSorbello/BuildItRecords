const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, query, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { validateRequest, isValidSpotifyId } = require('../utils/validation');
const { Track, Artist, Release, Label, ImportLog, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all routes
router.use(limiter);

// Helper function to format track data
const formatTrackData = (spotifyData) => ({
    id: spotifyData.id,
    artists: spotifyData.artists.map(artist => ({
        id: artist.id,
        name: artist.name
    })),
    name: spotifyData.name,
    album: {
        id: spotifyData.album.id,
        name: spotifyData.album.name,
        label: spotifyData.album.label || 'Unknown Label',
        images: spotifyData.album.images
    },
    duration_ms: spotifyData.duration_ms,
    popularity: spotifyData.popularity,
    preview_url: spotifyData.preview_url,
    external_urls: spotifyData.external_urls,
    cached_at: Date.now()
});

// Helper function to get Spotify access token
async function getSpotifyToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        console.error('Missing Spotify credentials:', { 
            hasClientId: !!clientId, 
            hasClientSecret: !!clientSecret 
        });
        throw new Error('Spotify credentials not configured');
    }

    try {
        console.log('Getting Spotify token...');
        const response = await makeSpotifyRequest('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: 'grant_type=client_credentials'
        });
        console.log('Got Spotify token successfully');
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Spotify token:', {
            message: error.message,
            response: error.response?.data
        });
        throw error;
    }
}

// Helper function to make a request with retries
async function makeSpotifyRequest(url, options, maxRetries = 3) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt} for ${url}`);
            const response = await axios(url, options);
            return response;
        } catch (error) {
            lastError = error;
            if (error.response?.status === 503) {
                const delay = Math.min(1000 * attempt, 3000); // Exponential backoff, max 3 seconds
                console.log(`Service unavailable, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            if (error.response?.status === 429) {
                const retryAfter = error.response.headers['retry-after'] || 1;
                const delay = retryAfter * 1000;
                console.log(`Rate limited, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

// Helper function to fetch track from Spotify
async function fetchTrackFromSpotify(trackId, accessToken) {
    const response = await makeSpotifyRequest(`https://api.spotify.com/v1/tracks/${trackId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return response.data;
}

// Helper function to handle track caching
async function getTrackWithCache(trackId, redisService) {
    try {
        // Try to get from cache first
        const cachedTrack = await redisService.getTrackJson(trackId);
        
        if (cachedTrack) {
            const cacheAge = Date.now() - cachedTrack.cached_at;
            if (cacheAge < 60 * 60 * 1000) {
                return { track: cachedTrack, source: 'cache' };
            }
        }

        // If not in cache or cache is stale, fetch from Spotify
        const accessToken = await getSpotifyToken();
        const spotifyTrack = await fetchTrackFromSpotify(trackId, accessToken);
        const formattedTrack = formatTrackData(spotifyTrack);

        // Cache the track
        await redisService.setTrackJson(trackId, formattedTrack);

        return { track: formattedTrack, source: 'spotify' };
    } catch (error) {
        // If Spotify fetch fails but we have cached data, return it
        if (error.response?.status === 404 && cachedTrack) {
            return { track: cachedTrack, source: 'cache-fallback' };
        }
        throw error;
    }
}

// Get all tracks with optional label filter
router.get('/', [
  query('labelId').optional().isString(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  validateRequest
], async (req, res) => {
  try {
    const { labelId } = req.query;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 50;

    const where = {};
    if (labelId) {
      where.label_id = labelId;
    }

    const { count, rows } = await Track.findAndCountAll({
      where,
      include: [
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] }
        },
        {
          model: Release,
          as: 'release'
        },
        {
          model: Label,
          as: 'label'
        }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit
    });

    res.json({
      items: rows,
      total: count,
      offset,
      limit,
      hasMore: offset + rows.length < count
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tracks',
      error: error.message 
    });
  }
});

// Search tracks with optional label filter
router.get('/search', [
  query('query').isString().notEmpty(),
  query('labelId').optional().isString(),
  validateRequest
], async (req, res) => {
  try {
    const { query: searchQuery, labelId } = req.query;

    const where = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${searchQuery}%` } },
        { '$artists.name$': { [Op.iLike]: `%${searchQuery}%` } },
        { '$release.title$': { [Op.iLike]: `%${searchQuery}%` } }
      ]
    };

    if (labelId) {
      where.label_id = labelId;
    }

    const tracks = await Track.findAll({
      where,
      include: [
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] }
        },
        {
          model: Release,
          as: 'release'
        },
        {
          model: Label,
          as: 'label'
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(tracks);
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching tracks',
      error: error.message 
    });
  }
});

// Import tracks from Spotify
router.post('/import', [
  body('labelId').isString().notEmpty().withMessage('Label ID is required'),
  body('spotifyPlaylistId').isString().notEmpty().withMessage('Spotify playlist ID is required'),
  validateRequest
], async (req, res) => {
  try {
    const { labelId, spotifyPlaylistId } = req.body;

    // Get Spotify token
    const token = await getSpotifyToken();
    
    // Import tracks from Spotify
    const spotifyTracks = await importTracksFromSpotify(token, spotifyPlaylistId);
    
    // Save tracks to database
    const savedTracks = await Promise.all(
      spotifyTracks.map(track => saveTrackToDatabase(track, labelId))
    );
    
    res.json({ tracks: savedTracks });
  } catch (error) {
    console.error('Error importing tracks:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error importing tracks',
      error: error.message 
    });
  }
});

// Helper function to import tracks from Spotify
async function importTracksFromSpotify(token, spotifyPlaylistId) {
  const response = await makeSpotifyRequest(`https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const tracks = response.data.items.map(item => item.track);
  return tracks;
}

// Helper function to save track to database
async function saveTrackToDatabase(track, labelId) {
  const existingTrack = await Track.findByPk(track.id);
  if (existingTrack) {
    await existingTrack.update({
      name: track.name,
      artists: track.artists,
      album: track.album,
      albumCover: track.albumCover || track.artwork_url,
      releaseDate: track.releaseDate || track.release_date,
      spotifyUrl: track.spotifyUrl,
      preview_url: track.preview_url,
      label_id: labelId
    });
  } else {
    await Track.create({
      id: track.id,
      name: track.name,
      artists: track.artists,
      album: track.album,
      albumCover: track.albumCover || track.artwork_url,
      releaseDate: track.releaseDate || track.release_date,
      spotifyUrl: track.spotifyUrl,
      preview_url: track.preview_url,
      label_id: labelId
    });
  }

  return track;
}

// Other routes...

module.exports = router;
