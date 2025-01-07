const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const { validateRequest } = require('../utils/validation');
const { getSpotifyToken } = require('../utils/spotify');
const { pool } = require('../db');

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
