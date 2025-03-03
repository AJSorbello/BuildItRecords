const express = require('express');
const router = express.Router();
const { Release, Artist, Track, Label, sequelize } = require('../models');
const { Op } = require('sequelize');
const { query, validationResult } = require('express-validator');
const getSpotifyService = require('../services/SpotifyService');
const logger = require('../utils/logger');

// Error handling helper with more detailed error information
const handleError = (res, error) => {
  logger.error('Error in releases route:', error);
  console.error('Full error details:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    original: error.original ? {
      message: error.original.message,
      code: error.original.code,
    } : null
  });
  
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? {
      name: error.name,
      stack: error.stack,
      code: error.code
    } : undefined
  });
};

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Get top releases by label
router.get('/top', [
  query('label').isString().notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { label } = req.query;
    const limit = 10;

    if (!label) {
      return res.status(400).json({ error: 'Label ID is required' });
    }

    // First check if label exists
    const labelExists = await Label.findOne({
      where: { id: label }
    });

    if (!labelExists) {
      return res.status(404).json({
        success: false,
        error: 'Label not found'
      });
    }

    // Get releases with tracks
    const releases = await Release.findAll({
      where: {
        label_id: label,
        status: 'active'
      },
      include: [
        {
          model: Track,
          as: 'tracks',
          required: true,
          attributes: ['spotify_popularity'],
          include: [
            {
              model: Artist,
              as: 'artists',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            }
          ]
        }
      ],
      attributes: [
        'id',
        'title',
        'release_date',
        'artwork_url',
        'spotify_url',
        'total_tracks'
      ],
      order: [['release_date', 'DESC']],
      limit
    });

    if (releases.length === 0) {
      return res.json({
        success: true,
        releases: [],
        totalReleases: 0
      });
    }

    // Calculate average popularity and sort
    const releasesWithPopularity = releases.map(release => {
      const avgPopularity = release.tracks.reduce((sum, track) => sum + (track.spotify_popularity || 0), 0) / release.tracks.length;
      return {
        ...release.toJSON(),
        avg_popularity: avgPopularity
      };
    }).sort((a, b) => b.avg_popularity - a.avg_popularity);

    // Get the IDs in order
    const releaseIds = releasesWithPopularity.map(r => r.id);

    // Fetch full release data with all associations
    const fullReleases = await Release.findAll({
      where: {
        id: releaseIds
      },
      include: [
        {
          model: Artist,
          as: 'artists',
          attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: ['id', 'title', 'duration_ms', 'preview_url', 'spotify_url', 'spotify_id', 'track_number', 'disc_number', 'isrc', 'spotify_popularity', 'external_urls', 'explicit', 'remixer_id', 'created_at', 'updated_at'],
          include: [
            {
              model: Artist,
              as: 'artists',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            }
          ]
        }
      ]
    });

    // Sort fullReleases to match the order of releaseIds
    const sortedReleases = releaseIds.map(id => 
      fullReleases.find(release => release.id === id)
    );

    res.json({
      success: true,
      releases: sortedReleases,
      totalReleases: sortedReleases.length
    });
  } catch (error) {
    logger.error('Error in releases route:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    handleError(res, error);
  }
});

