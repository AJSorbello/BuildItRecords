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
    
    // IMPROVED QUERY: This query gets both:
    // 1. Artists directly assigned to this label
    // 2. PRIMARY Artists who have releases on this label (filtering out remixers, etc.)
    const artistsQuery = `
      SELECT DISTINCT a.*, COUNT(*) OVER() as total_count
      FROM artists a
      WHERE a.label_id = $1
         OR a.id IN (
            SELECT ra.artist_id
            FROM release_artists ra
            JOIN releases r ON ra.release_id = r.id
            WHERE r.label_id = $1
            AND (
              -- Only include primary artists, not remixers or features
              ra.role = 'primary' 
              OR ra.role IS NULL -- Include cases where role isn't specified but artist is linked
              
              -- For compilation releases, be more selective
              OR (
                r.type = 'compilation' 
                AND EXISTS (
                  -- Check if this artist has at least one primary track on the compilation
                  SELECT 1 FROM tracks t
                  JOIN track_artists ta ON t.id = ta.track_id
                  WHERE t.release_id = r.id 
                  AND ta.artist_id = ra.artist_id
                  AND (ta.role = 'primary' OR ta.role IS NULL)
                )
              )
              
              -- Don't include artists who are ONLY remixers
              AND NOT (
                ra.role = 'remixer' 
                AND NOT EXISTS (
                  -- Check if this artist has any primary role on any other release
                  SELECT 1 FROM release_artists ra2
                  WHERE ra2.artist_id = ra.artist_id
                  AND ra2.role = 'primary'
                )
              )
            )
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
      query_type: 'primary_artists_only', // Updated to indicate we're filtering for primary artists
      message: 'Retrieved artists directly assigned to label or primary artists with releases on the label'
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

module.exports = router;
