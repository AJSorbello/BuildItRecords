/**
 * Handler for the /records/releases endpoint
 * This is a simplified endpoint that avoids the .single() method error
 */

// Import required dependencies
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Get database configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL || 
                   process.env.VITE_SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL;
                  
const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                   process.env.VITE_SUPABASE_ANON_KEY || 
                   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initialize PostgreSQL pool
function getPool() {
  // Determine which connection string to use
  let connectionString;
  
  // If POSTGRES_URL_NON_POOLING is set, prefer that (Vercel production format)
  if (process.env.POSTGRES_URL_NON_POOLING) {
    console.log('Using Vercel POSTGRES_URL_NON_POOLING connection string');
    connectionString = process.env.POSTGRES_URL_NON_POOLING;
  }
  // Fall back to explicit connection parameters
  else if (process.env.POSTGRES_HOST) {
    // Build connection string from individual parameters
    const ssl = process.env.POSTGRES_SSL ? 'sslmode=require' : '';
    connectionString = `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DATABASE}?${ssl}`;
    console.log(`Using explicit PostgreSQL connection parameters: ${process.env.POSTGRES_HOST}`);
  } else {
    console.error('No PostgreSQL connection parameters found');
    throw new Error('Database connection parameters missing');
  }

  return new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
}

/**
 * Format releases with artist information
 * @param {Array} rows - Database query results
 * @returns {Array} Formatted releases
 */
function formatReleasesWithArtists(rows) {
  // Group by release ID
  const releasesMap = {};
  
  rows.forEach(row => {
    const releaseId = row.id;
    
    // If this is the first time we've seen this release, initialize it
    if (!releasesMap[releaseId]) {
      releasesMap[releaseId] = {
        ...row,
        artists: []
      };
      
      // Remove artist-specific columns from the release object
      delete releasesMap[releaseId].artist_name;
      delete releasesMap[releaseId].artist_id;
    }
    
    // Add artist to release if artist info exists
    if (row.artist_id && row.artist_name) {
      // Check if artist already exists in the array (avoid duplicates)
      const artistExists = releasesMap[releaseId].artists.some(artist => artist.id === row.artist_id);
      
      if (!artistExists) {
        releasesMap[releaseId].artists.push({
          id: row.artist_id,
          name: row.artist_name
        });
      }
    }
  });
  
  // Convert map to array
  return Object.values(releasesMap);
}

module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('Records Releases API called:', req.url);

  try {
    // First attempt: Use direct PostgreSQL query (more reliable)
    try {
      const pool = getPool();
      const client = await pool.connect();
      
      console.log('Connected to PostgreSQL database');
      
      // Query with joins to get associated artist info
      const query = `
        SELECT r.*, a.name as artist_name, a.id as artist_id 
        FROM releases r
        LEFT JOIN release_artists ra ON r.id = ra.release_id
        LEFT JOIN artists a ON ra.artist_id = a.id
        ORDER BY r.release_date DESC NULLS LAST, r.title ASC
      `;
      
      const result = await client.query(query);
      client.release();
      
      // Format the results to group by release
      const releases = formatReleasesWithArtists(result.rows);
      console.log(`Found ${releases.length} releases via direct SQL`);
      
      // Return releases array directly in data property
      return res.status(200).json({
        success: true,
        message: `Found ${releases.length} releases`,
        data: releases
      });
    } 
    catch (sqlError) {
      console.error('SQL error:', sqlError.message);
      console.log('Falling back to Supabase REST API');
      
      // Fallback: Use Supabase REST API directly
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }
      
      const response = await fetch(`${supabaseUrl}/rest/v1/releases?select=*&order=release_date.desc.nullslast,title.asc`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Supabase REST API error: ${response.status}`);
      }
      
      const releases = await response.json();
      console.log(`Found ${releases.length} releases via Supabase REST API (without artist data)`);
      
      // Return releases array directly in data property
      return res.status(200).json({
        success: true,
        message: `Found ${releases.length} releases`,
        data: releases
      });
    }
  } 
  catch (error) {
    console.error('Error in releases endpoint:', error.message);
    
    // Always return a 200 with error details to avoid breaking the frontend
    return res.status(200).json({
      success: false,
      message: `Error fetching releases: ${error.message}`,
      data: [] // Return empty array instead of null
    });
  }
};
