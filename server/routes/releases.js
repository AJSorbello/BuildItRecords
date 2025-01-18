const express = require('express');
const router = express.Router();
const { Release, Artist, Track, Label } = require('../models');
const { Op } = require('sequelize');
const { query, validationResult } = require('express-validator');
const logger = require('../utils/logger');  

// Error handling helper
const handleError = (res, error) => {
  logger.error('Error in releases route:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error',
    details: error.details || error
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

    logger.info('GET /releases/top request:', { label });

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

    const releases = await Release.findAll({
      where: {
        label_id: label
      },
      include: [
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] },
          attributes: ['id', 'name', 'spotify_url', 'spotify_uri', 'image_url']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: ['id', 'name', 'popularity', 'preview_url', 'spotify_url', 'spotify_uri']
        }
      ],
      order: [['popularity', 'DESC']],
      limit
    });

    res.json({
      success: true,
      releases
    });
  } catch (error) {
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

        let where = {};
        if (label) {
          where.label_id = label;
        }

        // Get all releases with their tracks, including track popularity
        const releases = await Release.findAll({
          where,
          include: [
            {
              model: Artist,
              as: 'artists',
              through: { attributes: [] },
              attributes: ['id', 'name', 'spotify_url', 'spotify_uri', 'image_url', 'label_id']
            },
            {
              model: Track,
              as: 'tracks',
              attributes: ['id', 'name', 'popularity', 'preview_url', 'spotify_url', 'spotify_uri'],
              where: {
                status: 'published'
              },
              required: false
            }
          ],
          distinct: true
        });

        // Process releases and calculate total popularity
        const processedReleases = releases.map(release => {
          const releaseData = release.toJSON();
          const tracks = releaseData.tracks || [];
          
          // Calculate total popularity from track popularities
          const totalPopularity = tracks.reduce((sum, track) => {
            return sum + (track.popularity || 0);
          }, 0);

          // Calculate average popularity (avoiding division by zero)
          const avgPopularity = tracks.length > 0 ? totalPopularity / tracks.length : 0;

          return {
            ...releaseData,
            popularity: avgPopularity,
            totalPopularity,
            trackCount: tracks.length,
            artwork_url: releaseData.artwork_url || releaseData.images?.[0]?.url,
            images: releaseData.images || (releaseData.artwork_url ? [{ url: releaseData.artwork_url }] : [])
          };
        });

        // Sort releases
        const sortedReleases = processedReleases.sort((a, b) => {
          if (sort === 'popularity') {
            // Sort by total popularity for a better representation of overall plays
            return order === 'desc' ? 
              b.totalPopularity - a.totalPopularity : 
              a.totalPopularity - b.totalPopularity;
          }
          if (sort === 'release_date') {
            const dateA = new Date(a.release_date || 0);
            const dateB = new Date(b.release_date || 0);
            return order === 'desc' ? dateB - dateA : dateA - dateB;
          }
          return 0;
        });

        // Get exactly 10 releases for top releases endpoint
        const paginatedReleases = sortedReleases.slice(offset, offset + (limit === 10 ? 10 : limit));

        res.json({
          success: true,
          releases: paginatedReleases,
          total: releases.length,
          offset,
          limit,
          sort,
          order
        });
    } catch (error) {
        handleError(res, error);
    }
});