// Get releases by label ID with pagination and sorting
router.get('/', [
    query('label').optional().isString(),
    query('offset').optional().isInt({ min: 0 }).toInt().default(0),
    query('limit').optional().isInt({ min: 1, max: 500 }).toInt().default(500),
    query('sort').optional().isString().default('release_date'),
    query('order').optional().isString().isIn(['asc', 'desc']).default('desc'),
    validateRequest
], async (req, res) => {
    try {
        const { label, offset = 0, limit = 500, sort = 'release_date', order = 'desc' } = req.query;
        
        logger.info('GET /releases request:', { label, offset, limit, sort, order });
        console.log('Database connection status:', sequelize.authenticate ? 'Ready' : 'Not initialized');

        // Add diagnostic logging for Vercel environment
        if (process.env.VERCEL) {
          console.log('Vercel environment detected in releases route');
          console.log('Database config:', {
            host: process.env.DB_HOST || process.env.POSTGRES_HOST,
            database: process.env.DB_NAME || process.env.POSTGRES_DATABASE,
            usingConnectionString: !!process.env.POSTGRES_URL
          });
        }

        const where = {
          status: 'active'  // Only show active releases
        };
        if (label) {
          where.label_id = label;
        }

        // Log the query we're about to run
        console.log('Running release query with:', {
          where,
          offset,
          limit,
          sort,
          order
        });

        const { count, rows } = await Release.findAndCountAll({
          where,
          attributes: [
            'id',
            'title',
            'release_type',
            'release_date',
            'artwork_url',
            'artwork_small_url',
            'artwork_large_url',
            'spotify_url',
            'spotify_id',
            'external_urls',
            'created_at',
            'updated_at',
            'status'
          ],
          include: [
            {
              model: Artist,
              as: 'artists',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            },
            {
              model: Track,
              as: 'tracks',
              attributes: ['id', 'title', 'duration_ms', 'preview_url', 'spotify_url', 'spotify_id', 'track_number', 'disc_number', 'isrc', 'spotify_popularity', 'external_urls', 'explicit', 'remixer_id', 'created_at', 'updated_at'],
              include: [
                {
                  model: Artist,
                  as: 'artists',
                  attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
                }
              ]
            }
          ],
          order: [[sort, order]],
          offset,
          limit
        });

        console.log(`Query complete, found ${count} total releases, returning ${rows.length} releases`);

        return res.json({
          success: true,
          releases: rows,
          totalReleases: count,
          offset,
          limit
        });
    } catch (error) {
        logger.error('Error fetching releases:', error);
        console.error('Database query failed:', error.message);
        if (error.original) {
          console.error('Original database error:', error.original);
        }
        handleError(res, error);
    }
});

// Get a single release by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`GET /releases/${id}`);

    const release = await Release.findByPk(id, {
      include: [
        {
          model: Track,
          as: 'tracks',
          include: [
            {
              model: Artist,
              as: 'artists',
              through: { attributes: [] },
              attributes: [
                'id', 
                'name', 
                'type', 
                'uri', 
                'profile_image_url',
                'profile_image_small_url',
                'profile_image_large_url'
              ]
            },
            {
              model: Artist,
              as: 'remixer',
              attributes: [
                'id', 
                'name', 
                'type', 
                'uri', 
                'profile_image_url',
                'profile_image_small_url',
                'profile_image_large_url'
              ]
            }
          ]
        },
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] },
          attributes: [
            'id', 
            'name', 
            'type', 
            'uri', 
            'profile_image_url',
            'profile_image_small_url',
            'profile_image_large_url'
          ]
        }
      ],
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      }
    });

    if (!release) {
      return res.status(404).json({ message: 'Release not found' });
    }

    // Log information about the artists for debugging
    console.log(`Release ${release.title} artists count:`, release.artists ? release.artists.length : 0);
    
    // Extract artists from tracks if release doesn't have its own artists
    if ((!release.artists || release.artists.length === 0) && 
        release.tracks && release.tracks.length > 0) {
      console.log('No release artists found, extracting artists from tracks');
      
      // Create a map to ensure unique artists
      const artistsMap = new Map();
      
      // Go through all tracks
      release.tracks.forEach(track => {
        if (track.artists && track.artists.length > 0) {
          track.artists.forEach(artist => {
            if (!artistsMap.has(artist.id)) {
              artistsMap.set(artist.id, artist);
            }
          });
        }
      });
      
      // Set the release artists
      if (artistsMap.size > 0) {
        console.log(`Found ${artistsMap.size} unique artists from tracks`);
        release.artists = Array.from(artistsMap.values());
      }
    }

    return res.json({ release });
  } catch (error) {
    logger.error('Error fetching release:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    handleError(res, error);
  }
});

