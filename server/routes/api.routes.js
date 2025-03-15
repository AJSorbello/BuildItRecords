const express = require('express');
const router = express.Router();
const labelsRouter = require('./labels');
const { importTracksForLabel } = require('./labels');
const { Track, Artist, Release, Label } = require('../models');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test data for fallback when database connection fails
// This ensures the API responds with something meaningful even if DB is unavailable
const FALLBACK_TEST_DATA = {
  releases: Array(10).fill().map((_, i) => ({
    id: i + 1,
    title: `Release ${i + 1}`,
    artwork_url: `https://placehold.co/600x600?text=Release+${i + 1}`,
    spotify_url: `https://open.spotify.com/album/${Math.random().toString(36).substring(2, 10)}`,
    release_date: new Date(2020 + Math.floor(i/4), i % 12, 1 + (i % 28)).toISOString().split('T')[0],
    label_id: 1,
    artist_id: (i % 5) + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    artist: {
      id: (i % 5) + 1,
      name: `Artist ${(i % 5) + 1}`,
      image_url: `https://placehold.co/600x600?text=Artist+${(i % 5) + 1}`,
      spotify_url: `https://open.spotify.com/artist/${Math.random().toString(36).substring(2, 10)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  })),
  
  artists: Array(5).fill().map((_, i) => ({
    id: i + 1,
    name: `Artist ${i + 1}`,
    image_url: `https://placehold.co/600x600?text=Artist+${i + 1}`,
    spotify_url: `https://open.spotify.com/artist/${Math.random().toString(36).substring(2, 10)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    releases: Array(2).fill().map((_, j) => ({
      id: i * 2 + j + 1,
      title: `Release ${i * 2 + j + 1}`,
      artwork_url: `https://placehold.co/600x600?text=Release+${i * 2 + j + 1}`,
      spotify_url: `https://open.spotify.com/album/${Math.random().toString(36).substring(2, 10)}`,
      release_date: new Date(2020 + Math.floor(i/2), (i + j) % 12, 1 + ((i + j) % 28)).toISOString().split('T')[0],
      label_id: 1,
      artist_id: i + 1
    }))
  })),
  
  labels: [
    {
      id: 1,
      name: 'Build It Records',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]
};

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
    const { label, offset = 0, limit = 10 } = req.query;
    
    // Check if we should use test data
    if (shouldUseTestData()) {
      logger.info('Using test data for /api/releases endpoint');
      const offsetNum = parseInt(offset, 10) || 0;
      const limitNum = parseInt(limit, 10) || 10;
      
      const testReleases = FALLBACK_TEST_DATA.releases
        .slice(offsetNum, offsetNum + limitNum);
      
      return res.json({
        success: true,
        data: testReleases,
        count: FALLBACK_TEST_DATA.releases.length,
        offset: offsetNum,
        limit: limitNum
      });
    }
    
    // Debug the actual database schema first
    try {
      // Check if the releases table exists and inspect its columns
      const releasesSchema = await Release.sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'releases'
      `, { type: Release.sequelize.QueryTypes.SELECT });
      
      console.log('Releases table columns:', releasesSchema.map(col => col.column_name).join(', '));
      
      // Check labels table
      const labelsSchema = await Label.sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'labels'
      `, { type: Label.sequelize.QueryTypes.SELECT });
      
      console.log('Labels table columns:', labelsSchema.map(col => col.column_name).join(', '));
      
      // Check artists table
      const artistsSchema = await Artist.sequelize.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'artists'
      `, { type: Artist.sequelize.QueryTypes.SELECT });
      
      console.log('Artists table columns:', artistsSchema.map(col => col.column_name).join(', '));
      
      // Get some sample data
      const sampleRelease = await Release.sequelize.query(`
        SELECT * FROM releases LIMIT 1
      `, { type: Release.sequelize.QueryTypes.SELECT });
      
      console.log('Sample release data:', sampleRelease.length > 0 ? JSON.stringify(sampleRelease[0]) : 'No releases found');
      
      // Check if any labels exist
      const labels = await Label.sequelize.query(`
        SELECT id, name FROM labels
      `, { type: Label.sequelize.QueryTypes.SELECT });
      
      console.log('Available labels:', labels.map(l => `${l.name} (${l.id})`).join(', '));
    } catch (schemaError) {
      console.error('Error inspecting schema:', schemaError);
    }
    
    const whereClause = {};
    let releases = [];
    let total = 0;
    
    try {
      if (label) {
        whereClause.labelId = label;
        console.log('Filtering by label:', label);
      }
      
      // Try to get releases using ORM first
      console.log('Attempting to fetch releases using ORM...');
      releases = await Release.findAll({
        where: whereClause,
        include: [
          {
            model: Artist,
            as: 'artist',
            attributes: ['id', 'name']
          }
        ],
        offset: parseInt(offset, 10),
        limit: parseInt(limit, 10),
        order: [['releaseDate', 'DESC']]
      });
      
      total = await Release.count({ where: whereClause });
      console.log(`Found ${releases.length} releases using ORM out of total ${total}`);
    } catch (ormError) {
      console.error('Error using ORM to fetch releases:', ormError);
      
      // Fall back to raw SQL without joins if ORM approach fails
      try {
        console.log('Falling back to raw SQL...');
        let query = '';
        let params = [];
        
        if (label) {
          // Try label_id first (the most common schema)
          query = `
            SELECT r.*, a.name as artist_name 
            FROM releases r
            LEFT JOIN artists a ON r.primary_artist_id = a.id OR r.artist_id = a.id
            LEFT JOIN labels l ON l.id = $1
            ORDER BY r.release_date DESC
            LIMIT $2 OFFSET $3
          `;
          params = [label, parseInt(limit, 10), parseInt(offset, 10)];
        } else {
          query = `
            SELECT r.*, a.name as artist_name
            FROM releases r
            LEFT JOIN artists a ON r.primary_artist_id = a.id OR r.artist_id = a.id
            ORDER BY r.release_date DESC
            LIMIT $1 OFFSET $2
          `;
          params = [parseInt(limit, 10), parseInt(offset, 10)];
        }
        
        console.log('Executing SQL query:', query, 'with params:', params);
        releases = await Release.sequelize.query(query, { 
          replacements: params,
          type: Release.sequelize.QueryTypes.SELECT 
        });
        
        console.log(`Found ${releases.length} releases using raw SQL`);
      } catch (sqlError) {
        console.error('Error with raw SQL query:', sqlError);
        
        // Last resort: just get basic releases without joins
        try {
          console.log('Trying simplest query as last resort...');
          const simpleQuery = `
            SELECT * FROM releases 
            ORDER BY release_date DESC 
            LIMIT $1 OFFSET $2
          `;
          
          releases = await Release.sequelize.query(simpleQuery, {
            replacements: [parseInt(limit, 10), parseInt(offset, 10)],
            type: Release.sequelize.QueryTypes.SELECT
          });
          
          console.log(`Found ${releases.length} releases using simplest query`);
        } catch (lastError) {
          console.error('All query attempts failed:', lastError);
          return res.status(500).json({ 
            error: 'Could not retrieve releases', 
            details: lastError.message
          });
        }
      }
    }
    
    // Format the response
    const formattedReleases = releases.map(release => {
      let artistName = 'Unknown Artist';
      if (release.artist && release.artist.name) {
        artistName = release.artist.name;
      } else if (release.artist_name) {
        artistName = release.artist_name;
      }
      
      return {
        id: release.id,
        title: release.title || 'Unknown Title',
        artistId: release.artist_id || release.artistId || (release.artist ? release.artist.id : null),
        artistName,
        releaseDate: release.release_date || release.releaseDate,
        type: release.release_type || release.type || 'single',
        imageUrl: release.artwork_url || release.imageUrl || '',
        catalogNumber: release.catalog_number || release.catalogNumber || '',
        createdAt: release.created_at || release.createdAt,
        updatedAt: release.updated_at || release.updatedAt
      };
    });
    
    return res.status(200).json({
      releases: formattedReleases,
      total,
      count: formattedReleases.length
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
    const { label = null, offset = 0, limit = 10 } = req.query;
    
    // Check if we should use test data
    if (shouldUseTestData()) {
      logger.info('Using test data for /api/artists endpoint');
      const offsetNum = parseInt(offset, 10) || 0;
      const limitNum = parseInt(limit, 10) || 10;
      
      const testArtists = FALLBACK_TEST_DATA.artists
        .slice(offsetNum, offsetNum + limitNum);
      
      return res.json({
        success: true,
        data: testArtists,
        count: FALLBACK_TEST_DATA.artists.length,
        offset: offsetNum,
        limit: limitNum
      });
    }
    
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
    
    const whereClause = {};
    let artists = [];
    let total = 0;
    
    try {
      if (label) {
        whereClause.labelId = label;
        console.log('Filtering by label:', label);
      }
      
      // Try to get artists using ORM first
      console.log('Attempting to fetch artists using ORM...');
      artists = await Artist.findAll({
        where: whereClause,
        include: [
          {
            model: Release,
            as: 'releases',
            attributes: ['id', 'title', 'release_date']
          }
        ],
        offset: parseInt(offset, 10),
        limit: parseInt(limit, 10),
        order: [['name', 'ASC']]
      });
      
      total = await Artist.count({ where: whereClause });
      console.log(`Found ${artists.length} artists using ORM out of total ${total}`);
    } catch (ormError) {
      console.error('Error using ORM to fetch artists:', ormError);
      
      // Fall back to raw SQL without joins if ORM approach fails
      try {
        console.log('Falling back to raw SQL...');
        let query = '';
        let params = [];
        
        if (label) {
          // Try label_id first (the most common schema)
          query = `
            SELECT a.*, r.title as release_title, r.release_date 
            FROM artists a
            LEFT JOIN releases r ON a.id = r.artist_id
            LEFT JOIN labels l ON l.id = $1
            ORDER BY a.name ASC
            LIMIT $2 OFFSET $3
          `;
          params = [label, parseInt(limit, 10), parseInt(offset, 10)];
        } else {
          query = `
            SELECT a.*, r.title as release_title, r.release_date 
            FROM artists a
            LEFT JOIN releases r ON a.id = r.artist_id
            ORDER BY a.name ASC
            LIMIT $1 OFFSET $2
          `;
          params = [parseInt(limit, 10), parseInt(offset, 10)];
        }
        
        console.log('Executing SQL query:', query, 'with params:', params);
        artists = await Artist.sequelize.query(query, { 
          replacements: params,
          type: Artist.sequelize.QueryTypes.SELECT 
        });
        
        console.log(`Found ${artists.length} artists using raw SQL`);
      } catch (sqlError) {
        console.error('Error with raw SQL query:', sqlError);
        
        // Last resort: just get basic artists without joins
        try {
          console.log('Trying simplest query as last resort...');
          const simpleQuery = `
            SELECT * FROM artists 
            ORDER BY name ASC 
            LIMIT $1 OFFSET $2
          `;
          
          artists = await Artist.sequelize.query(simpleQuery, {
            replacements: [parseInt(limit, 10), parseInt(offset, 10)],
            type: Artist.sequelize.QueryTypes.SELECT
          });
          
          console.log(`Found ${artists.length} artists using simplest query`);
        } catch (lastError) {
          console.error('All query attempts failed:', lastError);
          return res.status(500).json({ 
            error: 'Could not retrieve artists', 
            details: lastError.message
          });
        }
      }
    }
    
    // Format the response
    const formattedArtists = artists.map(artist => {
      return {
        id: artist.id,
        name: artist.name,
        image_url: artist.image_url || '',
        spotify_url: artist.spotify_url || '',
        created_at: artist.created_at || artist.createdAt,
        updated_at: artist.updated_at || artist.updatedAt,
        releases: artist.releases || []
      };
    });
    
    return res.status(200).json({
      artists: formattedArtists,
      total,
      count: formattedArtists.length
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
    
    // Check if we should use test data
    if (shouldUseTestData()) {
      logger.info(`Using test data for /api/artist/${artistId} endpoint`);
      const artist = FALLBACK_TEST_DATA.artists.find(a => a.id.toString() === artistId.toString());
      
      if (!artist) {
        return res.status(404).json({ success: false, error: 'Artist not found' });
      }
      
      return res.json({
        success: true,
        data: artist
      });
    }
    
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
