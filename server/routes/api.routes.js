const express = require('express');
const router = express.Router();
const SpotifyService = require('../services/SpotifyService');
const { Label, Artist, Release, Track } = require('../models');
const { Op } = require('sequelize');

// Cache for label lookups
const labelCache = new Map();

const LABEL_SLUGS = {
  'buildit-records': 'buildit-records',
  'buildit': 'buildit-records',
  'br': 'buildit-records',
  'records': 'buildit-records',
  'tech': 'buildit-tech',
  'deep': 'buildit-deep'
};

// Normalize label path to handle different formats
function normalizeLabelPath(path) {
  if (!path) return null;

  const labelMap = {
    'Build It Records': 'buildit-records',
    'Build It Tech': 'buildit-tech',
    'Build It Deep': 'buildit-deep',
    'Records': 'buildit-records',
    'Tech': 'buildit-tech',
    'Deep': 'buildit-deep',
    'buildit-records': 'buildit-records',
    'buildit-tech': 'buildit-tech',
    'buildit-deep': 'buildit-deep'
  };

  const normalized = path.toLowerCase().trim();
  return labelMap[normalized] || LABEL_SLUGS[normalized] || normalized;
}

// Debug route to list all labels
router.get('/labels', async (req, res) => {
  try {
    const labels = await Label.findAll();
    res.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ error: 'Failed to fetch labels' });
  }
});

// Get releases for a specific label
router.get('/releases/:labelPath', async (req, res) => {
  try {
    const { labelPath } = req.params;
    console.log('Fetching releases for label:', labelPath);
    
    const normalizedLabel = normalizeLabelPath(labelPath);
    console.log('Normalized label:', normalizedLabel);

    if (!normalizedLabel) {
      return res.status(400).json({ error: 'Invalid label path' });
    }

    const label = await Label.findOne({
      where: {
        id: normalizedLabel
      }
    });

    if (!label) {
      console.log('Label not found:', normalizedLabel);
      return res.status(404).json({ error: 'Label not found' });
    }

    console.log('Found label:', label.name);

    const releases = await Release.findAll({
      where: {
        labelId: label.id
      },
      include: [{
        model: Artist,
        as: 'releaseArtist',
        attributes: ['id', 'name', 'spotifyUrl', 'images']
      }],
      order: [['releaseDate', 'DESC']]
    });

    console.log(`Found ${releases.length} releases for label ${label.name}`);

    // Transform the releases
    const transformedReleases = releases.map(release => ({
      id: release.id,
      title: release.title || release.name,
      artist_id: release.releaseArtist?.id,
      artist_name: release.releaseArtist?.name,
      release_date: release.releaseDate,
      spotify_url: release.spotifyUrl,
      images: release.images || []
    }));

    res.json({ releases: transformedReleases });

  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ 
      error: 'Failed to fetch releases',
      details: error.message 
    });
  }
});

// Get all releases (with optional label filter)
router.get('/releases', async (req, res) => {
  try {
    const { label } = req.query;
    const normalizedLabel = label ? normalizeLabelPath(label) : null;
    
    let whereClause = {};
    if (normalizedLabel) {
      const labelRecord = await Label.findOne({
        where: { slug: normalizedLabel }
      });
      
      if (labelRecord) {
        whereClause.labelId = labelRecord.id;
      }
    }
    
    const releases = await Release.findAll({
      where: whereClause,
      include: [{
        model: Artist,
        attributes: ['id', 'name', 'spotifyUrl', 'images']
      }],
      order: [['releaseDate', 'DESC']]
    });

    // Transform the releases
    const transformedReleases = releases.map(release => ({
      id: release.id,
      name: release.title,
      artist_id: release.artist.id,
      artist_name: release.artist.name,
      release_date: release.releaseDate,
      spotify_url: release.spotifyUrl,
      images: release.images || []
    }));
    
    res.json(transformedReleases);
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ error: 'Failed to fetch releases' });
  }
});