// Import releases from Spotify
router.post('/:labelId/import', async (req, res) => {
  try {
    const { labelId } = req.params;
    
    // Find the label
    const label = await Label.findOne({
      where: {
        [Op.or]: [
          { id: labelId },
          { slug: labelId }
        ]
      }
    });

    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }

    // Get Spotify service instance
    const spotifyService = getSpotifyService();

    // Search and import releases
    console.log('Starting Spotify search for label:', label.name);
    const albums = await spotifyService.searchReleases(labelId);
    console.log(`Found ${albums.length} releases, starting import...`);

    // Start a new transaction
    const t = await sequelize.transaction();
    
    try {
      // Import the releases
      await spotifyService.importReleases(label, albums, t);

      // Return the imported releases
      const { count, rows: releases } = await Release.findAndCountAll({
        where: { label_id: label.id },
        include: [
          {
            model: Artist,
            as: 'artists',
            attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
          },
          {
            model: Track,
            as: 'tracks',
            attributes: ['id', 'title', 'duration_ms', 'preview_url', 'spotify_url', 'spotify_id', 'track_number', 'disc_number', 'isrc', 'spotify_popularity', 'external_urls', 'explicit', 'remixer_id', 'created_at', 'updated_at'],
            include: [
              {
                model: Artist,
                as: 'artists',
                attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
              }
            ]
          }
        ],
        order: [['release_date', 'DESC']],
        transaction: t
      });

      // Commit the transaction
      await t.commit();

      console.log(`Successfully imported ${count} releases for label: ${label.name}`);

      res.json({
        success: true,
        message: `Successfully imported ${albums.length} releases`,
        totalReleases: count,
        releases
      });
    } catch (error) {
      // Rollback transaction on error
      await t.rollback();
      console.error('Error importing releases:', error);
      console.error('Database query failed:', error.message);
      if (error.original) {
        console.error('Original database error:', error.original);
      }
      handleError(res, error);
    }
  } catch (error) {
    console.error('Error importing releases:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    handleError(res, error);
  }
});

