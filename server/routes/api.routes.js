const express = require('express');
const router = express.Router();
const SpotifyService = require('../services/SpotifyService');
const { Label, Artist, Release } = require('../models');

// Initialize SpotifyService
const spotifyService = new SpotifyService();

const LABEL_SLUGS = {
  records: 'buildit-records',
  tech: 'buildit-tech',
  deep: 'buildit-deep'
};

const setupApiRoutes = (app) => {
  // Get all tracks
  app.get('/api/tracks', async (req, res) => {
    try {
      const releases = await Release.findAll({
        include: [{
          model: Artist,
          as: 'artist',
          attributes: ['name', 'spotifyUrl']
        }],
        order: [['releaseDate', 'DESC']]
      });
      res.json(releases);
    } catch (error) {
      console.error('Error fetching all tracks:', error);
      res.status(500).json({ error: 'Failed to fetch tracks' });
    }
  });

  // Save tracks
  app.post('/api/tracks', async (req, res) => {
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
      res.status(500).json({ error: 'Failed to save tracks' });
    }
  });

  // Get releases for a specific label
  app.get('/:label/releases', async (req, res) => {
    try {
      const labelSlug = LABEL_SLUGS[req.params.label];
      if (!labelSlug) {
        return res.status(404).json({ error: 'Label not found' });
      }

      const label = await Label.findOne({ where: { slug: labelSlug } });
      
      if (!label) {
        return res.json([]);
      }

      const releases = await Release.findAll({
        where: { labelId: label.id },
        include: [{
          model: Artist,
          as: 'artist',
          attributes: ['name', 'spotifyUrl']
        }],
        order: [['releaseDate', 'DESC']]
      });

      res.json(releases);
    } catch (error) {
      console.error('Error getting releases:', error);
      res.status(500).json({ error: 'Failed to get releases' });
    }
  });

  // Get releases for a specific label
  app.get('/:labelId/releases', async (req, res) => {
    try {
      const { labelId } = req.params;
      const labelSlug = LABEL_SLUGS[labelId];
      
      if (!labelSlug) {
        return res.status(404).json({ error: 'Label not found' });
      }

      const label = await Label.findOne({ where: { slug: labelSlug } });
      if (!label) {
        return res.status(404).json({ error: 'Label not found' });
      }

      const releases = await Release.findAll({
        include: [
          {
            model: Artist,
            as: 'artist',
            attributes: ['name', 'imageUrl', 'spotifyUrl']
          }
        ],
        where: { labelId: label.id },
        order: [['releaseDate', 'DESC']]
      });

      res.json(releases);
    } catch (error) {
      console.error('Error fetching releases:', error);
      res.status(500).json({ error: 'Failed to fetch releases' });
    }
  });

  // Sync releases for a specific label
  app.post('/:label/releases/sync', async (req, res) => {
    try {
      const labelSlug = LABEL_SLUGS[req.params.label];
      if (!labelSlug) {
        return res.status(404).json({ error: 'Label not found' });
      }

      console.log(`Syncing releases for ${labelSlug}`);
      const result = await spotifyService.storeArtistsAndTracks(labelSlug);
      res.json(result);
    } catch (error) {
      console.error('Error syncing releases:', error);
      res.status(500).json({ error: 'Failed to sync releases' });
    }
  });

  // Get artists for a specific label
  app.get('/:label/artists', async (req, res) => {
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
        where: { labelId: label.id },
        order: [['name', 'ASC']]
      });
      res.json(artists);
    } catch (error) {
      console.error('Error getting artists:', error);
      res.status(500).json({ error: 'Failed to get artists' });
    }
  });

  // Get artist details
  app.get('/:label/artists/:artistId', async (req, res) => {
    try {
      const labelSlug = LABEL_SLUGS[req.params.label];
      if (!labelSlug) {
        return res.status(404).json({ error: 'Label not found' });
      }

      const artist = await Artist.findOne({
        where: { id: req.params.artistId },
        include: [{
          model: Release,
          as: 'releases'
        }]
      });

      if (!artist) {
        return res.status(404).json({ error: 'Artist not found' });
      }

      res.json(artist);
    } catch (error) {
      console.error('Error getting artist:', error);
      res.status(500).json({ error: 'Failed to get artist' });
    }
  });
};

module.exports = { setupApiRoutes };
