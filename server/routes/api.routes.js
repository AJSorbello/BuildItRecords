const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const initModels = require('../models');
const SpotifyService = require('../services/SpotifyService');

// Initialize models
const models = initModels(sequelize);
const { Label, Artist, Release, Track } = models;

// Valid label IDs
const VALID_LABELS = ['buildit-records', 'buildit-tech', 'buildit-deep'];

// Get all labels
router.get('/labels', async (req, res) => {
  try {
    const labels = await Label.findAll();
    res.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tracks by label
router.get('/labels/:labelId/tracks', async (req, res) => {
  try {
    const { labelId } = req.params;
    
    // Validate label
    if (!VALID_LABELS.includes(labelId)) {
      return res.status(400).json({ error: 'Invalid label ID' });
    }

    const tracks = await Track.findAll({
      include: [
        {
          model: Artist,
          as: 'artist',
          where: { label_id: labelId }
        },
        {
          model: Release,
          as: 'release'
        }
      ]
    });
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks by label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get releases by label
router.get('/labels/:labelId/releases', async (req, res) => {
  try {
    const { labelId } = req.params;

    // Validate label
    if (!VALID_LABELS.includes(labelId)) {
      return res.status(400).json({ error: 'Invalid label ID' });
    }

    const releases = await Release.findAll({
      where: { label_id: labelId },
      include: [
        {
          model: Artist,
          as: 'artist'
        },
        {
          model: Track,
          as: 'tracks'
        }
      ]
    });
    res.json(releases);
  } catch (error) {
    console.error('Error fetching releases by label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get artists by label
router.get('/labels/:labelId/artists', async (req, res) => {
  try {
    const { labelId } = req.params;
    
    // Validate label
    if (!VALID_LABELS.includes(labelId)) {
      return res.status(400).json({ error: 'Invalid label ID' });
    }

    const artists = await Artist.findAll({
      where: { label_id: labelId },
      include: [{
        model: Release,
        as: 'releases',
        include: [{
          model: Track,
          as: 'tracks'
        }]
      }]
    });

    res.json(artists);
  } catch (error) {
    console.error('Error fetching artists by label:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import releases for a specific label
router.get('/import-releases/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;

    // Validate label
    if (!VALID_LABELS.includes(labelId)) {
      return res.status(400).json({ error: 'Invalid label ID' });
    }

    const results = [];

    // Initialize Spotify service
    const spotifyService = new SpotifyService();
    await spotifyService.initialize();

    console.log(`Searching for all releases under label: ${labelId}`);
    const releases = await spotifyService.searchReleasesByLabel(labelId);
    console.log(`Found ${releases.length} releases for label ${labelId}`);

    // Process each release
    for (const releaseData of releases) {
      try {
        console.log(`Processing release: ${releaseData.name}`);

        // Get main artist data
        const artistData = await spotifyService.getArtist(releaseData.artists[0].id);
        if (!artistData) {
          console.error(`Artist not found for release: ${releaseData.name}`);
          continue;
        }

        // Find or create main artist
        const [artist] = await Artist.findOrCreate({
          where: { spotify_id: artistData.id },
          defaults: {
            name: artistData.name,
            spotify_id: artistData.id,
            spotify_url: artistData.external_urls.spotify,
            image_url: artistData.images?.[0]?.url,
            label_id: labelId
          }
        });

        // Create or update release
        const [release] = await Release.findOrCreate({
          where: { spotify_id: releaseData.id },
          defaults: {
            title: releaseData.name,
            spotify_id: releaseData.id,
            artist_id: artist.id,
            label_id: labelId,
            release_date: releaseData.release_date,
            cover_image_url: releaseData.images[0]?.url,
            spotify_url: releaseData.external_urls.spotify,
            external_urls: releaseData.external_urls,
            external_ids: releaseData.external_ids,
            popularity: releaseData.popularity,
            total_tracks: releaseData.total_tracks
          }
        });

        // Get all tracks from the release
        console.log(`Fetching tracks for release: ${releaseData.name}`);
        const tracks = await spotifyService.getAlbumTracks(releaseData.id);
        console.log(`Found ${tracks.length} tracks in release ${releaseData.name}`);

        // Process each track
        for (const trackData of tracks) {
          try {
            // Handle remixer if present
            let remixerArtist = null;
            const remixMatch = trackData.name.match(/[-–]\s*([^-–]+)\s*(?:Remix|Mix|Rework|Edit|Flip)/i);
            
            if (remixMatch) {
              const remixerName = remixMatch[1].trim();
              console.log(`Found remix by ${remixerName} in track ${trackData.name}`);
              
              // Try to find remixer in track artists
              const remixerSpotifyArtist = trackData.artists.find(artist => {
                const artistNameLower = artist.name.toLowerCase();
                const remixerNameLower = remixerName.toLowerCase();
                return artistNameLower.includes(remixerNameLower) || remixerNameLower.includes(artistNameLower);
              });

              if (remixerSpotifyArtist) {
                console.log(`Found remixer artist: ${remixerSpotifyArtist.name}`);
                const remixerData = await spotifyService.getArtist(remixerSpotifyArtist.id);
                
                // Create or update remixer
                [remixerArtist] = await Artist.findOrCreate({
                  where: { spotify_id: remixerData.id },
                  defaults: {
                    name: remixerData.name,
                    spotify_id: remixerData.id,
                    spotify_url: remixerData.external_urls.spotify,
                    image_url: remixerData.images?.[0]?.url,
                    label_id: labelId
                  }
                });
              }
            }

            // Create track
            await Track.findOrCreate({
              where: { spotify_id: trackData.id },
              defaults: {
                title: trackData.name,
                spotify_id: trackData.id,
                artist_id: artist.id,
                remixer_id: remixerArtist?.id || null,
                release_id: release.id,
                duration_ms: trackData.duration_ms,
                preview_url: trackData.preview_url,
                spotify_url: trackData.external_urls.spotify,
                external_urls: trackData.external_urls,
                uri: trackData.uri
              }
            });
          } catch (error) {
            console.error(`Error processing track ${trackData.name}:`, error);
          }
        }

        // Add release to results
        results.push({
          id: release.id,
          title: release.title,
          artist: artist.name,
          tracks: tracks.length
        });
      } catch (error) {
        console.error(`Error processing release ${releaseData.name}:`, error);
      }
    }

    console.log(`Import completed for label ${labelId}. Found ${results.length} releases.`);
    res.json({
      label: labelId,
      releases: results
    });
  } catch (error) {
    console.error('Error importing releases:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get releases by label
router.get('/releases/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;

    // Validate label
    if (!VALID_LABELS.includes(labelId)) {
      return res.status(400).json({ error: 'Invalid label ID' });
    }

    // Get all releases for the label, including artist info
    const releases = await Release.findAll({
      where: { label_id: labelId },
      include: [
        {
          model: Artist,
          as: 'artist',
          attributes: ['id', 'name', 'spotify_url', 'image_url']
        },
        {
          model: Track,
          as: 'tracks',
          include: [
            {
              model: Artist,
              as: 'remixer',
              attributes: ['id', 'name', 'spotify_url', 'image_url']
            }
          ]
        }
      ],
      order: [['release_date', 'DESC']]
    });

    res.json({
      label: labelId,
      releases: releases.map(release => ({
        id: release.id,
        title: release.title,
        artist: release.artist.name,
        artistId: release.artist.id,
        artistImage: release.artist.image_url,
        releaseDate: release.release_date,
        coverImage: release.cover_image_url,
        spotifyUrl: release.spotify_url,
        tracks: release.tracks.map(track => ({
          id: track.id,
          title: track.title,
          remixer: track.remixer ? {
            id: track.remixer.id,
            name: track.remixer.name,
            image: track.remixer.image_url
          } : null,
          duration: track.duration_ms,
          spotifyUrl: track.spotify_url
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get tracks by label
router.get('/tracks/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;

    // Validate label
    if (!VALID_LABELS.includes(labelId)) {
      return res.status(400).json({ error: 'Invalid label ID' });
    }

    // Get all tracks for the label, including artist and release info
    const tracks = await Track.findAll({
      include: [
        {
          model: Artist,
          as: 'artist',
          where: { label_id: labelId },
          attributes: ['id', 'name', 'spotify_url', 'image_url']
        },
        {
          model: Artist,
          as: 'remixer',
          attributes: ['id', 'name', 'spotify_url', 'image_url']
        },
        {
          model: Release,
          as: 'release',
          attributes: ['id', 'title', 'cover_image_url', 'release_date']
        }
      ],
      order: [
        [{ model: Release, as: 'release' }, 'release_date', 'DESC'],
        ['title', 'ASC']
      ]
    });

    res.json({
      label: labelId,
      tracks: tracks.map(track => ({
        id: track.id,
        title: track.title,
        artist: {
          id: track.artist.id,
          name: track.artist.name,
          image: track.artist.image_url
        },
        remixer: track.remixer ? {
          id: track.remixer.id,
          name: track.remixer.name,
          image: track.remixer.image_url
        } : null,
        release: {
          id: track.release.id,
          title: track.release.title,
          coverImage: track.release.cover_image_url,
          releaseDate: track.release.release_date
        },
        duration: track.duration_ms,
        spotifyUrl: track.spotify_url
      }))
    });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Add tracks from Spotify (single track or album)
router.post('/tracks', async (req, res) => {
  try {
    console.log('Saving track(s):', req.body);
    const { spotifyUrl, labelId } = req.body;

    // Validate label
    if (!VALID_LABELS.includes(labelId)) {
      return res.status(400).json({ error: 'Invalid label ID' });
    }

    // Initialize Spotify service
    const spotifyService = new SpotifyService();
    await spotifyService.initialize();

    // Check if URL is for album or track
    const isAlbum = spotifyUrl.includes('/album/');
    const id = spotifyUrl.split('/').pop().split('?')[0];

    let tracksToProcess = [];
    let albumData = null;

    if (isAlbum) {
      // Get album data and all its tracks
      albumData = await spotifyService.getAlbum(id);
      if (!albumData) {
        return res.status(404).json({ error: 'Album not found on Spotify' });
      }
      tracksToProcess = await spotifyService.getAlbumTracks(id);
    } else {
      // Get single track data
      const trackData = await spotifyService.getTrack(id);
      if (!trackData) {
        return res.status(404).json({ error: 'Track not found on Spotify' });
      }
      tracksToProcess = [trackData];
      albumData = await spotifyService.getAlbum(trackData.album.id);
    }

    // Get main artist data
    const mainArtistData = await spotifyService.getArtist(albumData.artists[0].id);
    if (!mainArtistData) {
      return res.status(404).json({ error: 'Artist not found on Spotify' });
    }

    // Find or create main artist - allow multiple label associations
    const [mainArtist] = await Artist.findOrCreate({
      where: { spotify_id: mainArtistData.id },
      defaults: {
        name: mainArtistData.name,
        spotify_id: mainArtistData.id,
        spotify_url: mainArtistData.external_urls.spotify,
        image_url: mainArtistData.images?.[0]?.url,
        label_id: labelId
      }
    });

    // Update label_id if it's different - this allows artists to be on multiple labels
    if (mainArtist.label_id !== labelId) {
      console.log(`Artist ${mainArtist.name} exists with label ${mainArtist.label_id}, adding to ${labelId}`);
      // We could store multiple labels in a separate table if needed
      // For now, just update to the new label
      await mainArtist.update({ label_id: labelId });
    }

    // Create or update release
    const [release] = await Release.findOrCreate({
      where: { spotify_id: albumData.id },
      defaults: {
        title: albumData.name,
        spotify_id: albumData.id,
        artist_id: mainArtist.id,
        label_id: labelId,
        release_date: albumData.release_date,
        cover_image_url: albumData.images[0]?.url,
        spotify_url: albumData.external_urls.spotify,
        external_urls: albumData.external_urls,
        external_ids: albumData.external_ids,
        popularity: albumData.popularity,
        total_tracks: albumData.total_tracks
      }
    });

    // Process each track
    const processedTracks = [];
    for (const trackData of tracksToProcess) {
      // Handle remixer if present
      let remixerArtist = null;
      const remixMatch = trackData.name.match(/[-–]\s*([^-–]+)\s*(?:Remix|Mix|Rework|Edit|Flip)/i);
      
      if (remixMatch) {
        const remixerName = remixMatch[1].trim();
        
        // Try to find remixer in track artists
        const remixerSpotifyArtist = trackData.artists.find(artist => {
          // Check if artist name contains the remixer name or vice versa
          const artistNameLower = artist.name.toLowerCase();
          const remixerNameLower = remixerName.toLowerCase();
          return artistNameLower.includes(remixerNameLower) || remixerNameLower.includes(artistNameLower);
        });

        if (remixerSpotifyArtist) {
          console.log(`Found remixer artist: ${remixerSpotifyArtist.name}`);
          const remixerData = await spotifyService.getArtist(remixerSpotifyArtist.id);
          
          // Check if remixer exists with different label
          const existingRemixer = await Artist.findOne({
            where: { spotify_id: remixerData.id }
          });

          if (existingRemixer && existingRemixer.label_id !== labelId) {
            console.log(`Remixer ${remixerName} exists under different label: ${existingRemixer.label_id}`);
          } else {
            // Create or update remixer
            [remixerArtist] = await Artist.findOrCreate({
              where: { spotify_id: remixerData.id },
              defaults: {
                name: remixerData.name,
                spotify_id: remixerData.id,
                spotify_url: remixerData.external_urls.spotify,
                image_url: remixerData.images?.[0]?.url,
                label_id: labelId
              }
            });
          }
        } else {
          console.log(`Remixer ${remixerName} not found in Spotify track artists`);
        }
      }

      // Create track
      const [track] = await Track.findOrCreate({
        where: { spotify_id: trackData.id },
        defaults: {
          title: trackData.name,
          spotify_id: trackData.id,
          artist_id: mainArtist.id,
          remixer_id: remixerArtist?.id || null,
          release_id: release.id,
          duration_ms: trackData.duration_ms,
          preview_url: trackData.preview_url,
          spotify_url: trackData.external_urls.spotify,
          external_urls: trackData.external_urls,
          uri: trackData.uri
        }
      });

      // Get track with associations
      const trackWithAssociations = await Track.findByPk(track.id, {
        include: [
          {
            model: Artist,
            as: 'artist'
          },
          {
            model: Artist,
            as: 'remixer'
          },
          {
            model: Release,
            as: 'release'
          }
        ]
      });

      processedTracks.push(trackWithAssociations);
    }

    res.json({
      release: {
        ...release.toJSON(),
        tracks: processedTracks
      }
    });
  } catch (error) {
    console.error('Error adding track(s):', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