// GET /api/releases/label/:labelId
router.get('/label/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    logger.info('Looking up label with ID/slug:', labelId);
    
    // First check if the label exists
    const allLabels = await Label.findAll();
    logger.info('All labels in database:', allLabels.map(l => ({ id: l.id, slug: l.slug })));
    
    // Find the label by id or slug
    const label = await Label.findOne({
      where: {
        [Op.or]: [
          { id: labelId },
          { slug: labelId }
        ]
      },
      logging: console.log // Log the SQL query
    });

    logger.info('Found label:', label?.toJSON());

    if (!label) {
      logger.warn('Label not found for ID/slug:', labelId);
      return res.status(404).json({ success: false, error: 'Label not found' });
    }

    // Get total counts first with detailed logging
    const releasesCount = await Release.count({
      where: { label_id: label.id }
    });
    logger.info('Raw releases count:', releasesCount);

    const publishedReleasesCount = await Release.count({
      where: { 
        label_id: label.id,
        status: 'published'
      }
    });
    logger.info('Published releases count:', publishedReleasesCount);

    const tracksCount = await Track.count({
      where: { 
        label_id: label.id
      }
    });
    logger.info('Raw tracks count:', tracksCount);

    const publishedTracksCount = await Track.count({
      where: { 
        label_id: label.id,
        status: 'published'
      }
    });
    logger.info('Published tracks count:', publishedTracksCount);

    // Get all releases with detailed logging
    const releases = await Release.findAll({
      where: { 
        label_id: label.id,
        status: 'published' // Only get published releases
      },
      attributes: ['id', 'title', 'release_date', 'artwork_url', 'artwork_small_url', 'artwork_large_url', 'spotify_url', 'label_id', 'total_tracks', 'status', 'created_at', 'updated_at'],
      include: [
        {
          model: Artist,
          as: 'artists',
          attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: ['id', 'title', 'duration_ms', 'preview_url', 'spotify_url', 'spotify_id', 'track_number', 'disc_number', 'isrc', 'spotify_popularity', 'external_urls', 'explicit', 'remixer_id', 'created_at', 'updated_at'],
          required: false,
          include: [
            {
              model: Artist,
              as: 'artists',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            },
            {
              model: Artist,
              as: 'remixer',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            }
          ]
        }
      ],
      order: [['release_date', 'DESC']],
      logging: console.log // Log the SQL query
    });

    logger.info('Found releases:', {
      total: releases.length,
      statuses: releases.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {})
    });

    // Transform the releases
    const transformedReleases = releases.map(release => {
      const releaseData = release.toJSON();
      return {
        ...releaseData,
        artists: releaseData.artists.map(artist => ({
          id: artist.id,
          name: artist.name,
          spotify_url: artist.spotify_url,
          profile_image_url: artist.profile_image_url,
          profile_image_small_url: artist.profile_image_small_url,
          profile_image_large_url: artist.profile_image_large_url
        })),
        tracks: (releaseData.tracks || []).map(track => ({
          ...track,
          artists: track.artists.map(artist => ({
            id: artist.id,
            name: artist.name,
            spotify_url: artist.spotify_url,
            profile_image_url: artist.profile_image_url,
            profile_image_small_url: artist.profile_image_small_url,
            profile_image_large_url: artist.profile_image_large_url
          }))
        }))
      };
    });

    logger.info('Response data:', {
      totalReleases: publishedReleasesCount,
      totalTracks: publishedTracksCount,
      returnedReleases: transformedReleases.length
    });

    res.json({
      success: true,
      releases: transformedReleases,
      totalReleases: publishedReleasesCount,
      totalTracks: publishedTracksCount
    });
  } catch (error) {
    logger.error('Error fetching releases:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    handleError(res, error);
  }
});

// GET /api/releases/:labelId
router.get('/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Find the label
    const label = await Label.findOne({
      where: {
        [Op.or]: [
          { id: labelId },
          { slug: labelId }
        ]
      }
    });

    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }

    // Get releases from database with pagination
    const { count, rows: releases } = await Release.findAndCountAll({
      where: { label_id: label.id },
      include: [
        {
          model: Artist,
          as: 'artists',
          attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: ['id', 'title', 'duration_ms', 'preview_url', 'spotify_url', 'spotify_id', 'track_number', 'disc_number', 'isrc', 'spotify_popularity', 'external_urls', 'explicit', 'remixer_id', 'created_at', 'updated_at'],
          include: [
            {
              model: Artist,
              as: 'artists',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            }
          ]
        }
      ],
      order: [['release_date', 'DESC']],
      limit,
      offset
    });

    // Transform the releases to include all necessary data
    const transformedReleases = releases.map(release => {
      const releaseJson = release.toJSON();
      return {
        ...releaseJson,
        artists: releaseJson.artists.map(artist => ({
          id: artist.id,
          name: artist.name,
          spotify_url: artist.spotify_url,
          profile_image_url: artist.profile_image_url,
          profile_image_small_url: artist.profile_image_small_url,
          profile_image_large_url: artist.profile_image_large_url
        })),
        albumCover: releaseJson.artwork_url || releaseJson.artwork_small_url || releaseJson.artwork_large_url,
        tracks: releaseJson.tracks.map(track => ({
          ...track,
          artists: track.artists.map(artist => ({
            id: artist.id,
            name: artist.name,
            spotify_url: artist.spotify_url,
            profile_image_url: artist.profile_image_url,
            profile_image_small_url: artist.profile_image_small_url,
            profile_image_large_url: artist.profile_image_large_url
          }))
        }))
      };
    });

    logger.info('Transformed releases:', JSON.stringify(transformedReleases, null, 2));

    res.json({
      releases: transformedReleases,
      totalReleases: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    logger.error('Error fetching releases:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    handleError(res, error);
  }
});

