/**
 * Script to import missing tracks specifically for Build It Tech label
 */
require('dotenv').config();
const { getSpotifyService } = require('../services/SpotifyService');
const { Label, Release, Artist, Track, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const LABEL_CONFIGS = require('../config/labels');

// Specific additional search terms for Build It Tech
const ADDITIONAL_SEARCH_TERMS = [
  'Build It Tech',
  'Build-It Tech',
  'BuildIt Tech',
  'Build It Technology'
];

async function importTechReleases() {
  try {
    logger.info('Starting import for Build It Tech label');
    
    const spotifyService = await getSpotifyService();
    
    // Get the label from the database
    const label = await Label.findOne({
      where: { 
        slug: 'buildit-tech' 
      }
    });
    
    if (!label) {
      logger.error('Label not found with ID: buildit-tech');
      return;
    }
    
    const labelConfig = LABEL_CONFIGS['buildit-tech'];
    
    // Get all variations including our additional search terms
    const allVariations = [
      ...labelConfig.variations,
      ...ADDITIONAL_SEARCH_TERMS
    ];
    
    // Search with more aggressive terms
    const albums = await spotifyService.searchAlbumsByLabel(
      labelConfig.spotifyLabel,
      allVariations
    );
    
    if (!albums || !albums.items || albums.items.length === 0) {
      logger.error('No albums found for Build It Tech label');
      return;
    }
    
    logger.info(`Found ${albums.items.length} albums for Build It Tech`);
    
    // Process each album individually
    const stats = {
      totalTracksImported: 0,
      totalArtistsImported: 0,
      totalReleasesImported: 0
    };
    
    // Process each album with its own transaction
    for (const album of albums.items) {
      // Start a new transaction for each album
      const albumTransaction = await sequelize.transaction();
      
      try {
        logger.info(`Processing album: ${album.name}`);
        
        // Get full album details
        const fullAlbum = await spotifyService.getAlbum(album.id);
        if (!fullAlbum) {
          await albumTransaction.rollback();
          continue;
        }
        
        // Check if this album is already in our database using alternative keys
        let release;
        try {
          release = await Release.findOne({
            where: {
              [Op.or]: [
                { spotify_id: album.id },
                { spotify_uri: album.uri }
              ]
            },
            transaction: albumTransaction
          });
        } catch (error) {
          logger.error(`Error finding release: ${error.message}`);
          await albumTransaction.rollback();
          continue;
        }
        
        // Create the release if it doesn't exist
        let releaseCreated = false;
        
        if (!release) {
          try {
            release = await Release.create({
              id: generateUuid(), // Generate a valid UUID for our database
              spotify_id: album.id,
              title: album.name,
              release_date: new Date(album.release_date),
              artwork_url: album.images[0]?.url,
              images: album.images,
              spotify_url: album.external_urls.spotify,
              spotify_uri: album.uri,
              total_tracks: album.total_tracks,
              label_id: label.id,
              status: 'active' // Use 'active' instead of 'published'
            }, { transaction: albumTransaction });
            
            releaseCreated = true;
            stats.totalReleasesImported++;
          } catch (error) {
            logger.error(`Error creating release: ${error.message}`);
            await albumTransaction.rollback();
            continue;
          }
        }
        
        // Process all tracks in this album
        for (const track of fullAlbum.tracks.items) {
          try {
            // Check if track exists
            let trackRecord;
            try {
              trackRecord = await Track.findOne({
                where: {
                  [Op.or]: [
                    { spotify_id: track.id },
                    { spotify_uri: track.uri }
                  ]
                },
                transaction: albumTransaction
              });
            } catch (error) {
              logger.error(`Error finding track: ${error.message}`);
              continue;
            }
            
            // Create track if it doesn't exist
            let trackCreated = false;
            
            if (!trackRecord) {
              try {
                trackRecord = await Track.create({
                  id: generateUuid(), // Generate a valid UUID
                  spotify_id: track.id,
                  title: track.name,
                  duration_ms: track.duration_ms,
                  preview_url: track.preview_url,
                  spotify_url: track.external_urls?.spotify,
                  spotify_uri: track.uri,
                  release_id: release.id,
                  track_number: track.track_number,
                  disc_number: track.disc_number || 1
                }, { transaction: albumTransaction });
                
                trackCreated = true;
                stats.totalTracksImported++;
              } catch (error) {
                logger.error(`Error creating track: ${error.message}`);
                continue;
              }
            }
            
            // Process artists for this track
            for (const artist of track.artists) {
              try {
                // Get artist details
                const artistInfo = await spotifyService.getArtist(artist.id);
                if (!artistInfo) continue;
                
                // Check if artist exists
                let artistRecord;
                try {
                  artistRecord = await Artist.findOne({
                    where: {
                      [Op.or]: [
                        { spotify_id: artist.id },
                        { spotify_uri: artist.uri }
                      ]
                    },
                    transaction: albumTransaction
                  });
                } catch (error) {
                  logger.error(`Error finding artist: ${error.message}`);
                  continue;
                }
                
                // Create artist if it doesn't exist
                let artistCreated = false;
                
                if (!artistRecord) {
                  try {
                    artistRecord = await Artist.create({
                      id: generateUuid(), // Generate a valid UUID
                      spotify_id: artist.id,
                      name: artist.name,
                      spotify_url: artist.external_urls?.spotify,
                      spotify_uri: artist.uri,
                      profile_image_url: artistInfo.images?.[0]?.url,
                      profile_image_small_url: artistInfo.images?.[2]?.url, // Smallest image
                      profile_image_large_url: artistInfo.images?.[0]?.url, // Largest image
                      external_urls: artistInfo.external_urls,
                      spotify_followers: artistInfo.followers?.total || 0,
                      spotify_popularity: artistInfo.popularity || 0,
                      spotify_genres: artistInfo.genres || []
                    }, { transaction: albumTransaction });
                    
                    artistCreated = true;
                    stats.totalArtistsImported++;
                  } catch (error) {
                    logger.error(`Error creating artist: ${error.message}`);
                    continue;
                  }
                }
                
                // Associate artist with track if needed
                try {
                  const hasArtist = await trackRecord.hasArtist(artistRecord, { transaction: albumTransaction });
                  if (!hasArtist) {
                    await trackRecord.addArtist(artistRecord, { transaction: albumTransaction });
                  }
                } catch (error) {
                  logger.error(`Error associating artist with track: ${error.message}`);
                }
              } catch (artistError) {
                logger.error(`Error processing artist ${artist.name}:`, artistError);
              }
            }
          } catch (trackError) {
            logger.error(`Error processing track ${track.name}:`, trackError);
          }
        }
        
        // Commit the transaction for this album
        await albumTransaction.commit();
        logger.info(`Successfully processed album: ${album.name}`);
      } catch (albumError) {
        // Rollback the transaction in case of error
        await albumTransaction.rollback();
        logger.error(`Error processing album ${album.name}:`, albumError);
      }
    }
    
    logger.info('Import completed with stats:', stats);
    return stats;
  } catch (error) {
    logger.error('Error in import script:', error);
  }
}

// Helper function to generate UUIDs
function generateUuid() {
  return require('crypto').randomUUID();
}

// Run the import
importTechReleases()
  .then(() => {
    logger.info('Build It Tech import script completed');
    process.exit(0);
  })
  .catch(err => {
    logger.error('Build It Tech import script failed:', err);
    process.exit(1);
  });
