const { Artist, Release, Track, Sequelize } = require('../server/models');
const { getSpotifyService } = require('../server/services/SpotifyService');
const logger = require('../server/utils/logger');
require('dotenv').config();

const { Op } = Sequelize;

async function updateArtistImages() {
  const spotify = await getSpotifyService();
  const BATCH_SIZE = 10;
  const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds
  
  try {
    // Get all artists from the database that need image updates
    const artists = await Artist.findAll({
      where: {
        [Op.or]: [
          { profile_image_url: null },
          { profile_image_small_url: null },
          { profile_image_large_url: null }
        ]
      },
      include: [
        {
          model: Release,
          as: 'releases',
          attributes: ['artwork_url', 'artwork_small_url', 'artwork_large_url'],
          through: { attributes: [] }
        },
        {
          model: Track,
          as: 'tracks',
          attributes: [],
          include: [{
            model: Release,
            as: 'release',
            attributes: ['artwork_url', 'artwork_small_url', 'artwork_large_url']
          }]
        }
      ]
    });

    logger.info(`Found ${artists.length} artists that need image updates`);

    // Process artists in batches
    for (let i = 0; i < artists.length; i += BATCH_SIZE) {
      const batch = artists.slice(i, i + BATCH_SIZE);
      logger.info(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(artists.length/BATCH_SIZE)}`);

      // Process batch in parallel with Promise.all
      await Promise.all(batch.map(async (artist) => {
        try {
          logger.info(`Updating images for artist: ${artist.name} (${artist.id})`);
          
          // First try to get artist by Spotify ID if we have it
          let spotifyArtist;
          if (artist.spotify_id) {
            try {
              spotifyArtist = await spotify.getArtist(artist.spotify_id);
            } catch (error) {
              logger.warn(`Failed to get artist by Spotify ID ${artist.spotify_id}:`, error.message);
            }
          }

          // If no Spotify ID or lookup failed, try searching by name
          if (!spotifyArtist) {
            const searchResults = await spotify.searchArtists(artist.name, 1);
            if (searchResults?.length > 0) {
              spotifyArtist = searchResults[0];
            }
          }

          let updateData = {};

          if (spotifyArtist?.images?.length > 0) {
            // Get images of different sizes
            const [large, medium, small] = spotifyArtist.images.sort((a, b) => (b.width || 0) - (a.width || 0));

            updateData = {
              spotify_id: spotifyArtist.id,
              profile_image_url: medium?.url || large?.url || small?.url,
              profile_image_large_url: large?.url,
              profile_image_small_url: small?.url,
              spotify_url: spotifyArtist.external_urls?.spotify,
              spotify_uri: spotifyArtist.uri
            };
            logger.info(`Found Spotify images for ${artist.name}`);
          } else {
            // Try to get artwork from releases or tracks
            let artworkUrl, artworkSmallUrl, artworkLargeUrl;

            // First check direct releases
            const latestRelease = artist.releases?.[0];
            if (latestRelease?.artwork_url) {
              artworkUrl = latestRelease.artwork_url;
              artworkSmallUrl = latestRelease.artwork_small_url || latestRelease.artwork_url;
              artworkLargeUrl = latestRelease.artwork_large_url || latestRelease.artwork_url;
            } else {
              // Then check tracks' releases
              const trackWithArtwork = artist.tracks?.find(track => track.Release?.artwork_url);
              if (trackWithArtwork?.Release) {
                artworkUrl = trackWithArtwork.Release.artwork_url;
                artworkSmallUrl = trackWithArtwork.Release.artwork_small_url || trackWithArtwork.Release.artwork_url;
                artworkLargeUrl = trackWithArtwork.Release.artwork_large_url || trackWithArtwork.Release.artwork_url;
              }
            }

            if (artworkUrl) {
              updateData = {
                profile_image_url: artworkUrl,
                profile_image_large_url: artworkLargeUrl,
                profile_image_small_url: artworkSmallUrl
              };
              logger.info(`Using release artwork for ${artist.name}`);
            } else {
              logger.warn(`No images found for ${artist.name} (no Spotify or release artwork)`);
            }
          }

          if (Object.keys(updateData).length > 0) {
            updateData.updated_at = new Date();
            await artist.update(updateData);
            logger.info(`Successfully updated images for ${artist.name}`);
          }
        } catch (error) {
          logger.error(`Error updating artist ${artist.name}:`, error);
        }
      }));

      // Add delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < artists.length) {
        logger.info(`Waiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    logger.info('Finished updating artist images');
  } catch (error) {
    logger.error('Fatal error:', error);
    throw error;
  }
}

// Add proper error handling for the main execution
if (require.main === module) {
  updateArtistImages()
    .then(() => {
      logger.info('Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = updateArtistImages;
