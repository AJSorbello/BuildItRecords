/**
 * Handler for the /records/artists endpoint
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

  console.log('Records Artists API called:', req.url);

  try {
    // First attempt: Use direct PostgreSQL query (more reliable)
    try {
      const pool = getPool();
      const client = await pool.connect();
      
      console.log('Connected to PostgreSQL database');
      
      // Extract label parameter
      const labelId = req.query.label;
      console.log('Label parameter:', labelId);
      
      let query;
      let queryParams = [];
      
      if (labelId) {
        // Enhanced query that properly handles all label types
        // This gets artists based on their release associations after track redistribution
        // Includes artist image columns to ensure frontend displays correctly
        query = `
          SELECT DISTINCT a.id, a.name, a.slug, a.bio, a.label_id, 
                          a.image_url, a.image_path, a.artwork_path, a.spotify_id, a.spotify_url, 
                          a.created_at, a.updated_at, a.sort_name
          FROM artists a
          JOIN release_artists ra ON a.id = ra.artist_id
          JOIN releases r ON ra.release_id = r.id
          LEFT JOIN tracks t ON t.release_id = r.id
          WHERE r.label_id = $1
          ORDER BY a.name
        `;
        console.log(`ENHANCED FILTERING: Getting artists associated with label_id = ${labelId} (includes proper image data)`);
        queryParams = [labelId];
      } else {
        // If no label parameter, get all artists with full image data
        query = `
          SELECT id, name, slug, bio, label_id, 
                 image_url, image_path, artwork_path, spotify_id, spotify_url, 
                 created_at, updated_at, sort_name
          FROM artists 
          ORDER BY name
        `;
        console.log('No label filter applied, getting all artists with image data');
      }
      
      // Execute the query with or without parameters
      const result = await (queryParams.length > 0 
        ? client.query(query, queryParams) 
        : client.query(query));
      
      client.release();
      
      console.log(`Found ${result.rows.length} artists via direct SQL${labelId ? ` for label ${labelId}` : ''}`);
      
      // Return artists array directly in data property
      return res.status(200).json({
        success: true,
        message: `Found ${result.rows.length} artists${labelId ? ` for label ${labelId}` : ''}`,
        data: result.rows
      });
    } 
    catch (sqlError) {
      console.error('SQL error:', sqlError.message);
      console.log('Falling back to Supabase REST API');
      
      // Fallback: Use Supabase REST API directly
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }
      
      const response = await fetch(`${supabaseUrl}/rest/v1/artists?select=*&order=name`, {
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
      
      const artists = await response.json();
      console.log(`Found ${artists.length} artists via Supabase REST API`);
      
      // Return artists array directly in data property
      return res.status(200).json({
        success: true,
        message: `Found ${artists.length} artists`,
        data: artists
      });
    }
  } 
  catch (error) {
    console.error('Error in artists endpoint:', error.message);
    
    // Always return a 200 with error details to avoid breaking the frontend
    return res.status(200).json({
      success: false,
      message: `Error fetching artists: ${error.message}`,
      data: [] // Return empty array instead of null
    });
  }
};