// Import releases for a label
router.get('/import-releases/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    console.log('[Import] Starting import for label:', labelId);

    // Find the label
    const label = await Label.findByPk(labelId);
    if (!label) {
      console.error('[Import] Label not found:', labelId);
      return res.status(404).json({ 
        success: false,
        error: 'Label not found',
        details: `No label found with ID: ${labelId}`
      });
    }

    console.log('[Import] Found label:', label.name);

    // Initialize Spotify service
    console.log('[Import] Initializing Spotify service...');
    const spotifyService = new SpotifyService();
    await spotifyService.initialize();
    console.log('[Import] SpotifyService initialized successfully');

    // Define search terms
    const searchTerms = [
      'genre:electronic',
      'genre:house',
      'genre:techno',
      'build it records',
      'build it tech',
      'build it deep'
    ];

    let processedAlbums = new Set();
    let totalResults = 0;
    let importedReleases = [];

    // Process each search term
    for (const searchTerm of searchTerms) {
      console.log('[Import] Searching with term:', searchTerm);
      try {
        const results = await spotifyService.searchAlbums(searchTerm, 50);
        console.log(`[Import] Found ${results.length} albums for search:`, searchTerm);

        // Process each album
        for (const album of results) {
          if (processedAlbums.has(album.id)) {
            console.log('[Import] Skipping already processed album:', album.name);
            continue;
          }
          processedAlbums.add(album.id);

          console.log('[Import] Processing album:', album.name);

          // Get or create artist
          const artistId = album.artists[0].id;
          let artist = await Artist.findByPk(artistId);

          if (!artist) {
            console.log('[Import] Creating new artist:', album.artists[0].name);
            const artistData = await spotifyService.getArtist(artistId);
            artist = await Artist.create({
              id: artistId,
              name: artistData.name,
              spotifyUrl: artistData.external_urls.spotify,
              images: artistData.images,
              record_label: label.id
            });
            console.log('[Import] Created new artist:', artist.name);
          } else {
            console.log('[Import] Found existing artist:', artist.name);
          }

          // Create or update release
          const [release, created] = await Release.findOrCreate({
            where: { 
              title: album.name,
              artistId: artist.id
            },
            defaults: {
              title: album.name,
              releaseDate: album.release_date,
              images: album.images,
              spotifyUrl: album.external_urls.spotify,
              artistId: artist.id
            }
          });

          if (created) {
            console.log('[Import] Created new release:', release.title);
            totalResults++;
            importedReleases.push({
              id: release.id,
              title: release.title,
              artist: artist.name
            });
          } else {
            console.log('[Import] Found existing release:', release.title);
          }
        }
      } catch (error) {
        console.error(`[Import] Error processing search term "${searchTerm}":`, error);
        // Continue with next search term
      }
    }

    console.log(`[Import] Import completed. Imported ${totalResults} new releases.`);
    res.json({
      success: true,
      message: `Successfully imported ${totalResults} new releases`,
      importedReleases
    });
  } catch (error) {
    console.error('[Import] Error importing releases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import releases',
      details: error.message
    });
  }
});

// Get a single release by ID
router.get('/releases/:id', async (req, res) => {
  try {
    const release = await Release.findByPk(req.params.id, {
      include: [{
        model: Artist,
        as: 'artist',
        attributes: ['id', 'name', 'spotifyUrl', 'images']
      }, {
        model: Label,
        as: 'label',
        attributes: ['id', 'name', 'slug']
      }]
    });

    if (!release) {
      return res.status(404).json({ error: 'Release not found' });
    }

    const transformedRelease = {
      id: release.id,
      title: release.title,
      artist: {
        id: release.artist.id,
        name: release.artist.name,
        spotifyUrl: release.artist.spotifyUrl,
        images: release.artist.images
      },
      label: {
        id: release.label.id,
        name: release.label.name,
        slug: release.label.slug
      },
      artworkUrl: release.artworkUrl,
      releaseDate: release.releaseDate,
      spotifyUrl: release.spotifyUrl
    };

    res.json(transformedRelease);
  } catch (error) {
    console.error('Error fetching release:', error);
    res.status(500).json({ error: 'Failed to fetch release' });
  }
});

