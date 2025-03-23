const express = require('express');
const router = express.Router();
const labelsRouter = require('./labels');
const { importTracksForLabel } = require('./labels');
const { Track, Artist, Release, Label } = require('../models');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Function to determine if we should use test data
const shouldUseTestData = () => {
  return global.USE_TEST_DATA === true || process.env.USE_TEST_DATA === 'true';
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.error('Invalid token:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  });
};

// Import route handlers
const tracksRouter = require('./tracks');
const artistsRouter = require('./artists');
const releasesRouter = require('./releases');
const adminRouter = require('./admin');
const submitDemoRouter = require('./submit-demo');

// Mount route handlers
router.use('/tracks', tracksRouter);
router.use('/labels', labelsRouter);
router.use('/artists', artistsRouter);
router.use('/releases', releasesRouter);
router.use('/admin', adminRouter);
router.use('/submit-demo', submitDemoRouter); // Mount at /api/submit-demo instead of /

// Import tracks for a label
router.post('/labels/:labelId/import', authenticateToken, async (req, res) => {
  const { labelId } = req.params;

  logger.info('Import route hit:', {
    url: req.url,
    method: req.method,
    labelId,
    params: req.params,
    token: req.headers.authorization ? 'present' : 'missing'
  });

  try {
    logger.info('Starting import process in API route', { labelId });
    const result = await importTracksForLabel(labelId);
    logger.info('Import completed successfully in API route', { result });
    res.json(result);
  } catch (error) {
    logger.error('Error in import route:', error);
    res.status(500).json({ 
      error: 'Failed to import tracks',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get top releases for a label
router.get('/labels/:labelId/releases/top', async (req, res) => {
  try {
    const { labelId } = req.params;
    const limit = 10;

    // Ensure labelId is numeric
    const numericLabelId = parseInt(labelId, 10);
    if (isNaN(numericLabelId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid label ID. Must be a number.'
      });
    }

    // First check if the label exists
    const label = await Label.findByPk(numericLabelId);
    if (!label) {
      return res.status(404).json({
        success: false,
        error: 'Label not found'
      });
    }

    const releases = await Release.findAll({
      where: {
        label_id: numericLabelId,
        status: 'published'
      },
      include: [
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] },
          attributes: ['id', 'name', 'spotify_url', 'profile_image_url']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: ['id', 'name', 'spotify_url', 'spotify_uri', 'preview_url', 'popularity']
        }
      ],
      order: [
        [{ model: Track, as: 'tracks' }, 'popularity', 'DESC']
      ],
      limit
    });

    res.json({
      success: true,
      releases: releases.map(release => ({
        ...release.toJSON(),
        popularity: Math.max(...(release.tracks?.map(track => track.popularity) || [0]))
      }))
    });
  } catch (error) {
    logger.error('Error getting top releases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top releases'
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/releases
router.get('/releases', async (req, res) => {
  try {
    console.log('GET /api/releases - Query params:', req.query);
    const { label, offset = 0, limit = 50 } = req.query; // Increased default limit to 50 releases
    
    // Log query parameters
    console.log(`Fetching releases for label: ${label}, limit: ${limit}, offset: ${offset}`);
    
    let releases = [];
    let totalCount = 0;
    let queryType = 'unknown';
    
    try {
      if (label) {
        // Enhanced query with proper joins
        console.log('Using enhanced query to find releases for label:', label);
        
        const query = `
          SELECT r.*, array_agg(a.name) as artist_names, array_agg(a.id) as artist_ids 
          FROM releases r
          LEFT JOIN release_artists ra ON r.id = ra.release_id
          LEFT JOIN artists a ON ra.artist_id = a.id
          WHERE r.label_id = $1
          GROUP BY r.id
          ORDER BY r.release_date DESC NULLS LAST, r.title ASC
          LIMIT $2 OFFSET $3
        `;
        
        // Count query for pagination
        const countQuery = `
          SELECT COUNT(*) as total FROM releases WHERE label_id = $1
        `;
        
        console.log('Executing enhanced label query with params:', [label, limit, offset]);
        
        // Get releases with pagination
        releases = await Release.sequelize.query(query, { 
          replacements: [label, parseInt(limit, 10), parseInt(offset, 10)],
          type: Release.sequelize.QueryTypes.SELECT 
        });
        
        // Get total count
        const countResult = await Release.sequelize.query(countQuery, {
          replacements: [label],
          type: Release.sequelize.QueryTypes.SELECT
        });
        
        totalCount = countResult[0].total;
        queryType = 'label-join';
        
        console.log(`Found ${releases.length} releases out of ${totalCount} total for label ${label}`);
      } else {
        // If no label specified, get all releases
        console.log('No label specified, getting all releases');
        
        // Enhanced query for all releases
        const query = `
          SELECT r.*, array_agg(a.name) as artist_names, array_agg(a.id) as artist_ids 
          FROM releases r
          LEFT JOIN release_artists ra ON r.id = ra.release_id
          LEFT JOIN artists a ON ra.artist_id = a.id
          GROUP BY r.id
          ORDER BY r.release_date DESC NULLS LAST, r.title ASC
          LIMIT $1 OFFSET $2
        `;
        
        // Count query for pagination
        const countQuery = `
          SELECT COUNT(*) as total FROM releases
        `;
        
        // Get releases with pagination
        releases = await Release.sequelize.query(query, {
          replacements: [parseInt(limit, 10), parseInt(offset, 10)],
          type: Release.sequelize.QueryTypes.SELECT
        });
        
        // Get total count
        const countResult = await Release.sequelize.query(countQuery, {
          type: Release.sequelize.QueryTypes.SELECT
        });
        
        totalCount = countResult[0].total;
        queryType = 'all-join';
        
        console.log(`Found ${releases.length} releases out of ${totalCount} total`);
      }
    } catch (error) {
      console.error('Error fetching releases:', error);
      
      // Fall back to simple query if join fails
      console.log('Falling back to simple query');
      try {
        const simpleQuery = `
          SELECT * FROM releases 
          ${label ? 'WHERE label_id = $1' : ''}
          ORDER BY release_date DESC NULLS LAST, title ASC
          LIMIT $${label ? '2' : '1'} OFFSET $${label ? '3' : '2'}
        `;
        
        const params = label 
          ? [label, parseInt(limit, 10), parseInt(offset, 10)]
          : [parseInt(limit, 10), parseInt(offset, 10)];
          
        releases = await Release.sequelize.query(simpleQuery, {
          replacements: params,
          type: Release.sequelize.QueryTypes.SELECT
        });
        
        const countQuery = `
          SELECT COUNT(*) as total FROM releases 
          ${label ? 'WHERE label_id = $1' : ''}
        `;
        
        const countParams = label ? [label] : [];
        const countResult = await Release.sequelize.query(countQuery, {
          replacements: countParams,
          type: Release.sequelize.QueryTypes.SELECT
        });
        
        totalCount = countResult[0].total;
        queryType = 'fallback';
        
        console.log(`Found ${releases.length} releases using fallback query`);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve releases',
          message: fallbackError.message
        });
      }
    }
    
    // Format the response
    const formattedReleases = releases.map(release => {
      // Handle both Sequelize objects and raw query results
      const releaseData = release.toJSON ? release.toJSON() : release;
      
      // Process artist names and IDs from array_agg
      let artistNames = [];
      let artistIds = [];
      
      if (releaseData.artist_names && Array.isArray(releaseData.artist_names)) {
        // Remove null values and duplicates
        artistNames = [...new Set(releaseData.artist_names.filter(n => n))]
      }
      
      if (releaseData.artist_ids && Array.isArray(releaseData.artist_ids)) {
        // Remove null values and duplicates
        artistIds = [...new Set(releaseData.artist_ids.filter(id => id))];
      }
      
      // Create a formatted object
      return {
        id: releaseData.id,
        title: releaseData.title,
        release_date: releaseData.release_date,
        release_type: releaseData.release_type,
        artwork_url: releaseData.artwork_url || `https://via.placeholder.com/400x400.png?text=${encodeURIComponent(releaseData.title || 'Album')}`,
        spotify_url: releaseData.spotify_url,
        label_id: releaseData.label_id,
        created_at: releaseData.created_at || releaseData.createdAt,
        updated_at: releaseData.updated_at || releaseData.updatedAt,
        primary_artist_id: releaseData.primary_artist_id,
        // Include artist information when available from query
        artist_names: artistNames,
        artist_ids: artistIds
      };
    });
    
    return res.status(200).json({
      success: true,
      data: formattedReleases, // Include data for compatibility
      releases: formattedReleases,
      total: totalCount,
      count: formattedReleases.length,
      offset: parseInt(offset, 10),
      limit: parseInt(limit, 10),
      label: label,
      query_type: queryType,
      message: `Retrieved ${formattedReleases.length} releases${label ? ' for label ' + label : ''} (${queryType} query)`
    });
  } catch (error) {
    console.error('Error in /api/releases:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/artists
router.get('/artists', async (req, res) => {
  try {
    console.log('GET /api/artists - Query params:', req.query);
    const { label = null, offset = 0, limit = 100 } = req.query; // Increased default limit to 100
    
    // Log query parameters
    console.log(`Fetching artists for label: ${label}, limit: ${limit}, offset: ${offset}`);
    
    let artists = [];
    let totalCount = 0;
    let queryType = 'unknown';
    
    try {
      if (label) {
        // ENHANCED JOIN QUERY: Get artists associated with a label either directly or through releases
        console.log('Using enhanced join query to find artists by label relationship');
        
        const query = `
          WITH label_artists AS (
            -- Artists directly assigned to the label
            SELECT DISTINCT a.* 
            FROM artists a
            WHERE a.label_id = $1
            
            UNION
            
            -- Artists with releases on the label (via junction table)
            SELECT DISTINCT a.* 
            FROM artists a
            JOIN release_artists ra ON a.id = ra.artist_id
            JOIN releases r ON ra.release_id = r.id
            WHERE r.label_id = $1
          )
          SELECT * FROM label_artists
          ORDER BY name ASC
          LIMIT $2 OFFSET $3
        `;
        
        // Count query to get total artists for pagination
        const countQuery = `
          WITH label_artists AS (
            -- Artists directly assigned to the label
            SELECT DISTINCT a.id 
            FROM artists a
            WHERE a.label_id = $1
            
            UNION
            
            -- Artists with releases on the label (via junction table)
            SELECT DISTINCT a.id 
            FROM artists a
            JOIN release_artists ra ON a.id = ra.artist_id
            JOIN releases r ON ra.release_id = r.id
            WHERE r.label_id = $1
          )
          SELECT COUNT(*) as total FROM label_artists
        `;
        
        console.log('Executing enhanced label query with params:', [label, limit, offset]);
        
        // Get artists with pagination
        artists = await Artist.sequelize.query(query, { 
          replacements: [label, parseInt(limit, 10), parseInt(offset, 10)],
          type: Artist.sequelize.QueryTypes.SELECT 
        });
        
        // Get total count
        const countResult = await Artist.sequelize.query(countQuery, {
          replacements: [label],
          type: Artist.sequelize.QueryTypes.SELECT
        });
        
        totalCount = countResult[0].total;
        queryType = 'label-join';
        
        console.log(`Found ${artists.length} artists out of ${totalCount} total for label ${label}`);
      } else {
        // If no label specified, get all artists
        console.log('No label specified, getting all artists');
        
        // Simple query for all artists
        artists = await Artist.findAll({
          limit: parseInt(limit, 10),
          offset: parseInt(offset, 10),
          order: [['name', 'ASC']]
        });
        
        totalCount = await Artist.count();
        queryType = 'all';
        
        console.log(`Found ${artists.length} artists out of ${totalCount} total`);
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
      
      // Fall back to simple query if join fails
      console.log('Falling back to simple query');
      try {
        const simpleQuery = `
          SELECT * FROM artists 
          ${label ? 'WHERE label_id = $1' : ''}
          ORDER BY name ASC 
          LIMIT $${label ? '2' : '1'} OFFSET $${label ? '3' : '2'}
        `;
        
        const params = label 
          ? [label, parseInt(limit, 10), parseInt(offset, 10)]
          : [parseInt(limit, 10), parseInt(offset, 10)];
          
        artists = await Artist.sequelize.query(simpleQuery, {
          replacements: params,
          type: Artist.sequelize.QueryTypes.SELECT
        });
        
        const countQuery = `
          SELECT COUNT(*) as total FROM artists 
          ${label ? 'WHERE label_id = $1' : ''}
        `;
        
        const countParams = label ? [label] : [];
        const countResult = await Artist.sequelize.query(countQuery, {
          replacements: countParams,
          type: Artist.sequelize.QueryTypes.SELECT
        });
        
        totalCount = countResult[0].total;
        queryType = 'fallback';
        
        console.log(`Found ${artists.length} artists using fallback query`);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve artists',
          message: fallbackError.message
        });
      }
    }
    
    // Format the response
    const formattedArtists = artists.map(artist => {
      // Handle both Sequelize objects and raw query results
      const artistData = artist.toJSON ? artist.toJSON() : artist;
      
      return {
        id: artistData.id,
        name: artistData.name,
        image_url: artistData.profile_image_url || artistData.image_url || '',
        spotify_url: artistData.spotify_url || '',
        spotify_id: artistData.spotify_id || '',
        profile_image_url: artistData.profile_image_url || '',
        created_at: artistData.created_at || artistData.createdAt,
        updated_at: artistData.updated_at || artistData.updatedAt,
        label_id: artistData.label_id
      };
    });
    
    return res.status(200).json({
      success: true,
      data: formattedArtists, // Include data for compatibility
      artists: formattedArtists,
      total: totalCount,
      count: formattedArtists.length,
      offset: parseInt(offset, 10),
      limit: parseInt(limit, 10),
      label: label,
      query_type: queryType,
      message: `Retrieved ${formattedArtists.length} artists${label ? ' for label ' + label : ''} (${queryType} query)`
    });
  } catch (error) {
    console.error('Error in /api/artists:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/artist/:id
router.get('/artist/:id', async (req, res) => {
  try {
    const artistId = req.params.id;
    console.log(`GET /api/artist/${artistId}`);
    
    // Debug the actual database schema first
    try {
      // Check if the artists table exists and inspect its columns
      const artistsSchema = await Artist.sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'artists'
      `, { type: Artist.sequelize.QueryTypes.SELECT });
      
      console.log('Artists table columns:', artistsSchema.map(col => col.column_name).join(', '));
      
      // Check releases table
      const releasesSchema = await Release.sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'releases'
      `, { type: Release.sequelize.QueryTypes.SELECT });
      
      console.log('Releases table columns:', releasesSchema.map(col => col.column_name).join(', '));
      
      // Get some sample data
      const sampleArtist = await Artist.sequelize.query(`
        SELECT * FROM artists LIMIT 1
      `, { type: Artist.sequelize.QueryTypes.SELECT });
      
      console.log('Sample artist data:', sampleArtist.length > 0 ? JSON.stringify(sampleArtist[0]) : 'No artists found');
      
      // Check if any labels exist
      const labels = await Label.sequelize.query(`
        SELECT id, name FROM labels
      `, { type: Label.sequelize.QueryTypes.SELECT });
      
      console.log('Available labels:', labels.map(l => `${l.name} (${l.id})`).join(', '));
    } catch (schemaError) {
      console.error('Error inspecting schema:', schemaError);
    }
    
    let artist = null;
    
    try {
      // Try to get artist using ORM first
      console.log('Attempting to fetch artist using ORM...');
      artist = await Artist.findByPk(artistId, {
        include: [
          {
            model: Release,
            as: 'releases',
            attributes: ['id', 'title', 'release_date']
          }
        ]
      });
      
      console.log(`Found artist using ORM: ${artist ? 'yes' : 'no'}`);
    } catch (ormError) {
      console.error('Error using ORM to fetch artist:', ormError);
      
      // Fall back to raw SQL without joins if ORM approach fails
      try {
        console.log('Falling back to raw SQL...');
        const query = `
          SELECT a.*, r.title as release_title, r.release_date 
          FROM artists a
          LEFT JOIN releases r ON a.id = r.artist_id
          WHERE a.id = $1
        `;
        
        console.log('Executing SQL query:', query, 'with params:', [artistId]);
        artist = await Artist.sequelize.query(query, { 
          replacements: [artistId],
          type: Artist.sequelize.QueryTypes.SELECT 
        });
        
        console.log(`Found artist using raw SQL: ${artist.length > 0 ? 'yes' : 'no'}`);
      } catch (sqlError) {
        console.error('Error with raw SQL query:', sqlError);
        
        // Last resort: just get basic artist without joins
        try {
          console.log('Trying simplest query as last resort...');
          const simpleQuery = `
            SELECT * FROM artists 
            WHERE id = $1
          `;
          
          artist = await Artist.sequelize.query(simpleQuery, {
            replacements: [artistId],
            type: Artist.sequelize.QueryTypes.SELECT
          });
          
          console.log(`Found artist using simplest query: ${artist.length > 0 ? 'yes' : 'no'}`);
        } catch (lastError) {
          console.error('All query attempts failed:', lastError);
          return res.status(500).json({ 
            error: 'Could not retrieve artist', 
            details: lastError.message
          });
        }
      }
    }
    
    if (!artist) {
      return res.status(404).json({ success: false, error: 'Artist not found' });
    }
    
    // Format the response
    const formattedArtist = {
      id: artist.id,
      name: artist.name,
      image_url: artist.image_url || '',
      spotify_url: artist.spotify_url || '',
      created_at: artist.created_at || artist.createdAt,
      updated_at: artist.updated_at || artist.updatedAt,
      releases: artist.releases || []
    };
    
    return res.status(200).json({
      success: true,
      data: formattedArtist
    });
  } catch (error) {
    console.error('Error in /api/artist/:id:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
