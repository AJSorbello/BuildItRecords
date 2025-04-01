/**
 * Label-Specific API Endpoints
 * 
 * These endpoints ensure strict filtering of releases and artists by label_id
 * so that each label page only shows its own content.
 */

const { Pool } = require('pg');
const express = require('express');
const router = express.Router();
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.supabase') });

// Create a connection pool to the database
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgres://postgres.liuaozuvkmvanmchndzl:H0u53Mu51c11!@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

// Define label ID constants to ensure consistency
const LABEL_IDS = {
  'buildit-records': '1',
  'buildit-tech': '2',
  'buildit-deep': '3'
};

/**
 * Get releases for a specific label
 * This endpoint strictly enforces label_id filtering
 */
router.get('/label-releases/:labelId', async (req, res) => {
  const { labelId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  // Convert string label ID to numeric if needed
  let numericLabelId;
  if (LABEL_IDS[labelId]) {
    numericLabelId = LABEL_IDS[labelId];
  } else if (['1', '2', '3'].includes(labelId)) {
    numericLabelId = labelId;
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid label ID'
    });
  }
  
  try {
    console.log(`Fetching releases for label_id = ${numericLabelId}`);
    
    // Query to get releases with the exact label_id
    const releasesQuery = `
      SELECT r.*, COUNT(*) OVER() as total_count
      FROM releases r
      WHERE r.label_id = $1
      ORDER BY r.release_date DESC
      LIMIT $2 OFFSET $3
    `;
    
    const releasesResult = await pool.query(releasesQuery, [numericLabelId, limit, offset]);
    const releases = releasesResult.rows;
    const totalCount = releases.length > 0 ? parseInt(releases[0].total_count) : 0;
    
    // For each release, get its associated artists
    const releasesWithArtists = await Promise.all(releases.map(async (release) => {
      // Get artists for this release
      const artistsQuery = `
        SELECT a.*
        FROM artists a
        JOIN release_artists ra ON a.id = ra.artist_id
        WHERE ra.release_id = $1
      `;
      
      const artistsResult = await pool.query(artistsQuery, [release.id]);
      
      return {
        ...release,
        artists: artistsResult.rows
      };
    }));
    
    // Return the results
    return res.json({
      success: true,
      data: releasesWithArtists,
      total: totalCount,
      count: releases.length,
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('Error fetching label-specific releases:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching releases',
      error: error.message
    });
  }
});

/**
 * Get artists for a specific label
 * This endpoint gets artists associated with releases from this label 
 * as well as artists directly assigned to the label
 */
