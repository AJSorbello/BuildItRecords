// Serverless API handler for fetching releases
const { getPool, getTableSchema, hasColumn, logResponse } = require('../utils/db-utils');

// Initialize database connection
const pool = getPool();

module.exports = async (req, res) => {
  try {
    console.log('Processing releases request', req.query);
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // First check the schema to understand columns
      const releasesSchema = await getTableSchema(client, 'releases');
      const artistsSchema = await getTableSchema(client, 'artists');
      
      // Check if release_artists junction table exists
      let hasJunctionTable = false;
      try {
        const junctionResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'release_artists'
          )
        `);
        hasJunctionTable = junctionResult.rows[0].exists;
      } catch (err) {
        console.log('Error checking for junction table:', err.message);
      }
      
      // Log schema information
      console.log(`Releases table has ${releasesSchema.length} columns`);
      console.log(`Artists table has ${artistsSchema.length} columns`);
      console.log(`Junction table exists: ${hasJunctionTable}`);
      
      // Get available columns for dynamic query construction
      const releaseColumns = releasesSchema.map(col => col.column_name);
      console.log('Available release columns:', releaseColumns.join(', '));
      
      // Extract query parameters
      const { label, offset = 0, limit = 50 } = req.query;
      
      try {
        // Build the query based on schema discovery
        let query;
        let queryParams = [];
        
        // Check if status column exists for filtering
        const hasStatusColumn = hasColumn(releasesSchema, 'status');
        const statusFilter = hasStatusColumn ? "AND r.status = 'published'" : '';
        
        // Check if label is queried by id or label_id
        const labelColumn = hasColumn(releasesSchema, 'label_id') ? 'label_id' : 'id';
        
        if (hasJunctionTable) {
          // Use the junction table for the query if it exists
          if (label) {
            query = `
              SELECT r.*, 
                     STRING_AGG(a.name, ', ') as artist_names
              FROM releases r
              LEFT JOIN release_artists ra ON r.id = ra.release_id
              LEFT JOIN artists a ON ra.artist_id = a.id
              WHERE r.${labelColumn} = $1 ${statusFilter}
              GROUP BY r.id
              ORDER BY r.release_date DESC
              LIMIT $2 OFFSET $3
            `;
            queryParams = [label, parseInt(limit), parseInt(offset)];
          } else {
            query = `
              SELECT r.*, 
                     STRING_AGG(a.name, ', ') as artist_names
              FROM releases r
              LEFT JOIN release_artists ra ON r.id = ra.release_id
              LEFT JOIN artists a ON ra.artist_id = a.id
              ${statusFilter ? `WHERE ${statusFilter.substring(4)}` : ''}
              GROUP BY r.id
              ORDER BY r.release_date DESC
              LIMIT $1 OFFSET $2
            `;
            queryParams = [parseInt(limit), parseInt(offset)];
          }
        } else {
          // Fall back to direct query without junction table
          if (label) {
            query = `
              SELECT r.*
              FROM releases r
              WHERE r.${labelColumn} = $1 ${statusFilter}
              ORDER BY r.release_date DESC
              LIMIT $2 OFFSET $3
            `;
            queryParams = [label, parseInt(limit), parseInt(offset)];
          } else {
            query = `
              SELECT r.*
              FROM releases r
              ${statusFilter ? `WHERE ${statusFilter.substring(4)}` : ''}
              ORDER BY r.release_date DESC
              LIMIT $1 OFFSET $2
            `;
            queryParams = [parseInt(limit), parseInt(offset)];
          }
        }
        
        console.log('Executing query:', query);
        console.log('With parameters:', queryParams);
        
        const result = await client.query(query, queryParams);
        console.log(`Found ${result.rows.length} releases`);
        
        // Format response with consistent structure
        const releases = result.rows.map(release => {
          // Build a standardized release object with optional fields
          const formattedRelease = {
            id: release.id,
            title: release.title,
            artists: release.artist_names || '',
            releaseDate: release.release_date,
            artworkUrl: release.artwork_url || release.artwork_small_url || '',
            labelId: release.label_id || release.id,
            spotifyId: release.spotify_id || '',
            releaseType: release.release_type || release.type || 'album',
            totalTracks: release.total_tracks || 0,
            spotifyUrl: release.spotify_url || release.spotify_uri || '',
            createdAt: release.created_at,
            updatedAt: release.updated_at
          };
          
          return formattedRelease;
        });
        
        // Log response summary
        logResponse(releases, '/releases');
        
        // Return the formatted releases
        return res.status(200).json({ 
          releases,
          _meta: {
            count: releases.length,
            offset: parseInt(offset),
            limit: parseInt(limit),
            query: { label },
            timestamp: new Date().toISOString()
          }
        });
      } catch (queryError) {
        console.error('Primary query error:', queryError.message);
        
        // Try a fallback query if there was an error
        try {
          console.log('Attempting fallback query without complex joins');
          
          let fallbackQuery;
          let fallbackParams;
          
          if (label) {
            fallbackQuery = `
              SELECT * 
              FROM releases 
              WHERE ${hasColumn(releasesSchema, 'label_id') ? 'label_id' : 'id'} = $1
              ORDER BY release_date DESC 
              LIMIT $2 OFFSET $3
            `;
            fallbackParams = [label, parseInt(limit), parseInt(offset)];
          } else {
            fallbackQuery = `
              SELECT * 
              FROM releases 
              ORDER BY release_date DESC 
              LIMIT $1 OFFSET $2
            `;
            fallbackParams = [parseInt(limit), parseInt(offset)];
          }
          
          const fallbackResult = await client.query(fallbackQuery, fallbackParams);
          console.log(`Fallback found ${fallbackResult.rows.length} releases`);
          
          // Format the fallback response
          const fallbackReleases = fallbackResult.rows.map(release => ({
            id: release.id,
            title: release.title,
            releaseDate: release.release_date,
            artworkUrl: release.artwork_url || release.artwork_small_url || '',
            labelId: release.label_id || release.id,
            spotifyId: release.spotify_id || '',
            releaseType: release.release_type || release.type || 'album',
            createdAt: release.created_at,
            updatedAt: release.updated_at
          }));
          
          return res.status(200).json({ 
            releases: fallbackReleases,
            _meta: {
              count: fallbackReleases.length,
              fallback: true,
              error: queryError.message,
              timestamp: new Date().toISOString()
            }
          });
        } catch (fallbackError) {
          // If even the fallback fails, return the error
          console.error('Fallback query error:', fallbackError.message);
          return res.status(500).json({ 
            error: 'Database query error', 
            details: fallbackError.message,
            originalError: queryError.message
          });
        }
      }
    } finally {
      // Release the client back to the pool
      client.release();
      console.log('Database connection released');
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
