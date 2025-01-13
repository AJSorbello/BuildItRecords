const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const { validateRequest } = require('../utils/validation');
const { getSpotifyToken } = require('../utils/spotify');
const { pool } = require('../utils/db');
const fetch = require('node-fetch');
const { verifyAdminToken } = require('../middleware/auth');

// Get all labels
router.get('/', async (req, res) => {
  try {
    const labels = [
      {
        id: 'buildit-records',
        name: 'Records',
        displayName: 'Build It Records',
        description: 'The main label for Build It Records, featuring a diverse range of electronic music.'
      },
      {
        id: 'buildit-tech',
        name: 'Tech',
        displayName: 'Build It Tech',
        description: 'Our techno-focused sublabel, delivering cutting-edge underground sounds.'
      },
      {
        id: 'buildit-deep',
        name: 'Deep',
        displayName: 'Build It Deep',
        description: 'Deep and melodic electronic music from emerging and established artists.'
      }
    ];
    
    res.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
});

// Get artists for a specific label
router.get('/:labelId/artists', [
  param('labelId').isString(),
  validateRequest
], async (req, res) => {
  try {
    const { labelId } = req.params;
    
    // Query the database for artists with the specified label
    const { rows: artists } = await pool.query(
      'SELECT * FROM artists WHERE label_id = $1',
      [labelId]
    );
    
    res.json({ artists });
  } catch (error) {
    console.error('Error fetching artists for label:', error);
    res.status(500).json({ error: 'Failed to fetch artists for label' });
  }
});

// Get releases for a specific label
router.get('/:labelId/releases', [
  param('labelId').isString(),
  validateRequest
], async (req, res) => {
  try {
    const { labelId } = req.params;
    
    // Query the database for releases with the specified label
    const { rows: releases } = await pool.query(
      'SELECT * FROM releases WHERE label_id = $1',
      [labelId]
    );
    
    res.json({ releases });
  } catch (error) {
    console.error('Error fetching releases for label:', error);
    res.status(500).json({ error: 'Failed to fetch releases for label' });
  }
});

// Get tracks for a specific label
router.get('/:labelId/tracks', [
  param('labelId').isString(),
  validateRequest
], async (req, res) => {
  try {
    const { labelId } = req.params;
    
    // Query the database for tracks with the specified label
    const query = `
      SELECT t.*, 
             json_agg(DISTINCT a.*) as artists,
             json_agg(DISTINCT r.*) as release
      FROM tracks t
      LEFT JOIN track_artists ta ON t.id = ta.track_id
      LEFT JOIN artists a ON ta.artist_id = a.id
      LEFT JOIN releases r ON t.release_id = r.id
      WHERE t.label_id = $1
      GROUP BY t.id
    `;
    
    const result = await pool.query(query, [labelId]);
    res.json({ tracks: result.rows });
  } catch (error) {
    console.error('Error fetching tracks for label:', error);
    res.status(500).json({ error: 'Failed to fetch tracks for label' });
  }
});

// Search tracks for a specific label
router.get('/:labelId/tracks/search', [
  param('labelId').isString(),
  query('q').isString(),
  validateRequest
], async (req, res) => {
  try {
    const { labelId } = req.params;
    const { q } = req.query;
    
    const searchQuery = `
      SELECT t.*, 
             json_agg(DISTINCT a.*) as artists,
             json_agg(DISTINCT r.*) as release
      FROM tracks t
      LEFT JOIN track_artists ta ON t.id = ta.track_id
      LEFT JOIN artists a ON ta.artist_id = a.id
      LEFT JOIN releases r ON t.release_id = r.id
      WHERE t.label_id = $1
        AND (
          t.name ILIKE $2
          OR a.name ILIKE $2
          OR r.name ILIKE $2
        )
      GROUP BY t.id
    `;
    
    const result = await pool.query(searchQuery, [labelId, `%${q}%`]);
    res.json({ tracks: result.rows });
  } catch (error) {
    console.error('Error searching tracks for label:', error);
    res.status(500).json({ error: 'Failed to search tracks for label' });
  }
});

// Import tracks for a specific label
router.post('/labels/:labelId/import', verifyAdminToken, async (req, res) => {
  console.log('Starting import process...');
  let client;
  try {
    const { labelId } = req.params;
    console.log('Label ID:', labelId);
    
    // Get the label name
    const labelQuery = 'SELECT name FROM labels WHERE id = $1';
    const labelResult = await pool.query(labelQuery, [labelId]);
    console.log('Label query result:', labelResult.rows);
    
    if (!labelResult.rows[0]?.name) {
      console.error('Label not found:', labelId);
      return res.status(404).json({ 
        success: false,
        error: 'Label not found' 
      });
    }

    const labelName = labelResult.rows[0].name;
    console.log('Found label name:', labelName);
    
    // Get Spotify access token
    console.log('Getting Spotify token...');
    const spotifyToken = await getSpotifyToken();
    console.log('Got Spotify token');
    
    // Log the full URL and headers we're using
    const searchQuery = encodeURIComponent(`label:"${labelName}"`);
    const spotifyUrl = `https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=50`;
    console.log('Spotify search URL:', spotifyUrl);
    
    const response = await fetch(spotifyUrl, {
      headers: {
        'Authorization': `Bearer ${spotifyToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Spotify API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Spotify API error: ${response.statusText}`);
    }

    const searchResults = await response.json();
    console.log(`Found ${searchResults.tracks?.items?.length || 0} tracks`);
    
    if (!searchResults.tracks?.items?.length) {
      return res.json({
        success: true,
        message: 'No tracks found for this label',
        trackCount: 0,
        tracks: []
      });
    }
    
    const tracks = searchResults.tracks.items;
    
    // Start a transaction for database operations
    client = await pool.connect();
    console.log('Got database connection');
    
    try {
      await client.query('BEGIN');
      console.log('Started database transaction');
      
      // Process each track
      const importedTracks = [];
      for (const track of tracks) {
        console.log('Processing track:', track.name);
        
        try {
          // Get or create artist
          console.log('Creating/updating artist:', track.artists[0].name);
          const artistResult = await client.query(
            'INSERT INTO artists (name, spotify_id, label_id) VALUES ($1, $2, $3) ON CONFLICT (spotify_id) DO UPDATE SET name = $1 RETURNING id',
            [track.artists[0].name, track.artists[0].id, labelId]
          );
          
          // Get or create release
          console.log('Creating/updating release:', track.album.name);
          const releaseResult = await client.query(
            'INSERT INTO releases (name, spotify_id, label_id) VALUES ($1, $2, $3) ON CONFLICT (spotify_id) DO UPDATE SET name = $1 RETURNING id',
            [track.album.name, track.album.id, labelId]
          );
          
          // Insert track
          console.log('Creating/updating track:', track.name);
          const trackResult = await client.query(
            'INSERT INTO tracks (name, spotify_id, release_id, label_id) VALUES ($1, $2, $3, $4) ON CONFLICT (spotify_id) DO UPDATE SET name = $1 RETURNING *',
            [track.name, track.id, releaseResult.rows[0].id, labelId]
          );
          
          // Create track-artist relationship
          console.log('Creating track-artist relationship');
          await client.query(
            'INSERT INTO track_artists (track_id, artist_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [trackResult.rows[0].id, artistResult.rows[0].id]
          );
          
          importedTracks.push({
            ...trackResult.rows[0],
            artists: [{ name: track.artists[0].name, id: track.artists[0].id }],
            release: [{ name: track.album.name, id: track.album.id }]
          });
        } catch (trackError) {
          console.error('Error processing track:', {
            trackName: track.name,
            error: trackError.message,
            stack: trackError.stack
          });
          // Continue with next track
          continue;
        }
      }
      
      await client.query('COMMIT');
      console.log('Import completed successfully');
      
      res.json({ 
        success: true, 
        message: 'Import completed successfully',
        trackCount: importedTracks.length,
        tracks: importedTracks
      });
    } catch (dbError) {
      console.error('Database error during import:', {
        error: dbError.message,
        stack: dbError.stack,
        detail: dbError.detail,
        code: dbError.code
      });
      if (client) {
        await client.query('ROLLBACK');
        console.log('Rolled back transaction');
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error importing tracks:', {
      error: error.message,
      stack: error.stack,
      detail: error.detail,
      code: error.code
    });
    res.status(500).json({ 
      success: false,
      error: 'Failed to import tracks',
      message: error.message,
      detail: error.detail,
      code: error.code
    });
  } finally {
    if (client) {
      client.release();
      console.log('Released database connection');
    }
  }
});

// Get label statistics
router.get('/stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        l.name as label,
        COUNT(DISTINCT a.id) as artist_count,
        COUNT(DISTINCT r.id) as release_count,
        COUNT(DISTINCT t.id) as track_count
      FROM labels l
      LEFT JOIN releases r ON r.label_id = l.id
      LEFT JOIN release_artists ra ON ra.release_id = r.id
      LEFT JOIN artists a ON a.id = ra.artist_id
      LEFT JOIN tracks t ON t.release_id = r.id
      GROUP BY l.id, l.name
      ORDER BY l.name ASC;
    `;

    const result = await pool.query(query);
    
    const stats = result.rows.map(row => ({
      label: row.label,
      artistCount: parseInt(row.artist_count),
      releaseCount: parseInt(row.release_count),
      trackCount: parseInt(row.track_count)
    }));

    res.json(stats);
  } catch (error) {
    console.error('Error getting label stats:', error);
    res.status(500).json({ error: 'Failed to get label statistics' });
  }
});

module.exports = router;