// Save tracks
router.post('/tracks', async (req, res) => {
  try {
    const tracks = req.body;
    console.log('Saving tracks:', tracks);

    for (const track of tracks) {
      const [artist] = await Artist.findOrCreate({
        where: { name: track.artist.name },
        defaults: {
          name: track.artist.name,
          spotifyUrl: track.artist.spotifyUrl
        }
      });

      await Release.findOrCreate({
        where: { 
          title: track.title,
          artistId: artist.id
        },
        defaults: {
          title: track.title,
          releaseDate: track.releaseDate,
          images: track.images,
          spotifyUrl: track.spotifyUrl,
          artistId: artist.id
        }
      });
    }

    res.status(200).json({ message: 'Tracks saved successfully' });
  } catch (error) {
    console.error('Error saving tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get artists for a specific label
router.get('/:labelPath/artists', async (req, res) => {
  try {
    const normalizedPath = normalizeLabelPath(req.params.labelPath);
    const labelSlug = LABEL_SLUGS[normalizedPath];
    if (!labelSlug) {
      return res.status(404).json({ error: 'Label not found' });
    }

    const label = await Label.findOne({ where: { slug: labelSlug } });
    
    if (!label) {
      return res.json([]);
    }

    const artists = await Artist.findAll({
      include: [{
        model: Release,
        as: 'releases',
        where: { recordLabel: label.id }
      }]
    });

    // Transform the data to match the frontend types
    const transformedArtists = artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images,
      spotifyUrl: artist.spotifyUrl,
      genres: artist.genres,
      followers: artist.followers,
      monthlyListeners: artist.monthlyListeners,
      recordLabel: artist.recordLabel,
      labels: artist.labels,
      bio: artist.bio,
      releases: artist.releases.map(release => ({
        id: release.id,
        title: release.title,
        artist: {
          name: release.artist.name,
          spotifyUrl: release.artist.spotifyUrl,
          imageUrl: release.artist.images
        },
        imageUrl: release.images || release.artworkUrl || release.artwork,
        releaseDate: release.releaseDate,
        genre: release.genre,
        labelName: release.labelName,
        stores: {
          spotify: release.spotifyUrl,
          beatport: release.beatportUrl,
          soundcloud: release.soundcloudUrl
        },
        spotifyUrl: release.spotifyUrl
      }))
    }));

    res.json(transformedArtists);
  } catch (error) {
    console.error('Error getting artists:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tracks by label
router.get('/tracks/:labelPath', async (req, res) => {
  try {
    const { labelPath } = req.params;
    console.log('Received request for label path:', labelPath);
    
    const normalizedPath = normalizeLabelPath(labelPath);
    console.log('Normalized label path:', normalizedPath);
    
    if (!normalizedPath) {
      return res.status(400).json({ error: 'Invalid label path' });
    }

    const label = await Label.findOne({
      where: {
        [Op.or]: [
          { id: normalizedPath },
          { slug: normalizedPath }
        ]
      }
    });

    if (!label) {
      console.log('Label not found:', normalizedPath);
      return res.status(404).json({ error: 'Label not found' });
    }

    console.log('Found label:', label.name);

    const tracks = await Track.findAll({
      where: {
        recordLabel: label.id
      },
      include: [
        {
          model: Artist,
          as: 'artist',
          attributes: ['id', 'name', 'spotifyUrl', 'images']
        },
        {
          model: Release,
          as: 'release',
          attributes: ['id', 'title', 'releaseDate', 'artworkUrl', 'spotifyUrl']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log(`Found ${tracks.length} tracks for label ${label.name}`);
    // Transform tracks to match frontend interface
    const transformedTracks = tracks.map(track => ({
      id: track.id,
      name: track.name,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      external_urls: track.external_urls,
      uri: track.uri,
      album_id: track.release?.id,
      album_title: track.release?.title,
      artist_id: track.artist?.id,
      artist_name: track.artist?.name,
      artworkUrl: track.release?.artworkUrl
    }));

    res.json(transformedTracks);
  } catch (error) {
    console.error('Error fetching tracks by label:', error);
    res.status(500).json({ error: 'Failed to fetch tracks', details: error.message });
  }
});

// Get artist details
router.get('/artists/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params;
    
    const artist = await Artist.findByPk(artistId, {
      include: [{
        model: Release,
        as: 'releases',
        include: [{
          model: Artist,
          as: 'artist',
          attributes: ['name', 'spotifyUrl', 'images']
        }]
      }]
    });

    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Transform the data to match the frontend types
    const transformedArtist = {
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images,
      spotifyUrl: artist.spotifyUrl,
      genres: artist.genres,
      followers: artist.followers,
      monthlyListeners: artist.monthlyListeners,
      recordLabel: artist.recordLabel,
      labels: artist.labels,
      bio: artist.bio,
      releases: artist.releases.map(release => ({
        id: release.id,
        title: release.title,
        artist: {
          name: release.artist.name,
          spotifyUrl: release.artist.spotifyUrl,
          imageUrl: release.artist.images
        },
        imageUrl: release.images || release.artworkUrl || release.artwork,
        releaseDate: release.releaseDate,
        genre: release.genre,
        labelName: release.labelName,
        stores: {
          spotify: release.spotifyUrl,
          beatport: release.beatportUrl,
          soundcloud: release.soundcloudUrl
        },
        spotifyUrl: release.spotifyUrl
      }))
    };

    res.json(transformedArtist);
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all artists
router.get('/artists', async (req, res) => {
  try {
    const { limit = 50, offset = 0, search, label } = req.query;
    
    let whereClause = {};
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }
    if (label) {
      // Convert label to slug format
      const normalizedLabel = normalizeLabelPath(label);
      const labelSlug = LABEL_SLUGS[normalizedLabel];
      if (!labelSlug) {
        console.warn(`Invalid label: ${label}`);
        return res.status(404).json({ error: `Label not found: ${label}` });
      }
      whereClause.recordLabel = labelSlug;
    }

    console.log('Fetching artists with where clause:', whereClause);

    const artists = await Artist.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'bio', 'images', 'recordLabel', 'spotifyUrl', 'beatportUrl', 'soundcloudUrl', 'bandcampUrl'],
      order: [['name', 'ASC']],
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

    // Transform the data to match the frontend types
    const transformedArtists = artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      bio: artist.bio,
      images: artist.images || [],
      recordLabel: artist.recordLabel,
      spotifyUrl: artist.spotifyUrl,
      beatportUrl: artist.beatportUrl,
      soundcloudUrl: artist.soundcloudUrl,
      bandcampUrl: artist.bandcampUrl
    }));

    res.json(transformedArtists);
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get artists with their releases
router.get('/artists/with-releases', async (req, res) => {
  try {
    const { artistIds } = req.query;
    
    if (!artistIds) {
      return res.status(400).json({ error: 'artistIds query parameter is required' });
    }
    
    const ids = artistIds.split(',');
    const spotifyService = new SpotifyService();
    await spotifyService.initialize();
    console.log('SpotifyService initialized successfully');

    const artists = await spotifyService.getArtistsWithReleases(ids);
    
    res.json(artists);
  } catch (error) {
    console.error('Error fetching artists with releases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get artists by label with their releases
router.get('/labels/:labelId/artists', async (req, res) => {
  try {
    const { labelId } = req.params;
    const label = await Label.findByPk(labelId);
    
    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }
    
    // Get artists for this label
    const artists = await Artist.findAll({
      where: { recordLabel: labelId },
      include: [{ model: Release }]
    });
    
    // If we don't have releases for these artists, fetch them from Spotify
    const artistsNeedingReleases = artists.filter(artist => !artist.releases?.length);
    if (artistsNeedingReleases.length > 0) {
      const spotifyService = new SpotifyService();
      await spotifyService.initialize();
      console.log('SpotifyService initialized successfully');

      const artistIds = artistsNeedingReleases.map(artist => artist.id);
      const spotifyArtists = await spotifyService.getArtistsWithReleases(artistIds);
      
      // Update our database with the new releases
      await sequelize.transaction(async (transaction) => {
        for (const spotifyArtist of spotifyArtists) {
          for (const release of spotifyArtist.releases) {
            await Release.findOrCreate({
              where: { id: release.id },
              defaults: {
                ...release,
                artistId: spotifyArtist.id,
                recordLabel: labelId
              },
              transaction
            });
          }
        }
      });
      
      // Fetch the updated artists with their releases
      const updatedArtists = await Artist.findAll({
        where: { recordLabel: labelId },
        include: [{ model: Release }]
      });
      
      res.json(updatedArtists);
    } else {
      res.json(artists);
    }
  } catch (error) {
    console.error('Error fetching artists for label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import releases from Spotify
router.get('/import-releases/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    console.log('Starting import for label:', labelId);

    const label = await Label.findByPk(labelId);
    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }

    const spotifyService = new SpotifyService();
    await spotifyService.initialize();
    console.log('SpotifyService initialized successfully');

    const searchTerms = [
      'genre:electronic',
      'genre:house',
      'genre:techno',
      'build it records',
      'build it tech',
      'build it deep'
    ];

    let processedAlbums = new Set();
    let totalResults = 0;
    let importedReleases = [];

    for (const searchTerm of searchTerms) {
      console.log('Searching with term:', searchTerm);
      try {
        const results = await spotifyService.searchAlbums(searchTerm, 50);
        console.log(`Found ${results.length} albums for search:`, searchTerm);

        for (const album of results) {
          if (processedAlbums.has(album.id)) continue;
          processedAlbums.add(album.id);

          const artistId = album.artists[0].id;
          let artist = await Artist.findByPk(artistId);

          if (!artist) {
            const artistData = await spotifyService.getArtist(artistId);
            artist = await Artist.create({
              id: artistId,
              name: artistData.name,
              spotifyUrl: artistData.external_urls.spotify,
              images: artistData.images
            });
          }

          const [release, created] = await Release.findOrCreate({
            where: { id: album.id },
            defaults: {
              title: album.name,
              artistId: artist.id,
              labelId: label.id,
              releaseDate: album.release_date,
              albumArtUrl: album.images[0]?.url,
              spotifyUrl: album.external_urls.spotify,
              popularity: album.popularity
            }
          });

          if (created) {
            totalResults++;
            importedReleases.push({
              id: release.id,
              title: release.title,
              artist: artist.name
            });
          }
        }
      } catch (error) {
        console.error(`Error processing search term "${searchTerm}":`, error);
        // Continue with next search term
      }
    }

    console.log(`Import completed. Imported ${totalResults} new releases.`);
    res.json({
      success: true,
      message: `Successfully imported ${totalResults} new releases`,
      importedReleases
    });
  } catch (error) {
    console.error('Error importing releases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import releases',
      details: error.message
    });
  }
});

// Get tracks by label ID
router.get('/tracks/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    console.log('Fetching tracks for label:', labelId);

    const label = await Label.findByPk(labelId);
    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }

    const tracks = await Track.findAll({
      where: {
        recordLabel: label.id
      },
      include: [{
        model: Artist,
        attributes: ['id', 'name', 'spotifyId']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
});

// Get releases by label ID
router.get('/releases/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    console.log('Fetching releases for label:', labelId);

    const label = await Label.findByPk(labelId);
    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }

    const releases = await Release.findAll({
      where: {
        labelId: label.id
      },
      include: [{
        model: Artist,
        attributes: ['id', 'name', 'spotifyUrl', 'images']
      }],
      order: [['releaseDate', 'DESC']]
    });

    const transformedReleases = releases.map(release => ({
      id: release.id,
      title: release.title,
      artist: {
        id: release.Artist.id,
        name: release.Artist.name,
        spotifyUrl: release.Artist.spotifyUrl,
        imageUrl: release.Artist.images?.[0]?.url
      },
      imageUrl: release.albumArtUrl,
      releaseDate: release.releaseDate,
      spotifyUrl: release.spotifyUrl,
      beatportUrl: release.beatportUrl,
      soundcloudUrl: release.soundcloudUrl,
      popularity: release.popularity
    }));

    res.json(transformedReleases);
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ error: 'Failed to fetch releases' });
  }
});

// Get releases for a specific label
router.get('/releases/:labelIdentifier', async (req, res) => {
  try {
    const { labelIdentifier } = req.params;
    console.log('Fetching releases for label:', labelIdentifier);
    
    let label = await Label.findOne({
      where: {
        [Op.or]: [
          { id: labelIdentifier },
          { slug: labelIdentifier }
        ]
      }
    });
    
    console.log('Found label:', label?.name);
    
    if (!label) {
      console.log('Label not found in database');
      return res.status(404).json({ 
        success: false,
        error: 'Label not found' 
      });
    }

    const releases = await Release.findAll({
      where: {
        [Op.or]: [
          { labelId: label.id },
          { recordLabel: label.id }
        ]
      },
      include: [{
        model: Artist,
        attributes: ['id', 'name', 'spotifyUrl', 'images'],
        required: false
      }],
      order: [['releaseDate', 'DESC']]
    });

    console.log(`Found ${releases.length} releases for label ${label.name}`);

    // Transform the data to match the frontend types
    const transformedReleases = releases.map(release => ({
      id: release.id,
      title: release.title,
      releaseDate: release.releaseDate,
      images: release.images || [],
      artworkUrl: release.artworkUrl || release.images?.[0]?.url,
      spotifyUrl: release.spotifyUrl,
      artistId: release.artistId,
      artistName: release.Artist?.name || 'Unknown Artist'
    }));

    res.json({
      success: true,
      data: transformedReleases
    });
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch releases'
    });
  }
});

// Get tracks for a specific label
router.get('/tracks/:labelPath', async (req, res) => {
  try {
    const { labelPath } = req.params;
    console.log('Fetching tracks for label:', labelPath);
    
    let label = await Label.findOne({
      where: {
        [Op.or]: [
          { id: labelPath },
          { slug: labelPath }
        ]
      }
    });

    if (!label) {
      return res.status(404).json({ 
        success: false,
        error: 'Label not found' 
      });
    }

    const tracks = await Track.findAll({
      include: [{
        model: Release,
        where: {
          [Op.or]: [
            { labelId: label.id },
            { recordLabel: label.id }
          ]
        },
        include: [{
          model: Artist,
          attributes: ['id', 'name', 'spotifyUrl']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    const transformedTracks = tracks.map(track => ({
      id: track.id,
      name: track.title,
      albumId: track.Release?.id,
      albumTitle: track.Release?.title,
      artistId: track.Release?.Artist?.id,
      artistName: track.Release?.Artist?.name || 'Unknown Artist',
      durationMs: track.durationMs,
      previewUrl: track.previewUrl,
      externalUrls: track.externalUrls || {},
      uri: track.uri
    }));

    res.json({
      success: true,
      data: transformedTracks
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch tracks'
    });
  }
});

// Get releases for a specific label
router.get('/releases/:labelPath', async (req, res) => {
  try {
    const { labelPath } = req.params;
    console.log('Fetching releases for label:', labelPath);
    
    const normalizedPath = normalizeLabelPath(labelPath);
    console.log('Normalized path:', normalizedPath);
    
    const labelSlug = LABEL_SLUGS[normalizedPath];
    console.log('Label slug:', labelSlug);
    
    if (!labelSlug) {
      console.log('Label not found');
      return res.status(404).json({ error: 'Label not found' });
    }

    const label = await Label.findOne({ 
      where: { 
        slug: labelSlug 
      }
    });
    
    console.log('Found label:', label?.name);
    
    if (!label) {
      console.log('Label not found in database');
      return res.status(404).json({ error: 'Label not found' });
    }

    const releases = await Release.findAll({
      where: {
        recordLabel: label.id
      },
      include: [{
        model: Artist,
        as: 'artist',
        attributes: ['id', 'name', 'spotifyUrl', 'images'],
        required: true
      }],
      order: [['releaseDate', 'DESC']]
    });

    // Transform the data to match the frontend types
    const transformedReleases = releases.map(release => ({
      id: release.id,
      title: release.title,
      artist: {
        name: release.artist.name,
        spotifyUrl: release.artist.spotifyUrl,
        imageUrl: release.artist.images
      },
      imageUrl: release.images || release.artworkUrl || release.artwork,
      releaseDate: release.releaseDate,
      genre: release.genre,
      labelName: label.name,
      label: label.name,
      stores: {
        spotify: release.spotifyUrl,
        beatport: release.beatportUrl,
        soundcloud: release.soundcloudUrl
      },
      spotifyUrl: release.spotifyUrl
    }));

    res.json(transformedReleases);
  } catch (error) {
    console.error('Error getting releases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tracks by label
router.get('/tracks/:labelPath', async (req, res) => {
  try {
    const { labelPath } = req.params;
    console.log('Received request for label path:', labelPath);
    
    const normalizedPath = normalizeLabelPath(labelPath);
    console.log('Normalized path:', normalizedPath);
    
    const labelSlug = LABEL_SLUGS[normalizedPath];
    console.log('Looking up label slug:', labelSlug);
    
    if (!labelSlug) {
      console.log('Invalid label path:', labelPath);
      return res.status(400).json({ success: false, message: 'Invalid label' });
    }

    const label = await Label.findOne({
      where: {
        slug: labelSlug
      }
    });

    if (!label) {
      return res.status(404).json({ success: false, message: 'Label not found' });
    }

    const tracks = await Track.findAll({
      where: {
        recordLabel: label.id
      },
      include: [{
        model: Artist,
        attributes: ['id', 'name', 'spotifyId', 'spotifyUrl', 'images']
      }, {
        model: Release,
        attributes: ['id', 'title', 'releaseDate', 'images', 'artworkUrl']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Transform tracks to match frontend interface
    const transformedTracks = tracks.map(track => ({
      id: track.id,
      name: track.name,
      album_id: track.release?.id,
      artist_id: track.artist?.id,
      artist_name: track.artist?.name,
      album_title: track.release?.title,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      external_urls: {
        spotify: track.spotifyUrl
      },
      uri: track.uri
    }));

    res.json(transformedTracks);
  } catch (error) {
    console.error('Error fetching tracks by label:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
});

// Get releases for a specific label
router.get('/releases/:labelPath', async (req, res) => {
  try {
    const { labelPath } = req.params;
    console.log('Fetching releases for label:', labelPath);
    
    const normalizedPath = normalizeLabelPath(labelPath);
    console.log('Normalized path:', normalizedPath);
    
    const labelSlug = LABEL_SLUGS[normalizedPath];
    console.log('Label slug:', labelSlug);
    
    if (!labelSlug) {
      console.log('Label not found');
      return res.status(404).json({ error: 'Label not found' });
    }

    const label = await Label.findOne({ 
      where: { 
        slug: labelSlug 
      }
    });
    
    console.log('Found label:', label?.name);
    
    if (!label) {
      console.log('Label not found in database');
      return res.status(404).json({ error: 'Label not found' });
    }

    const releases = await Release.findAll({
      where: {
        recordLabel: label.id
      },
      include: [{
        model: Artist,
        as: 'artist',
        attributes: ['id', 'name', 'spotifyUrl', 'images'],
        required: true
      }],
      order: [['releaseDate', 'DESC']]
    });

    // Transform the data to match the frontend types
    const transformedReleases = releases.map(release => ({
      id: release.id,
      title: release.title,
      artist: {
        name: release.artist.name,
        spotifyUrl: release.artist.spotifyUrl,
        imageUrl: release.artist.images
      },
      imageUrl: release.images || release.artworkUrl || release.artwork,
      releaseDate: release.releaseDate,
      genre: release.genre,
      labelName: label.name,
      label: label.name,
      stores: {
        spotify: release.spotifyUrl,
        beatport: release.beatportUrl,
        soundcloud: release.soundcloudUrl
      },
      spotifyUrl: release.spotifyUrl
    }));

    res.json(transformedReleases);
  } catch (error) {
    console.error('Error getting releases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tracks by label
router.get('/tracks/:labelPath', async (req, res) => {
  try {
    const { labelPath } = req.params;
    console.log('Received request for label path:', labelPath);
    
    const normalizedPath = normalizeLabelPath(labelPath);
    console.log('Normalized path:', normalizedPath);
    
    const labelSlug = LABEL_SLUGS[normalizedPath];
    console.log('Looking up label slug:', labelSlug);
    
    if (!labelSlug) {
      console.log('Invalid label path:', labelPath);
      return res.status(400).json({ success: false, message: 'Invalid label' });
    }

    const label = await Label.findOne({
      where: {
        slug: labelSlug
      }
    });

    if (!label) {
      return res.status(404).json({ success: false, message: 'Label not found' });
    }

    const tracks = await Track.findAll({
      where: {
        recordLabel: label.id
      },
      include: [{
        model: Artist,
        attributes: ['id', 'name', 'spotifyId', 'spotifyUrl', 'images']
      }, {
        model: Release,
        attributes: ['id', 'title', 'releaseDate', 'images', 'artworkUrl']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Transform tracks to match frontend interface
    const transformedTracks = tracks.map(track => ({
      id: track.id,
      name: track.name,
      album_id: track.release?.id,
      artist_id: track.artist?.id,
      artist_name: track.artist?.name,
      album_title: track.release?.title,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      external_urls: {
        spotify: track.spotifyUrl
      },
      uri: track.uri
    }));

    res.json(transformedTracks);
  } catch (error) {
    console.error('Error fetching tracks by label:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
});

// Get releases for a specific label
router.get('/releases/:labelPath', async (req, res) => {
  try {
    const { labelPath } = req.params;
    console.log('Fetching releases for label:', labelPath);
    
    const normalizedPath = normalizeLabelPath(labelPath);
    console.log('Normalized path:', normalizedPath);
    
    const labelSlug = LABEL_SLUGS[normalizedPath];
    console.log('Label slug:', labelSlug);
    
    if (!labelSlug) {
      console.log('Label not found');
      return res.status(404).json({ error: 'Label not found' });
    }

    const label = await Label.findOne({ 
      where: { 
        slug: labelSlug 
      }
    });
    
    console.log('Found label:', label?.name);
    
    if (!label) {
      console.log('Label not found in database');
      return res.status(404).json({ error: 'Label not found' });
    }

    const releases = await Release.findAll({
      where: {
        recordLabel: label.id
      },
      include: [{
        model: Artist,
        as: 'artist',
        attributes: ['id', 'name', 'spotifyUrl', 'images'],
        required: true
      }],
      order: [['releaseDate', 'DESC']]
    });

    // Transform the data to match the frontend types
    const transformedReleases = releases.map(release => ({
      id: release.id,
      title: release.title,
      artist: {
        name: release.artist.name,
        spotifyUrl: release.artist.spotifyUrl,
        imageUrl: release.artist.images
      },
      imageUrl: release.images || release.artworkUrl || release.artwork,
      releaseDate: release.releaseDate,
      genre: release.genre,
      labelName: label.name,
      label: label.name,
      stores: {
        spotify: release.spotifyUrl,
        beatport: release.beatportUrl,
        soundcloud: release.soundcloudUrl
      },
      spotifyUrl: release.spotifyUrl
    }));

    res.json(transformedReleases);
  } catch (error) {
    console.error('Error getting releases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the router
module.exports = router;
