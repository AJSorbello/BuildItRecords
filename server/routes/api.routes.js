const express = require('express');
const router = express.Router();
const SpotifyService = require('../services/SpotifyService');
const { Label, Artist, Release, Track } = require('../models');
const { Op } = require('sequelize');

// Cache for label lookups
const labelCache = new Map();

const LABEL_SLUGS = {
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

  const normalized = path.toLowerCase()
    .replace(/build ?it ?/g, '')
    .replace(/\s+/g, '-');
  
  return labelMap[path] || labelMap[normalized] || normalized;
}

// Debug route to list all labels
router.get('/labels', async (req, res) => {
  try {
    const labels = await Label.findAll();
    res.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/labels', async (req, res) => {
  try {
    const label = await Label.create(req.body);
    res.status(201).json(label);
  } catch (error) {
    console.error('Error creating label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get releases by label path (e.g., /deep/releases)
router.get('/:labelPath/releases', async (req, res) => {
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

    // First, let's log all labels to debug
    const allLabels = await Label.findAll();
    console.log('Available labels:', allLabels.map(l => ({ id: l.id, name: l.name, slug: l.slug })));
    
    const label = await Label.findOne({
      where: {
        slug: labelSlug
      }
    });

    console.log('Found label:', label?.toJSON());

    if (!label) {
      console.log('Label not found for slug:', labelSlug);
      return res.status(404).json({ success: false, message: 'Label not found' });
    }

    console.log('Found label:', label.name, 'with ID:', label.id);

    const releases = await Release.findAll({
      where: {
        recordLabel: label.id
      },
      include: [{
        model: Artist,
        attributes: ['id', 'name', 'spotifyUrl', 'images']
      }],
      order: [['releaseDate', 'DESC']]
    });

    console.log(`Found ${releases.length} releases for label ${label.name}`);
    return res.json(releases);
  } catch (error) {
    console.error('Error in /:labelPath/releases route:', error);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching releases',
      error: error.message 
    });
  }
});

// Get all releases with pagination and filtering
router.get('/releases', async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    
    const whereClause = search ? {
      [Op.or]: [
        { title: { [Op.iLike]: `%${search}%` } },
        { '$artist.name$': { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    const releases = await Release.findAll({
      where: whereClause,
      include: [{
        model: Artist,
        attributes: ['id', 'name', 'spotifyUrl', 'images'],
        required: true
      }],
      order: [['releaseDate', 'DESC']],
      offset: parseInt(offset),
      limit: parseInt(limit)
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
      labelName: release.labelName,
      label: release.labelName,
      stores: {
        spotify: release.spotifyUrl,
        beatport: release.beatportUrl,
        soundcloud: release.soundcloudUrl
      },
      spotifyUrl: release.spotifyUrl
    }));

    res.json(transformedReleases);
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all releases (formerly tracks)
router.get('/releases', async (req, res) => {
  try {
    const { label } = req.query;
    const normalizedLabel = label ? normalizeLabelPath(label) : null;
    
    const whereClause = {};
    if (normalizedLabel) {
      const labelRecord = await Label.findOne({
        where: {
          slug: normalizedLabel
        }
      });
      
      if (!labelRecord) {
        return res.status(404).json({ error: `Label not found: ${label}` });
      }
      
      whereClause.labelId = labelRecord.id;
    }

    const releases = await Release.findAll({
      where: whereClause,
      include: [{
        model: Artist,
        attributes: ['id', 'name', 'spotifyUrl', 'images']
      }, {
        model: Label,
        attributes: ['id', 'name', 'slug']
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
        imageUrl: release.Artist.images?.[0] || null
      },
      label: {
        id: release.Label.id,
        name: release.Label.name,
        slug: release.Label.slug
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
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get a single release by ID
router.get('/releases/:id', async (req, res) => {
  try {
    const release = await Release.findByPk(req.params.id, {
      include: [{
        model: Artist,
        attributes: ['id', 'name', 'spotifyUrl', 'images']
      }, {
        model: Label,
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
        id: release.Artist.id,
        name: release.Artist.name,
        spotifyUrl: release.Artist.spotifyUrl,
        imageUrl: release.Artist.images?.[0] || null
      },
      label: {
        id: release.Label.id,
        name: release.Label.name,
        slug: release.Label.slug
      },
      imageUrl: release.albumArtUrl,
      releaseDate: release.releaseDate,
      spotifyUrl: release.spotifyUrl,
      beatportUrl: release.beatportUrl,
      soundcloudUrl: release.soundcloudUrl,
      popularity: release.popularity
    };

    res.json(transformedRelease);
  } catch (error) {
    console.error('Error fetching release:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
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

// Get releases for a specific label
router.get('/:labelPath', async (req, res) => {
  try {
    console.log('Fetching releases for label:', req.params.labelPath);
    const normalizedPath = normalizeLabelPath(req.params.labelPath);
    const labelSlug = LABEL_SLUGS[normalizedPath];
    console.log('Label slug:', labelSlug);
    
    if (!labelSlug) {
      console.log('Label not found');
      return res.status(404).json({ error: 'Label not found' });
    }

    const label = await Label.findOne({ where: { slug: labelSlug } });
    console.log('Found label:', label?.name);
    
    if (!label) {
      console.log('Label not found in database');
      return res.json([]);
    }

    const releases = await Release.findAll({
      where: {
        recordLabel: label.id
      },
      include: [{
        model: Artist,
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

// Sync releases for a specific label
router.post('/:labelPath/releases/sync', async (req, res) => {
  try {
    const normalizedPath = normalizeLabelPath(req.params.labelPath);
    const labelSlug = LABEL_SLUGS[normalizedPath];
    if (!labelSlug) {
      return res.status(404).json({ error: 'Label not found' });
    }

    console.log(`Syncing releases for ${labelSlug}`);
    const result = await SpotifyService.storeArtistsAndTracks(labelSlug);
    res.json(result);
  } catch (error) {
    console.error('Error syncing releases:', error);
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
router.get('/:labelPath/tracks', async (req, res) => {
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
        attributes: ['id', 'name', 'spotifyId']
      }]
    });

    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks by label:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
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

// Artists
router.get('/artists', async (req, res) => {
  try {
    const { search, label } = req.query;
    let whereClause = {};
    
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }
    
    if (label) {
      whereClause.labelId = label;
    }
    
    const artists = await Artist.findAll({
      where: whereClause,
      include: [
        { model: Label },
        { model: Release }
      ]
    });
    
    res.json(artists);
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/artists/:id', async (req, res) => {
  try {
    const artist = await Artist.findByPk(req.params.id, {
      include: [
        { model: Label },
        { model: Release }
      ]
    });
    
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }
    
    res.json(artist);
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/artists', async (req, res) => {
  try {
    const artist = await Artist.create(req.body);
    res.status(201).json(artist);
  } catch (error) {
    console.error('Error creating artist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Releases
router.get('/releases', async (req, res) => {
  try {
    const { artistId, labelId } = req.query;
    let whereClause = {};
    
    if (artistId) {
      whereClause.artistId = artistId;
    }
    
    if (labelId) {
      whereClause.labelId = labelId;
    }
    
    const releases = await Release.findAll({
      where: whereClause,
      include: [
        { model: Artist },
        { model: Label }
      ]
    });
    
    res.json(releases);
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/releases/:id', async (req, res) => {
  try {
    const release = await Release.findByPk(req.params.id, {
      include: [
        { model: Artist },
        { model: Label }
      ]
    });
    
    if (!release) {
      return res.status(404).json({ error: 'Release not found' });
    }
    
    res.json(release);
  } catch (error) {
    console.error('Error fetching release:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/releases', async (req, res) => {
  try {
    const release = await Release.create(req.body);
    res.status(201).json(release);
  } catch (error) {
    console.error('Error creating release:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search endpoints
router.get('/search/artists', async (req, res) => {
  try {
    const { q } = req.query;
    const artists = await Artist.findAll({
      where: {
        name: { [Op.iLike]: `%${q}%` }
      },
      include: [
        { model: Label },
        { model: Release }
      ]
    });
    res.json(artists);
  } catch (error) {
    console.error('Error searching artists:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/search/releases', async (req, res) => {
  try {
    const { q } = req.query;
    const releases = await Release.findAll({
      where: {
        title: { [Op.iLike]: `%${q}%` }
      },
      include: [
        { model: Artist },
        { model: Label }
      ]
    });
    res.json(releases);
  } catch (error) {
    console.error('Error searching releases:', error);
    res.status(500).json({ error: 'Internal server error' });
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

// Export the router
module.exports = router;