// GET /api/releases/:labelId/:releaseId
router.get('/:labelId/:releaseId', async (req, res) => {
  try {
    const { labelId, releaseId } = req.params;
    
    const release = await Release.findOne({
      where: {
        id: releaseId,
        label_id: labelId
      },
      include: [
        {
          model: Artist,
          as: 'artists',
          attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: ['id', 'title', 'duration_ms', 'preview_url', 'spotify_url', 'spotify_id', 'track_number', 'disc_number', 'isrc', 'spotify_popularity', 'external_urls', 'explicit', 'remixer_id', 'created_at', 'updated_at'],
          include: [
            {
              model: Artist,
              as: 'artists',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            }
          ]
        }
      ]
    });

    if (!release) {
      return res.status(404).json({
        success: false,
        error: 'Release not found'
      });
    }

    res.json({
      success: true,
      release: release
    });
  } catch (error) {
    logger.error('Error fetching release:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    handleError(res, error);
  }
});

// POST /api/releases
router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { release, artists, tracks } = req.body;
    
    // Create release
    const newRelease = await Release.create(release, { transaction });
    
    // Create or find artists and associate with release
    for (const artistData of artists) {
      const [artist] = await Artist.findOrCreate({
        where: { id: artistData.id },
        defaults: artistData,
        transaction
      });
      await newRelease.addArtist(artist, { transaction });
    }
    
    // Create tracks
    for (const trackData of tracks) {
      const track = await Track.create({
        ...trackData,
        releaseId: newRelease.id
      }, { transaction });
      
      if (trackData.remixer) {
        const [remixer] = await Artist.findOrCreate({
          where: { id: trackData.remixer.id },
          defaults: trackData.remixer,
          transaction
        });
        await track.setRemixer(remixer, { transaction });
      }
    }
    
    await transaction.commit();
    
    // Fetch the complete release with associations
    const completeRelease = await Release.findByPk(newRelease.id, {
      include: [
        {
          model: Artist,
          as: 'artists',
          attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: ['id', 'title', 'duration_ms', 'preview_url', 'spotify_url', 'spotify_id', 'track_number', 'disc_number', 'isrc', 'spotify_popularity', 'external_urls', 'explicit', 'remixer_id', 'created_at', 'updated_at'],
          include: [
            {
              model: Artist,
              as: 'artists',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            }
          ]
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Release created successfully',
      release: completeRelease
    });
  } catch (error) {
    logger.error('Error in POST /releases:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    await transaction.rollback();
    handleError(res, error);
  }
});

// GET /api/releases/featured
router.get('/featured', async (req, res) => {
  try {
    const { label } = req.query;
    
    if (!label) {
      return res.status(400).json({ 
        success: false, 
        message: 'Label parameter is required' 
      });
    }

    // Convert label query param to actual label ID
    const labelMap = {
      'records': 'build-it-records',
      'tech': 'build-it-tech',
      'deep': 'build-it-deep'
    };

    const labelId = labelMap[label];
    if (!labelId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid label' 
      });
    }

    // Get the 6 most recent releases for this label
    const releases = await Release.findAll({
      where: {
        [Op.or]: [
          { label_id: labelId },
          { record_label: labelId }
        ]
      },
      include: [
        {
          model: Artist,
          as: 'primaryArtist',
          attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
        },
        {
          model: Artist,
          as: 'artists',
          attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
        }
      ],
      order: [
        [sequelize.fn('RANDOM')] // Randomly select releases
      ],
      limit: 6
    });

    res.json({
      success: true,
      releases: releases.map(release => ({
        id: release.id,
        name: release.name,
        trackTitle: release.trackTitle,
        artist: release.primaryArtist,
        album: release.album,
        spotifyUrl: release.spotify_url,
        recordLabel: release.labelId
      }))
    });
  } catch (error) {
    logger.error('Error in GET /releases/featured:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    handleError(res, error);
  }
});