router.get('/label-artists/:labelId', async (req, res) => {
  const { labelId } = req.params;
  const { limit = 100, offset = 0 } = req.query;
  
  // Convert string label ID to numeric if needed
  let numericLabelId;
  if (LABEL_IDS[labelId]) {
    numericLabelId = LABEL_IDS[labelId];
  } else if (['1', '2', '3'].includes(labelId)) {
    numericLabelId = labelId;
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid label ID'
    });
  }
  
  try {
    console.log(`Fetching artists for label_id = ${numericLabelId}`);
    
    // Get all artists associated with this label in any capacity (primary, remixer, feature, etc.)
    const artistsQuery = `
      SELECT DISTINCT a.*, COUNT(*) OVER() as total_count
      FROM artists a
      WHERE (
        -- Include artists directly assigned to this label
        a.label_id = $1
        
        -- OR any artist with a role on releases from this label
        OR a.id IN (
          SELECT ra.artist_id
          FROM release_artists ra
          JOIN releases r ON ra.release_id = r.id
          WHERE r.label_id = $1
          -- No role filtering - include all artists regardless of role
        )
      )
      -- Additional filter to exclude test artists or artists with no releases
      AND (
        -- Either the artist has a direct label assignment
        a.label_id = $1
        -- OR the artist has at least one PUBLISHED release on this label
        OR EXISTS (
          SELECT 1 
          FROM release_artists ra 
          JOIN releases r ON ra.release_id = r.id 
          WHERE ra.artist_id = a.id 
          AND r.label_id = $1
          AND r.status = 'published'  -- Only include published releases
          AND r.title NOT LIKE 'Test%' -- Exclude test releases
        )
      )
      -- Exclude specific test artists by name pattern
      AND a.name NOT IN (
        'a girl and a gun', 'alpha mid', 'alpha max',
        'beats gd 32', 'beta 89', 'big loop 21', 'big vibes 99', 
        'big zero spin', 'break 119', 'bass hd 104', 'bass odyssey',
        'bass work 40', 'bass x 8', 'beat max 52', 'beat smith 20',
        'beat x 116', 'beats 404 64', 'beats hd 32', 'bedroom gold',
        'bella goldwin', 'beta 25', 'boy kid cloud', 'boom bap'
      )
      -- Exclude artists with names that follow test patterns
      AND a.name NOT LIKE 'Bass %'
      AND a.name NOT LIKE 'Beat %'
      AND a.name NOT LIKE 'Beats %'
      AND a.name NOT LIKE 'Beta %'
      AND a.name NOT LIKE 'Big %'
      AND a.name NOT LIKE 'Break %'
      AND a.name NOT LIKE 'B%ss %'
      AND a.name NOT LIKE 'B%at %'
      -- Ensure artist has a valid name (not just a number or test code)
      AND LENGTH(a.name) > 3
      -- Make sure the artist has at least one release or is directly assigned to the label
      AND (
        EXISTS (
          SELECT 1 
          FROM release_artists ra 
          JOIN releases r ON ra.release_id = r.id 
          WHERE ra.artist_id = a.id
          AND r.label_id = $1
        )
        OR a.label_id = $1
      )
      ORDER BY a.name ASC
      LIMIT $2 OFFSET $3
    `;
    
    const artistsResult = await pool.query(artistsQuery, [numericLabelId, limit, offset]);
    const artists = artistsResult.rows;
    const totalCount = artists.length > 0 ? parseInt(artists[0].total_count) : 0;
    
    console.log(`Found ${artists.length} artists for label ${numericLabelId} (out of ${totalCount} total)`);
    
    // Return the results with additional metadata
    return res.json({
      success: true,
      data: artists,
      total: totalCount,
      count: artists.length,
      offset: parseInt(offset),
      limit: parseInt(limit),
      query_type: 'all_artists', // Updated to indicate we're getting all artists
      message: 'Retrieved artists directly assigned to label or with any role on releases from the label'
    });
  } catch (error) {
    console.error('Error fetching label-specific artists:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching artists',
      error: error.message
    });
  }
});

// Get releases for a specific artist
router.get('/artist-releases/:artistId', async (req, res) => {
  const { artistId } = req.params;
  const { limit = 5, offset = 0 } = req.query;
  
  try {
    console.log(`[API] Fetching releases for artist ID: ${artistId}`);
    
    const releasesQuery = `
      SELECT DISTINCT r.*, COUNT(*) OVER() as total_count
      FROM releases r
      JOIN release_artists ra ON r.id = ra.release_id
      WHERE ra.artist_id = $1
      ORDER BY r.release_date DESC
      LIMIT $2 OFFSET $3
    `;
    
    const { rows } = await pool.query(releasesQuery, [artistId, limit, offset]);
    
    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No releases found for this artist',
        data: [],
        meta: { total: 0 }
      });
    }
    
    const total = parseInt(rows[0].total_count);
    
    // Remove the total_count field from each row
    const releases = rows.map(row => {
      const { total_count, ...release } = row;
      return release;
    });
    
    return res.status(200).json({
      success: true,
      message: `Found ${releases.length} releases for artist`,
      data: releases,
      meta: { total }
    });
    
  } catch (error) {
    console.error('Error fetching artist releases:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching artist releases',
      error: error.message
    });
  }
});

module.exports = router;