// Get a single release by ID
router.get('/:id', async (req, res) => {
    try {
        const release = await Release.findByPk(req.params.id, {
            include: [
                {
                    model: Artist,
                    as: 'artists',
                    through: { attributes: [] },
                    attributes: ['id', 'name', 'spotify_url', 'spotify_uri', 'image_url', 'label_id']
                },
                {
                    model: Track,
                    as: 'tracks',
                    attributes: [
                      'id', 'name', 'duration', 'track_number', 'disc_number', 
                      'isrc', 'preview_url', 'spotify_url', 'spotify_uri', 
                      'label_id', 'status'
                    ]
                },
                {
                    model: Label,
                    as: 'label',
                    attributes: ['id', 'name', 'display_name', 'slug', 'description', 'spotifyPlaylistId']
                }
            ]
        });

        if (!release) {
            return res.status(404).json({ error: 'Release not found' });
        }

        res.json(release);
    } catch (error) {
        console.error('Error fetching release:', error);
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

    // Initialize Spotify service
    const spotifyService = new SpotifyService(
      process.env.SPOTIFY_CLIENT_ID,
      process.env.SPOTIFY_CLIENT_SECRET,
      process.env.SPOTIFY_REDIRECT_URI
    );

    // Search and import releases
    console.log('Starting Spotify search for label:', label.name);
    const albums = await spotifyService.searchAlbumsByLabel(label.name);
    console.log(`Found ${albums.length} releases, starting import...`);

    // Use a transaction to ensure data consistency
    const result = await sequelize.transaction(async (t) => {
      // Import the releases
      await spotifyService.importReleases(label, albums, t);

      // Return the imported releases
      const { count, rows: releases } = await Release.findAndCountAll({
        where: { label_id: label.id },
        include: [
          {
            model: Artist,
            as: 'artists',
            through: { attributes: [] },
            attributes: ['id', 'name', 'spotify_url', 'spotify_uri', 'image_url', 'label_id']
          },
          {
            model: Track,
            as: 'tracks',
            include: [
              {
                model: Artist,
                as: 'artists',
                through: { attributes: [] },
                attributes: ['id', 'name', 'spotify_url', 'spotify_uri', 'image_url', 'label_id']
              }
            ]
          }
        ],
        order: [['release_date', 'DESC']],
        transaction: t
      });

      return { count, releases };
    });

    console.log(`Successfully imported ${result.count} releases for label: ${label.name}`);

    res.json({
      success: true,
      message: `Successfully imported ${albums.length} releases`,
      totalReleases: result.count,
      releases: result.releases
    });

  } catch (error) {
    console.error('Error importing releases:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
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
          through: { attributes: [] },
          attributes: ['id', 'name', 'spotify_url']
        },
        {
          model: Track,
          as: 'tracks',
          include: [
            {
              model: Artist,
              as: 'artists',
              through: { attributes: [] }
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
          name: artist.name
        })),
        albumCover: releaseJson.artworkUrl || releaseJson.artwork,
        tracks: releaseJson.tracks.map(track => ({
          ...track,
          artists: track.artists.map(artist => ({
            id: artist.id,
            name: artist.name
          }))
        }))
      };
    });

    console.log('Transformed releases:', JSON.stringify(transformedReleases, null, 2));

    res.json({
      releases: transformedReleases,
      totalReleases: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error fetching releases:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
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
          through: { 
            attributes: [] // Don't include any join table attributes
          },
          attributes: ['id', 'name', 'spotify_url', 'spotify_uri', 'image_url']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: [
            'id', 'name', 'duration', 'preview_url', 'spotify_url', 
            'spotify_uri', 'track_number', 'popularity'
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
          through: { attributes: ['role'] },
          attributes: ['id', 'name', 'spotify_url']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: ['id', 'name', 'duration', 'preview_url', 'spotify_url', 'track_number'],
          include: [
            {
              model: Artist,
              as: 'artists',
              through: { attributes: [] },
              attributes: ['id', 'name', 'spotify_url']
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
    console.error('Error in POST /releases:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
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
          attributes: ['id', 'name', 'spotify_url']
        },
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] },
          attributes: ['id', 'name', 'spotify_url']
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
    console.error('Error in GET /releases/featured:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    handleError(res, error);
  }
});

// Get all releases with pagination
router.get('/', async (req, res) => {
  try {
    const { labelId } = req.query;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;

    const where = {};
    if (labelId) {
      where.label_id = labelId;
    }

    const { count, rows } = await Release.findAndCountAll({
      where,
      include: [
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] }
        },
        {
          model: Track,
          as: 'tracks'
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
    console.error('Error fetching releases:', error);
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
          through: { attributes: [] }
        },
        {
          model: Track,
          as: 'tracks'
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
    console.error('Error fetching release:', error);
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
    console.error('Error fetching release:', error);
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
    console.error('Error fetching release tracks:', error);
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
          through: { 
            attributes: [] // Don't include any join table attributes
          },
          attributes: ['id', 'name', 'spotify_url', 'spotify_uri', 'image_url']
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

    // Always return a success response with releases array
    res.json({
      success: true,
      releases: releases.map(release => ({
        ...release.toJSON(),
        popularity: Math.max(...(release.tracks?.map(track => track.popularity) || [0]))
      }))
    });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
