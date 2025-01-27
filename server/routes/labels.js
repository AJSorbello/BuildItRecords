const express = require('express');
const router = express.Router();
const { Track, Artist, Release, TrackArtist, Label, sequelize } = require('../models');
const getSpotifyService = require('../services/SpotifyService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Debug: Log available models
console.log('Available models in labels.js:', {
  Artist: !!Artist,
  Label: !!Label,
  Release: !!Release,
  Track: !!Track,
  TrackArtist: !!TrackArtist
});

// Debug: Log model methods
console.log('Model methods in labels.js:', {
  Artist: Artist ? Object.keys(Artist) : null,
  Label: Label ? Object.keys(Label) : null,
  Release: Release ? Object.keys(Release) : null,
  Track: Track ? Object.keys(Track) : null,
  TrackArtist: TrackArtist ? Object.keys(TrackArtist) : null
});

const axios = require('axios');

// Import function
const importTracksForLabel = async (labelId) => {
  try {
    logger.info('Starting import for label:', labelId);
    const spotifyService = await getSpotifyService();

    // Get the label from database
    const label = await Label.findOne({
      where: {
        [Op.or]: [
          { id: labelId },
          { slug: labelId },
          { name: { [Op.iLike]: labelId } }
        ]
      }
    });

    if (!label) {
      throw new Error(`Label not found: ${labelId}`);
    }

    logger.info('Found label:', { id: label.id, name: label.name });

    // Search for releases by label name
    const searchQuery = `label:"${label.name}"`;
    logger.info('Searching Spotify with query:', searchQuery);
    
    const releases = new Set();
    const tracks = new Set();
    const artists = new Set();
    const failedReleases = new Set();

    // Implement pagination to get all albums
    let offset = 0;
    const limit = 50; // Spotify's maximum limit per request
    let hasMore = true;
    let totalAlbums = 0;

    while (hasMore) {
      // Search for albums with pagination
      const albumsResponse = await spotifyService.searchAlbums(searchQuery, { limit, offset });
      logger.info(`Fetching albums batch: offset=${offset}, limit=${limit}, found=${albumsResponse.items.length}`);
      
      if (!albumsResponse.items || albumsResponse.items.length === 0) {
        hasMore = false;
        continue;
      }

      // Update total on first request
      if (offset === 0) {
        totalAlbums = albumsResponse.total;
        logger.info(`Total albums to process: ${totalAlbums}`);
      }

      // Process each album in this batch
      for (const album of albumsResponse.items) {
        try {
          // Get full album details
          const fullAlbum = await spotifyService.getAlbum(album.id);
          
          // Exact match on the label name
          if (fullAlbum && fullAlbum.label === label.name) {
            logger.info('Found matching release:', {
              id: fullAlbum.id,
              name: fullAlbum.name,
              label: fullAlbum.label
            });

            releases.add(fullAlbum);

            // Add all tracks from the album
            fullAlbum.tracks.items.forEach(t => {
              const fullTrack = { ...t, album: fullAlbum };
              tracks.add(fullTrack);
            });

            // Add all artists from the album
            fullAlbum.artists.forEach(a => artists.add(a));
          } else {
            logger.debug('Skipping non-matching release:', {
              id: fullAlbum.id,
              name: fullAlbum.name,
              foundLabel: fullAlbum.label,
              expectedLabel: label.name
            });
          }
        } catch (error) {
          logger.error('Error processing album:', {
            id: album.id,
            name: album.name,
            error: error.message
          });
          failedReleases.add(album);
        }
      }

      // Update offset for next batch
      offset += albumsResponse.items.length;
      
      // Check if we've processed all albums
      hasMore = offset < totalAlbums;
      
      // Add a small delay to avoid rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info('Completed Spotify search:', {
      totalAlbumsSearched: offset,
      matchingReleases: releases.size,
      totalTracks: tracks.size,
      totalArtists: artists.size,
      failedReleases: failedReleases.size
    });

    // Get existing tracks and artist associations to avoid duplicates
    const existingTracks = await Track.findAll({
      where: {
        id: { [Op.in]: Array.from(tracks).map(t => t.id) }
      },
      include: [{
        model: Artist,
        as: 'artists',
        through: { attributes: [] }
      }]
    });

    const existingArtists = await TrackArtist.findAll({
      where: {
        track_id: { [Op.in]: Array.from(tracks).map(t => t.id) }
      }
    });

    logger.info('Current database state:', {
      existingTracks: existingTracks.length,
      existingArtistAssociations: existingArtists.length
    });

    // Process releases
    logger.info('Starting release processing...');
    const processedReleases = [];
    const skippedReleases = [];
    let newTracksCount = 0;
    let newArtistAssociationsCount = 0;

    // Use a transaction for the entire import
    const result = await sequelize.transaction(async (transaction) => {
      for (const release of releases) {
        try {
          logger.info(`Processing release: ${release.name}`);
          
          // Check if release already exists
          let newRelease = await Release.findOne({
            where: { id: release.id },
            transaction
          });

          if (!newRelease) {
            logger.info('Creating new release:', {
              id: release.id,
              name: release.name,
              label: release.label
            });

            newRelease = await Release.create({
              id: release.id,
              name: release.name,
              title: release.name,
              release_date: release.release_date,
              artwork_url: release.images?.[0]?.url,
              images: release.images || [],
              spotify_url: release.external_urls?.spotify,
              spotify_uri: release.uri,
              label_id: label.id,
              total_tracks: release.total_tracks,
              status: 'published'
            }, { transaction });

            // Create artist associations for the release
            for (const artist of release.artists) {
              const [artistRecord] = await Artist.findOrCreate({
                where: { id: artist.id },
                defaults: {
                  id: artist.id,
                  name: artist.name,
                  spotify_url: artist.external_urls?.spotify,
                  spotify_uri: artist.uri,
                  image_url: artist.images?.[0]?.url,
                  images: artist.images || [],
                  label_id: label.id
                },
                transaction
              });

              await newRelease.addArtist(artistRecord, { transaction });
            }

            processedReleases.push(newRelease);
          } else {
            logger.info('Release already exists:', {
              id: release.id,
              name: release.name
            });
            skippedReleases.push(newRelease);
          }

          // Process tracks for this release
          const releaseTracks = Array.from(tracks).filter(t => t.album.id === release.id);
          for (const track of releaseTracks) {
            const [trackRecord, created] = await Track.findOrCreate({
              where: { id: track.id },
              defaults: {
                id: track.id,
                title: track.name,
                duration: track.duration_ms,
                track_number: track.track_number,
                disc_number: track.disc_number,
                isrc: track.external_ids?.isrc,
                preview_url: track.preview_url,
                spotify_url: track.external_urls?.spotify,
                spotify_uri: track.uri,
                release_id: newRelease.id,
                label_id: label.id,
                status: 'published'
              },
              transaction
            });

            if (created) {
              newTracksCount++;

              // Create artist associations
              for (const artist of track.artists) {
                const [artistRecord] = await Artist.findOrCreate({
                  where: { id: artist.id },
                  defaults: {
                    id: artist.id,
                    name: artist.name,
                    spotify_url: artist.external_urls?.spotify,
                    spotify_uri: artist.uri,
                    image_url: artist.images?.[0]?.url,
                    images: artist.images || [],
                    label_id: label.id
                  },
                  transaction
                });

                const [trackArtist] = await TrackArtist.findOrCreate({
                  where: {
                    track_id: trackRecord.id,
                    artist_id: artistRecord.id
                  },
                  transaction
                });

                if (trackArtist) {
                  newArtistAssociationsCount++;
                }
              }
            } else {
              await trackRecord.update({
                title: track.name,
                duration: track.duration_ms,
                track_number: track.track_number,
                disc_number: track.disc_number,
                isrc: track.external_ids?.isrc,
                preview_url: track.preview_url,
                spotify_url: track.external_urls?.spotify,
                spotify_uri: track.uri,
                release_id: newRelease.id,
                label_id: label.id,
                status: 'published'
              }, { transaction });
            }
          }
        } catch (error) {
          logger.error('Error processing release:', {
            id: release.id,
            name: release.name,
            error: error.message,
            stack: error.stack
          });
          failedReleases.add(release);
          throw error;
        }
      }

      // Get final counts from database
      const finalCounts = await Promise.all([
        Release.count({ where: { label_id: label.id }, transaction }),
        Track.count({ where: { label_id: label.id }, transaction })
      ]);

      return {
        totalReleasesFound: releases.size,
        processedReleases: processedReleases.length,
        skippedReleases: skippedReleases.length,
        failedReleases: failedReleases.size,
        newTracks: newTracksCount,
        newArtistAssociations: newArtistAssociationsCount,
        finalCounts: {
          releases: finalCounts[0],
          tracks: finalCounts[1]
        }
      };
    });

    logger.info('Import completed successfully:', result);
    return result;
  } catch (error) {
    logger.error('Error in importTracksForLabel:', error);
    throw error;
  }
};

