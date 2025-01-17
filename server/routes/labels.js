const express = require('express');
const router = express.Router();
const { Track, Artist, Release, TrackArtist, Label } = require('../models');
const getSpotifyService = require('../services/SpotifyService');
const logger = require('../utils/logger');

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
async function importTracksForLabel(labelId) {
  const spotifyService = getSpotifyService();
  const logger = require('../utils/logger');
  const { Transaction } = require('sequelize');

  try {
    logger.info('Starting import process', { labelId });

    // Initialize Spotify service
    logger.info('Initializing Spotify service...');
    await spotifyService.initialize();
    logger.info('Spotify service initialized');

    // Search for releases
    logger.info('Searching for releases...');
    const releases = await spotifyService.searchReleases(labelId);
    logger.info(`Found ${releases.length} releases to process`);

    if (!releases || releases.length === 0) {
      logger.info('No releases found for import');
      return {
        message: 'No new releases found',
        releases: [],
        stats: {
          existingTracks: 0,
          existingArtistAssociations: 0,
          newTracks: 0,
          newArtistAssociations: 0
        }
      };
    }

    // Get current counts before import
    const existingTracks = await Track.count({ 
      where: { label_id: labelId } 
    });

    // Count artist associations through the TrackArtist join table
    const existingArtists = await Track.count({
      where: { label_id: labelId },
      include: [{
        model: Artist,
        as: 'artists'  // Use the correct alias from Track model
      }]
    });

    logger.info('Current database state:', {
      existingTracks,
      existingArtistAssociations: existingArtists
    });

    // Process releases
    logger.info('Starting release processing...');
    const processedReleases = [];
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
            newRelease = await Release.create({
              id: release.id,
              name: release.name,
              title: release.name,
              release_date: release.release_date,
              artwork_url: release.images?.[0]?.url,
              images: release.images,
              spotify_url: release.external_urls?.spotify,
              spotify_uri: release.uri,
              label_id: labelId,
              total_tracks: release.total_tracks,
              status: 'active'
            }, { transaction });
            logger.info(`Created new release: ${release.name}`);
          } else {
            logger.info(`Release already exists: ${release.name}`);
          }

          // Process tracks for this release
          if (release.tracks && release.tracks.items) {
            for (const track of release.tracks.items) {
              try {
                // Check if track exists
                let newTrack = await Track.findOne({
                  where: { id: track.id },
                  transaction
                });

                if (!newTrack) {
                  newTrack = await Track.create({
                    id: track.id,
                    name: track.name,
                    release_id: newRelease.id,
                    label_id: labelId,
                    duration: track.duration_ms,
                    track_number: track.track_number,
                    preview_url: track.preview_url,
                    spotify_url: track.external_urls?.spotify,
                    spotify_uri: track.uri,
                    isrc: track.external_ids?.isrc
                  }, { transaction });
                  newTracksCount++;
                  logger.info(`Created new track: ${track.name}`);
                }

                // Process artists for this track
                if (track.artists) {
                  for (const artistData of track.artists) {
                    try {
                      // Create or find artist
                      let [artist] = await Artist.findOrCreate({
                        where: { id: artistData.id },
                        defaults: {
                          id: artistData.id,
                          name: artistData.name,
                          spotify_url: artistData.external_urls?.spotify,
                          spotify_uri: artistData.uri,
                          label_id: labelId
                        },
                        transaction
                      });

                      // Create track-artist association if it doesn't exist
                      const [trackArtist, created] = await TrackArtist.findOrCreate({
                        where: {
                          track_id: newTrack.id,
                          artist_id: artist.id
                        },
                        transaction
                      });

                      if (created) {
                        newArtistAssociationsCount++;
                        logger.info(`Created new artist association: ${track.name} - ${artistData.name}`);
                      }
                    } catch (error) {
                      logger.error(`Error processing artist ${artistData.name} for track ${track.name}:`, error);
                    }
                  }
                }
              } catch (error) {
                logger.error(`Error processing track ${track.name}:`, error);
              }
            }
          }

          processedReleases.push({
            id: newRelease.id,
            name: release.name,
            trackCount: release.tracks?.items?.length || 0
          });

        } catch (error) {
          logger.error(`Error processing release ${release.name}:`, error);
          // Continue with next release
        }
      }

      return {
        processedReleases,
        stats: {
          existingTracks,
          existingArtistAssociations: existingArtists,
          newTracks: newTracksCount,
          newArtistAssociations: newArtistAssociationsCount
        }
      };
    });

    logger.info('Import completed', { processedReleases: result.processedReleases, stats: result.stats });
    return {
      message: `Import completed. Added ${result.stats.newTracks} new tracks and ${result.stats.newArtistAssociations} new artist associations.`,
      releases: result.processedReleases,
      stats: result.stats
    };

  } catch (error) {
    logger.error('Error in importTracksForLabel:', error);
    throw error;
  }
}

// Import tracks for a label
router.post('/:labelId/import', async (req, res) => {
  try {
    const result = await importTracksForLabel(req.params.labelId);
    res.json({ 
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error in import route:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      error: error.message 
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
    
    console.log(`Found ${tracks.length} tracks`);
    console.log('Sample track with artists:', tracks[0]?.artists?.map(a => ({ id: a.id, name: a.name })));
    
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks for label:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
module.exports.importTracksForLabel = importTracksForLabel;
