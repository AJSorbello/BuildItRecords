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
    const searchQueries = {
      'Build It Records': 'label:"Build It Records"',
      'Build It Tech': 'label:"Build It Tech"',
      'Build It Deep': 'label:"Build It Deep"'
    };

    const searchQuery = searchQueries[label.name] || `label:"${label.name}"`;
    logger.info('Searching Spotify with query:', searchQuery);
    
    const releases = new Set();
    const failedReleases = new Set();

    // Implement pagination to get all albums
    let offset = 0;
    const limit = 50; // Spotify's maximum limit per request
    let hasMore = true;
    let totalAlbums = 0;

    while (hasMore) {
      try {
        // Search for albums with pagination
        const albumsResponse = await spotifyService.searchAlbums(searchQuery, { limit, offset });
        logger.info(`Fetching albums batch: offset=${offset}, limit=${limit}, found=${albumsResponse?.items?.length || 0}, total=${albumsResponse?.total || 0}`);
        
        if (!albumsResponse?.items || albumsResponse.items.length === 0) {
          hasMore = false;
          continue;
        }

        // Update total on first request
        if (offset === 0) {
          totalAlbums = albumsResponse.total;
          logger.info(`Found ${totalAlbums} total albums for label ${label.name}`);
        }

        // Process each album
        for (const album of albumsResponse.items) {
          try {
            // Get full album details
            const fullAlbum = await spotifyService.getAlbum(album.id);
            if (fullAlbum) {
              releases.add(fullAlbum);
            }
          } catch (error) {
            logger.error('Error processing album:', {
              albumId: album.id,
              error: error.message
            });
            failedReleases.add(album);
          }
        }

        offset += albumsResponse.items.length;
        hasMore = offset < totalAlbums;

        // Add a small delay between batches
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        logger.error('Error fetching albums batch:', {
          offset,
          error: error.message
        });
        hasMore = false;
      }
    }

    logger.info('Completed Spotify search:', {
      totalAlbumsSearched: offset,
      matchingReleases: releases.size,
      failedReleases: failedReleases.size
    });

    // Process releases
    logger.info('Starting release processing...');
    const processedReleases = [];
    const processedTracks = [];
    const newTracksCount = 0;
    let newArtistAssociationsCount = 0;

    // Use a transaction for the entire import
    const result = await sequelize.transaction(async (transaction) => {
      try {
        for (const release of releases) {
          try {
            logger.info(`Processing release: ${release.name}`);
            
            // Try to find existing release by spotify_id
            let newRelease = await Release.findOne({
              where: { spotify_id: release.id },
              transaction
            });

            if (!newRelease) {
              logger.info('Creating new release:', {
                spotify_id: release.id,
                name: release.name,
                label: release.label
              });

              // Create release with auto-generated UUID
              newRelease = await Release.create({
                spotify_id: release.id,
                name: release.name,
                title: release.name,
                release_type: release.album_type || 'album',
                release_date: release.release_date || new Date(),
                artwork_url: release.images?.[0]?.url,
                images: release.images || [],
                spotify_url: release.external_urls?.spotify,
                label_id: label.id,
                total_tracks: release.total_tracks,
                status: 'published'
              }, { transaction });

              // Create artist associations for the release
              for (const artist of release.artists) {
                try {
                  // Find or create artist using spotify_id
                  const [artistRecord] = await Artist.findOrCreate({
                    where: { spotify_id: artist.id },
                    defaults: {
                      name: artist.name,
                      spotify_id: artist.id,
                      spotify_url: artist.external_urls?.spotify,
                      profile_image_url: artist.images?.[0]?.url,
                      images: artist.images || [],
                      label_id: label.id,
                      status: 'active'
                    },
                    transaction
                  });

                  await newRelease.addArtist(artistRecord, { transaction });
                  newArtistAssociationsCount++;
                } catch (error) {
                  logger.error('Error creating artist association:', {
                    artistId: artist.id,
                    releaseId: newRelease.id,
                    error: error.message
                  });
                }
              }

              processedReleases.push(newRelease);
            } else {
              logger.info('Release already exists:', {
                id: newRelease.id,
                spotify_id: release.id,
                name: release.name
              });
              processedReleases.push(newRelease);
            }

            // Process tracks for this release
            if (release.tracks?.items) {
              for (const track of release.tracks.items) {
                try {
                  // Check if track already exists by spotify_id
                  let trackRecord = await Track.findOne({
                    where: { spotify_id: track.id },
                    transaction
                  });

                  if (!trackRecord) {
                    logger.info('Creating new track:', {
                      spotify_id: track.id,
                      name: track.name
                    });

                    // Create track with auto-generated UUID
                    trackRecord = await Track.create({
                      spotify_id: track.id,
                      title: track.name,
                      duration_ms: track.duration_ms,
                      track_number: track.track_number,
                      disc_number: track.disc_number || 1,
                      isrc: track.external_ids?.isrc,
                      preview_url: track.preview_url,
                      spotify_url: track.external_urls?.spotify,
                      spotify_popularity: track.popularity,
                      external_urls: track.external_urls,
                      release_id: newRelease.id,
                      status: 'published',
                      type: 'track'
                    }, { transaction });

                    processedTracks.push(trackRecord);

                    // Create artist associations
                    for (const artist of track.artists) {
                      try {
                        // Find or create artist using spotify_id
                        const [artistRecord] = await Artist.findOrCreate({
                          where: { spotify_id: artist.id },
                          defaults: {
                            name: artist.name,
                            spotify_id: artist.id,
                            spotify_url: artist.external_urls?.spotify,
                            profile_image_url: artist.images?.[0]?.url,
                            images: artist.images || [],
                            label_id: label.id,
                            status: 'active'
                          },
                          transaction
                        });

                        // Create track-artist association
                        await trackRecord.addArtist(artistRecord, { transaction });
                        newArtistAssociationsCount++;
                      } catch (error) {
                        logger.error('Error creating track-artist association:', {
                          trackId: trackRecord.id,
                          artistId: artist.id,
                          error: error.message
                        });
                      }
                    }
                  } else {
                    logger.info('Track already exists:', {
                      id: trackRecord.id,
                      spotify_id: track.id,
                      name: track.name
                    });
                    processedTracks.push(trackRecord);
                  }
                } catch (error) {
                  logger.error('Error processing track:', {
                    trackId: track.id,
                    releaseName: release.name,
                    error: error.message
                  });
                }
              }
            }
          } catch (error) {
            logger.error('Error processing release:', {
              id: release.id,
              name: release.name,
              error: error.message
            });
            failedReleases.add(release);
          }
        }

        // Get final counts from database
        const [releaseCount, trackCount, artistCount] = await Promise.all([
          Release.count({ where: { label_id: label.id }, transaction }),
          Track.count({ 
            include: [{
              model: Release,
              as: 'release',
              where: { label_id: label.id },
              required: true
            }],
            transaction 
          }),
          Artist.count({
            include: [{
              model: Release,
              as: 'releases',
              required: true,
              where: { label_id: label.id }
            }],
            transaction
          })
        ]);

        return {
          totalReleasesFound: releases.size,
          processedReleases: processedReleases.length,
          failedReleases: failedReleases.size,
          newTracks: processedTracks.length,
          newArtistAssociations: newArtistAssociationsCount,
          finalCounts: {
            releases: releaseCount,
            tracks: trackCount,
            artists: artistCount
          }
        };
      } catch (error) {
        logger.error('Error in transaction:', error);
        throw error;
      }
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

// Create or update label
router.post('/', async (req, res) => {
  try {
    const { name, slug, display_name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const [label, created] = await Label.findOrCreate({
      where: { name },
      defaults: {
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        display_name: display_name || name,
        status: 'active'
      }
    });

    res.json({ label, created });
  } catch (error) {
    console.error('Error creating/updating label:', error);
    res.status(500).json({ error: error.message });
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
    const [releaseCounts, trackCounts, artistCounts] = await Promise.all([
      Release.count({ group: ['label_id'] }),
      Release.findAll({
        attributes: [
          'label_id',
          [sequelize.fn('COUNT', sequelize.col('tracks.id')), 'track_count']
        ],
        include: [{
          model: Track,
          as: 'tracks',
          attributes: []
        }],
        group: ['Release.label_id']
      }),
      Artist.count({
        include: [{
          model: Release,
          as: 'releases',
          attributes: [],
          required: true
        }],
        group: ['releases.label_id']
      })
    ]);

    console.log('Raw counts:', {
      releases: releaseCounts,
      tracks: trackCounts,
      artists: artistCounts
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

// Get counts for each label
router.get('/counts', async (req, res) => {
  try {
    const labels = await Label.findAll({
      attributes: ['id', 'name', 'slug'],
      include: [
        {
          model: Release,
          as: 'releases',
          attributes: [],
        },
        {
          model: Artist,
          as: 'artists',
          attributes: [],
        }
      ],
      group: ['Label.id', 'Label.name', 'Label.slug'],
      raw: true,
      nest: true,
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('releases.id'))), 'releaseCount'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('artists.id'))), 'artistCount']
        ]
      }
    });

    // Get track counts
    const labelIds = labels.map(l => l.id);
    const trackCounts = await Release.findAll({
      attributes: [
        'label_id',
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('Tracks.id'))), 'trackCount']
      ],
      include: [{
        model: Track,
        as: 'tracks',
        attributes: []
      }],
      where: {
        label_id: {
          [Op.in]: labelIds
        }
      },
      group: ['label_id'],
      raw: true
    });

    // Combine the results
    const labelStats = labels.map(label => {
      const trackData = trackCounts.find(tc => tc.label_id === label.id) || { trackCount: '0' };
      return {
        ...label,
        trackCount: parseInt(trackData.trackCount),
        releaseCount: parseInt(label.releaseCount),
        artistCount: parseInt(label.artistCount)
      };
    });

    res.json(labelStats);
  } catch (error) {
    console.error('Error getting label counts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tracks for a label
router.get('/:labelId/tracks', async (req, res) => {
  try {
    console.log(`Fetching tracks for label: ${req.params.labelId}`);
    
    const releases = await Release.findAll({
      where: { label_id: req.params.labelId },
      include: [
        {
          model: Track,
          as: 'tracks',
          include: [{
            model: Artist,
            as: 'artists',
            through: { attributes: [] }
          }]
        }
      ]
    });

    const tracks = releases.reduce((acc, release) => acc.concat(release.tracks), []);

    const formattedTracks = tracks.map(track => ({
      id: track.id,
      title: track.title,
      duration: track.duration,
      preview_url: track.preview_url,
      spotify_url: track.spotify_url,
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