// Get all releases with pagination
router.get('/', async (req, res) => {
  try {
    const { labelId } = req.query;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;

    const where = {
      status: 'active'  // Only show active releases
    };
    if (labelId) {
      where.label_id = labelId;
    }

    const { count, rows } = await Release.findAndCountAll({
      where,
      include: [
        {
          model: Artist,
          as: 'artists',
          attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: ['id', 'title', 'duration_ms', 'preview_url', 'spotify_url', 'spotify_id', 'track_number', 'disc_number', 'isrc', 'spotify_popularity', 'external_urls', 'explicit', 'remixer_id', 'created_at', 'updated_at'],
          include: [
            {
              model: Artist,
              as: 'artists',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            }
          ]
        },
        {
          model: Label,
          as: 'label'
        }
      ],
      order: [['release_date', 'DESC']],
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
    logger.error('Error fetching releases:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    handleError(res, error);
  }
});

// Get a specific release by ID
router.get('/:id', async (req, res) => {
  try {
    const release = await Release.findByPk(req.params.id, {
      include: [
        {
          model: Artist,
          as: 'artists',
          attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: ['id', 'title', 'duration_ms', 'preview_url', 'spotify_url', 'spotify_id', 'track_number', 'disc_number', 'isrc', 'spotify_popularity', 'external_urls', 'explicit', 'remixer_id', 'created_at', 'updated_at'],
          include: [
            {
              model: Artist,
              as: 'artists',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            }
          ]
        },
        {
          model: Label,
          as: 'label'
        }
      ]
    });

    if (!release) {
      return res.status(404).json({ 
        success: false, 
        message: 'Release not found' 
      });
    }

    res.json(release);
  } catch (error) {
    logger.error('Error fetching release:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    handleError(res, error);
  }
});

// Get release by ID
router.get('/:releaseId', async (req, res) => {
  try {
    const { releaseId } = req.params;
    
    const { rows } = await sequelize.query(
      'SELECT * FROM releases WHERE id = $1',
      {
        replacements: [releaseId],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Release not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.error('Error fetching release:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    handleError(res, error);
  }
});

// Get release's tracks
router.get('/:releaseId/tracks', async (req, res) => {
  try {
    const { releaseId } = req.params;
    
    const { rows: tracks } = await sequelize.query(
      'SELECT * FROM tracks WHERE release_id = $1 ORDER BY track_number ASC',
      {
        replacements: [releaseId],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    res.json({ tracks });
  } catch (error) {
    logger.error('Error fetching release tracks:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    handleError(res, error);
  }
});

// GET /api/releases/top/:labelId
router.get('/top/:labelId', async (req, res) => {
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
          attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: ['id', 'title', 'duration_ms', 'preview_url', 'spotify_url', 'spotify_id', 'track_number', 'disc_number', 'isrc', 'spotify_popularity', 'external_urls', 'explicit', 'remixer_id', 'created_at', 'updated_at'],
          required: false,
          include: [
            {
              model: Artist,
              as: 'artists',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            },
            {
              model: Artist,
              as: 'remixer',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            }
          ]
        }
      ],
      order: [
        [{ model: Track, as: 'tracks' }, 'spotify_popularity', 'DESC']
      ],
      limit
    });

    // Always return a success response with releases array
    res.json({
      success: true,
      releases: releases.map(release => ({
        ...release.toJSON(),
        popularity: Math.max(...(release.tracks?.map(track => track.spotify_popularity) || [0]))
      }))
    });
  } catch (error) {
    logger.error('Error in GET /releases/top/:labelId:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    handleError(res, error);
  }
});

router.get('/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;

    const where = {
      status: 'active'  // Only show active releases
    };
    if (labelId) {
      where.label_id = labelId;
    }

    const releases = await Release.findAll({
      where,
      attributes: ['id', 'title', 'release_date', 'artwork_url', 'artwork_small_url', 'artwork_large_url', 'spotify_url', 'label_id', 'total_tracks', 'status', 'created_at', 'updated_at'],
      include: [
        {
          model: Artist,
          as: 'artists',
          attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: ['id', 'title', 'duration_ms', 'preview_url', 'spotify_url', 'spotify_id', 'track_number', 'disc_number', 'isrc', 'spotify_popularity', 'external_urls', 'explicit', 'remixer_id', 'created_at', 'updated_at'],
          required: false,
          include: [
            {
              model: Artist,
              as: 'artists',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            },
            {
              model: Artist,
              as: 'remixer',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, releases });
  } catch (error) {
    logger.error('Error in releases route:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/releases/label/:labelId
router.get('/label/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    logger.info('Looking up label with ID/slug:', labelId);
    
    // Find the label by id or slug
    const label = await Label.findOne({
      where: {
        [Op.or]: [
          { id: labelId },
          { slug: labelId }
        ]
      },
      logging: console.log // Log the SQL query
    });

    if (!label) {
      logger.warn('Label not found for ID/slug:', labelId);
      return res.status(404).json({ success: false, error: 'Label not found' });
    }

    logger.info('Found label:', label.toJSON());

    // Get all releases for this label
    const releases = await Release.findAll({
      where: { 
        label_id: label.id,
        status: 'published'
      },
      attributes: ['id', 'title', 'release_date', 'artwork_url', 'artwork_small_url', 'artwork_large_url', 'spotify_url', 'label_id', 'total_tracks', 'status', 'created_at', 'updated_at'],
      include: [
        {
          model: Artist,
          as: 'artists',
          attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: ['id', 'title', 'duration_ms', 'preview_url', 'spotify_url', 'spotify_id', 'track_number', 'disc_number', 'isrc', 'spotify_popularity', 'external_urls', 'explicit', 'remixer_id', 'created_at', 'updated_at'],
          required: false,
          include: [
            {
              model: Artist,
              as: 'artists',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            },
            {
              model: Artist,
              as: 'remixer',
              attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url']
            }
          ]
        }
      ],
      order: [['release_date', 'DESC']],
      logging: console.log // Log the SQL query
    });

    // Get total counts
    const totalReleases = await Release.count({
      where: { 
        label_id: label.id,
        status: 'published'
      }
    });

    const totalTracks = await Track.count({
      where: { 
        label_id: label.id,
        status: 'published'
      }
    });

    // Transform the releases
    const transformedReleases = releases.map(release => {
      const releaseData = release.get({ plain: true });
      return {
        ...releaseData,
        artists: releaseData.artists.map(artist => ({
          id: artist.id,
          name: artist.name,
          spotify_url: artist.spotify_url,
          profile_image_url: artist.profile_image_url,
          profile_image_small_url: artist.profile_image_small_url,
          profile_image_large_url: artist.profile_image_large_url
        })),
        tracks: (releaseData.tracks || []).map(track => ({
          ...track,
          artists: track.artists.map(artist => ({
            id: artist.id,
            name: artist.name,
            spotify_url: artist.spotify_url,
            profile_image_url: artist.profile_image_url,
            profile_image_small_url: artist.profile_image_small_url,
            profile_image_large_url: artist.profile_image_large_url
          }))
        }))
      };
    });

    res.json({
      success: true,
      releases: transformedReleases,
      totalReleases,
      totalTracks
    });
  } catch (error) {
    logger.error('Error fetching releases:', error);
    console.error('Database query failed:', error.message);
    if (error.original) {
      console.error('Original database error:', error.original);
    }
    handleError(res, error);
  }
});

module.exports = router;