// Import tracks for a label
router.post('/:labelId/import', async (req, res) => {
  try {
    const result = await importTracksForLabel(req.params.labelId);
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

// Get all labels
router.get('/', async (req, res) => {
  try {
    const labels = await Label.findAll();
    res.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get label statistics
router.get('/stats', async (req, res) => {
  try {
    // First get raw counts for debugging
    const rawCounts = await Promise.all([
      Release.count({ group: ['label_id'] }),
      Track.count({ group: ['label_id'] }),
      Artist.count({
        include: [
          {
            model: Track,
            attributes: [],
            required: true
          }
        ],
        group: ['Track.label_id']
      })
    ]);

    console.log('Raw counts:', {
      releases: rawCounts[0],
      tracks: rawCounts[1],
      artists: rawCounts[2]
    });

    const stats = await Label.findAll({
      attributes: [
        'id',
        'name',
        [sequelize.fn('COUNT', sequelize.distinct('releases.id')), 'releaseCount'],
        [sequelize.fn('COUNT', sequelize.distinct('tracks.id')), 'trackCount'],
        [sequelize.fn('COUNT', sequelize.distinct('artists.id')), 'artistCount']
      ],
      include: [
        { 
          model: Release, 
          as: 'releases', 
          attributes: [],
          required: false
        },
        { 
          model: Track, 
          as: 'tracks', 
          attributes: [],
          required: false,
          include: [{
            model: Artist,
            as: 'artists',
            attributes: [],
            through: { attributes: [] }
          }]
        },
        { 
          model: Artist, 
          as: 'artists', 
          attributes: [],
          through: { attributes: [] }
        }
      ],
      group: ['Label.id', 'Label.name']
    });
    
    console.log('Label stats:', stats.map(s => ({
      id: s.id,
      name: s.name,
      releaseCount: s.get('releaseCount'),
      trackCount: s.get('trackCount'),
      artistCount: s.get('artistCount')
    })));
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting label stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tracks for a label
router.get('/:labelId/tracks', async (req, res) => {
  try {
    console.log(`Fetching tracks for label: ${req.params.labelId}`);
    
    const tracks = await Track.findAll({
      where: { label_id: req.params.labelId },
      include: [
        { 
          model: Artist,
          as: 'artists',
          through: { attributes: [] }
        },
        {
          model: Release,
          as: 'release',
          attributes: ['id', 'name', 'artwork_url', 'release_date', 'total_tracks']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    const formattedTracks = tracks.map(track => ({
      id: track.id,
      title: track.title,
      duration: track.duration,
      preview_url: track.preview_url,
      spotify_url: track.spotify_url,
      spotify_uri: track.spotify_uri,
      release: track.release ? {
        id: track.release.id,
        title: track.release.title,
        artwork_url: track.release.artwork_url,
        release_date: track.release.release_date,
        artists: track.artists.map(artist => ({
          id: artist.id,
          name: artist.name,
          spotify_url: artist.spotify_url
        }))
      } : null
    }));

    console.log(`Found ${tracks.length} tracks`);
    console.log('Sample track with artists:', formattedTracks[0]?.release?.artists?.map(a => ({ id: a.id, name: a.name })));
    
    res.json(formattedTracks);
  } catch (error) {
    console.error('Error fetching tracks for label:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
module.exports.importTracksForLabel = importTracksForLabel;
