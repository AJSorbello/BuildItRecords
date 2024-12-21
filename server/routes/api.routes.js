const express = require('express');
const { Pool } = require('pg');
const router = express.Router();
const SpotifyService = require('../services/SpotifyService');
const { Label, Artist, Release, Track } = require('../models');
const { Op } = require('sequelize');

// Cache for label lookups
const labelCache = new Map();

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware to handle database errors
const withDb = (handler) => async (req, res, next) => {
  const client = await pool.connect();
  try {
    req.db = client;
    await handler(req, res);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

const LABEL_SLUGS = {
  records: 'buildit-records',
  tech: 'buildit-tech',
  deep: 'buildit-deep'
};

// Get releases by label
router.get('/releases/:labelSlug', withDb(async (req, res) => {
  try {
    const { labelSlug } = req.params;
    
    if (!labelSlug) {
      return res.status(400).json({ success: false, message: 'Label parameter is required' });
    }

    console.log('Fetching releases for label slug:', labelSlug);
    
    // First, let's log all labels to debug
    const allLabels = await Label.findAll();
    console.log('Available labels:', allLabels.map(l => ({ id: l.id, name: l.name, slug: l.slug })));
    
    const label = await Label.findOne({
      where: {
        [Op.or]: [
          { slug: labelSlug },
          { slug: labelSlug.toLowerCase() }
        ]
      }
    });

    if (!label) {
      console.log('Label not found for slug:', labelSlug);
      return res.status(404).json({ success: false, message: 'Label not found' });
    }

    console.log('Found label:', label.name, 'with ID:', label.id);
    
    const releases = await Release.findAll({
      where: {
        labelId: label.id
      },
      include: [
        {
          model: Artist,
          as: 'artist',
          attributes: ['id', 'name', 'spotifyUrl', 'imageUrl']
        }
      ],
      order: [['releaseDate', 'DESC']]
    });

    console.log(`Found ${releases.length} releases for label ${label.name}`);
    
    // Transform the data to match the frontend types
    const transformedReleases = releases.map(release => ({
      id: release.id,
      title: release.title,
      artist: {
        name: release.artist.name,
        spotifyUrl: release.artist.spotifyUrl,
        imageUrl: release.artist.imageUrl
      },
      imageUrl: release.imageUrl || release.artworkUrl || release.artwork,
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
    console.error('Error fetching releases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Get all releases with pagination and filtering
router.get('/api/releases', withDb(async (req, res) => {
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
        as: 'artist',
        attributes: ['id', 'name', 'spotifyUrl', 'imageUrl'],
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
        imageUrl: release.artist.imageUrl
      },
      imageUrl: release.imageUrl || release.artworkUrl || release.artwork,
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
}));

// Get all tracks
router.get('/api/tracks', withDb(async (req, res) => {
  try {
    const releases = await Release.findAll({
      include: [{
        model: Artist,
        as: 'artist',
        attributes: ['id', 'name', 'spotifyUrl', 'imageUrl']
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
        imageUrl: release.artist.imageUrl
      },
      imageUrl: release.imageUrl || release.artworkUrl || release.artwork,
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
    console.error('Error fetching all tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Save tracks
router.post('/api/tracks', withDb(async (req, res) => {
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
          imageUrl: track.imageUrl,
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
}));

// Get releases for a specific label
router.get('/api/label/:label/releases', withDb(async (req, res) => {
  try {
    console.log('Fetching releases for label:', req.params.label);
    const labelSlug = LABEL_SLUGS[req.params.label];
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
        labelId: label.id
      },
      include: [{
        model: Artist,
        as: 'artist',
        attributes: ['id', 'name', 'spotifyUrl', 'imageUrl'],
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
        imageUrl: release.artist.imageUrl
      },
      imageUrl: release.imageUrl || release.artworkUrl || release.artwork,
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
}));

// Sync releases for a specific label
router.post('/api/label/:label/releases/sync', withDb(async (req, res) => {
  try {
    const labelSlug = LABEL_SLUGS[req.params.label];
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
}));

// Get artists for a specific label
router.get('/api/label/:label/artists', withDb(async (req, res) => {
  try {
    const labelSlug = LABEL_SLUGS[req.params.label];
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
        where: { labelId: label.id }
      }]
    });

    // Transform the data to match the frontend types
    const transformedArtists = artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.imageUrl,
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
          imageUrl: release.artist.imageUrl
        },
        imageUrl: release.imageUrl || release.artworkUrl || release.artwork,
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
}));

// Get tracks by label
router.get('/api/label/:label/tracks', withDb(async (req, res) => {
  try {
    const { label } = req.params;
    const tracks = await Track.find({ recordLabel: label.toUpperCase() });
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks by label:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
}));

// Get artist details
router.get('/api/artists/:artistId', withDb(async (req, res) => {
  try {
    const { artistId } = req.params;
    
    const artist = await Artist.findByPk(artistId, {
      include: [{
        model: Release,
        as: 'releases',
        include: [{
          model: Artist,
          as: 'artist',
          attributes: ['name', 'spotifyUrl', 'imageUrl']
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
      imageUrl: artist.imageUrl,
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
          imageUrl: release.artist.imageUrl
        },
        imageUrl: release.imageUrl || release.artworkUrl || release.artwork,
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
}));

module.exports = router;
