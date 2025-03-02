const SpotifyWebApi = require('spotify-web-api-node');
const { Label, Release, Artist, Track, sequelize } = require('../models');
const logger = require('../utils/logger');

// Add this helper function at the beginning of the file, after imports
function isValidUuid(id) {
  // Check if it's a valid UUID format (Spotify IDs might not always be UUIDs)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

let spotifyServiceInstance = null;

class SpotifyService {
  constructor(clientId, clientSecret, redirectUri) {
    if (!clientId || !clientSecret) {
      throw new Error('Spotify client ID and client secret are required');
    }
    
    // Use the first redirect URI (http://localhost:19000/--/spotify-auth-callback)
    const defaultRedirectUri = 'http://localhost:19000/--/spotify-auth-callback';
    
    logger.info('Initializing Spotify API with:', {
      clientId: clientId ? '✓' : '✗',
      clientSecret: clientSecret ? '✓' : '✗',
      redirectUri: defaultRedirectUri
    });

    this.spotifyApi = new SpotifyWebApi({
      clientId,
      clientSecret,
      redirectUri: defaultRedirectUri
    });

    this._tokenExpiresAt = null;
    this._rateLimitResetTime = null;
    this._isRefreshing = false;
  }

  async _handleRateLimit(retryAfter) {
    const waitTimeInSeconds = Math.min(retryAfter, 30); // Cap wait time at 30 seconds
    this._rateLimitResetTime = Date.now() + (waitTimeInSeconds * 1000);
    
    logger.info(`Rate limit hit. Retrying in ${waitTimeInSeconds} seconds...`, {
      retryAfter,
      waitTime: waitTimeInSeconds,
      resetTime: new Date(this._rateLimitResetTime).toISOString()
    });

    await new Promise(resolve => setTimeout(resolve, waitTimeInSeconds * 1000));
    this._rateLimitResetTime = null;
    
    // Add a small delay between requests after rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async _refreshTokenIfNeeded() {
    // Check if token is expired or will expire in the next 5 minutes
    const now = Date.now();
    const tokenNeedsRefresh = !this._tokenExpiresAt || (this._tokenExpiresAt - now) < 300000;

    if (tokenNeedsRefresh && !this._isRefreshing) {
      this._isRefreshing = true;
      try {
        logger.info('Refreshing Spotify access token...');
        const data = await this.spotifyApi.clientCredentialsGrant();
        this.spotifyApi.setAccessToken(data.body['access_token']);
        this._tokenExpiresAt = now + data.body['expires_in'] * 1000;
        logger.info(`Successfully refreshed Spotify token. Expires in: ${data.body['expires_in']} seconds`);
      } catch (error) {
        logger.error('Error refreshing Spotify token:', error);
        throw error;
      } finally {
        this._isRefreshing = false;
      }
    }
  }

  async initialize() {
    try {
      if (!this.spotifyApi.getClientId() || !this.spotifyApi.getClientSecret()) {
        logger.error('Missing Spotify credentials:', {
          clientId: this.spotifyApi.getClientId() ? 'present' : 'missing',
          clientSecret: this.spotifyApi.getClientSecret() ? 'present' : 'missing'
        });
        throw new Error('Spotify API credentials not properly configured');
      }

      await this._refreshTokenIfNeeded();
    } catch (error) {
      logger.error('Failed to initialize Spotify service:', error);
      throw error;
    }
  }

  async makeRequest(requestFn) {
    const maxRetries = 3;
    let retryCount = 0;
    let lastError = null;

    while (retryCount < maxRetries) {
      try {
        // Always refresh token if needed before making request
        await this._refreshTokenIfNeeded();

        // Check if we need to wait for rate limit
        if (this._rateLimitResetTime) {
          const waitTime = this._rateLimitResetTime - Date.now();
          if (waitTime > 0) {
            logger.info(`Waiting for rate limit reset: ${Math.ceil(waitTime / 1000)}s remaining`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }

        // Execute the request
        const result = await requestFn();
        return result;

      } catch (error) {
        lastError = error;
        retryCount++;

        // Handle rate limiting
        if (error.statusCode === 429 && error.headers && error.headers['retry-after']) {
          await this._handleRateLimit(parseInt(error.headers['retry-after']));
          continue;
        }

        // Handle token errors
        if (error.statusCode === 401) {
          logger.warn('Token error, forcing refresh...', error.message);
          this._tokenExpiresAt = null; // Force token refresh
          continue;
        }

        // If we've retried enough times, throw the error
        if (retryCount >= maxRetries) {
          throw error;
        }

        // Add exponential backoff
        const backoffTime = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
        logger.info(`Retrying request in ${backoffTime}ms (attempt ${retryCount} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }

    logger.error('Max retries exceeded for Spotify API request:', {
      error: lastError?.message,
      statusCode: lastError?.statusCode
    });
    throw new Error('Max retries exceeded for Spotify API request');
  }

  async getAlbumById(albumId) {
    try {
      const requestFn = async () => {
        logger.info('Fetching album by ID:', albumId);
        const result = await this.spotifyApi.getAlbum(albumId);
        
        if (!result.body) {
          logger.error('No album data in response:', result);
          return null;
        }

        logger.info('Found album:', {
          name: result.body.name,
          label: result.body.label,
          artists: result.body.artists.map(a => a.name)
        });

        return result.body;
      };

      return await this.makeRequest(requestFn);
    } catch (error) {
      logger.error('Error fetching album by ID:', error);
      throw error;
    }
  }

  async searchAlbumsByLabel(labelName, variations = []) {
    try {
      logger.info('Searching albums for label:', labelName);

      const requestFn = async () => {
        // Build search queries
        const queries = [
          `label:"${labelName}"`,
          `label:"${labelName.toLowerCase()}"`,
          `label:"${labelName.replace(/records/i, '')}"`,
        ];
        
        // Add variations if provided
        if (variations && variations.length > 0) {
          for (const variation of variations) {
            if (!queries.includes(`label:"${variation}"`)) {
              queries.push(`label:"${variation}"`);
            }
          }
        }

        let allAlbums = { items: [] };

        for (const query of queries) {
          logger.info('Using search query:', query);

          const result = await this.spotifyApi.searchAlbums(query, {
            limit: 50,
            market: 'GB'
          });

          if (!result.body || !result.body.albums) {
            logger.error('Invalid response from Spotify:', result);
            continue;
          }

          // Add new albums to the list, avoiding duplicates
          const newAlbums = result.body.albums.items.filter(
            newAlbum => !allAlbums.items.some(
              existingAlbum => existingAlbum.id === newAlbum.id
            )
          );
          allAlbums.items.push(...newAlbums);

          logger.info('Found albums:', {
            query,
            total: result.body.albums.total,
            new: newAlbums.length,
            accumulated: allAlbums.items.length
          });

          // Add a small delay between queries
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return allAlbums;
      };

      return await this.makeRequest(requestFn);
    } catch (error) {
      logger.error('Error searching albums:', error);
      throw error;
    }
  }

  async getAlbum(albumId) {
    try {
      const requestFn = async () => {
        logger.info('Fetching album by ID:', albumId);
        const result = await this.spotifyApi.getAlbum(albumId);
        
        if (!result.body) {
          logger.error('No album data in response:', result);
          return null;
        }

        logger.info('Found album:', {
          name: result.body.name,
          label: result.body.label,
          artists: result.body.artists.map(a => a.name)
        });

        return result.body;
      };

      return await this.makeRequest(requestFn);
    } catch (error) {
      logger.error('Error fetching album by ID:', error);
      throw error;
    }
  }

  async getArtist(artistId) {
    try {
      // Ensure we have a valid Spotify ID
      if (!artistId || typeof artistId !== 'string') {
        throw new Error('Invalid artist ID provided');
      }

      // Clean the Spotify ID - remove any spotify:artist: prefix if present
      const cleanId = artistId.replace('spotify:artist:', '');
      
      // Validate the Spotify ID format (base62 string)
      const isValidSpotifyId = /^[0-9A-Za-z]{22}$/.test(cleanId);
      if (!isValidSpotifyId) {
        throw new Error('Invalid Spotify artist ID format');
      }

      // Fetch the artist data
      const response = await this.spotifyApi.getArtist(cleanId);
      return response.body;
    } catch (error) {
      logger.error('Error fetching artist by ID:', error);
      throw error;
    }
  }

  async updateArtistImages(artist) {
    try {
      if (!artist || !artist.spotify_id) {
        logger.warn('No Spotify ID available for artist:', artist?.name);
        return;
      }

      // Get full artist data from Spotify
      const artistInfo = await this.getArtist(artist.spotify_id);
      
      if (!artistInfo || !artistInfo.images || !artistInfo.images.length) {
        logger.warn('No images found for artist:', artist.name);
        return;
      }

      // Sort images by size (largest to smallest)
      const sortedImages = [...artistInfo.images].sort((a, b) => (b.width || 0) - (a.width || 0));
      
      // Get images for different sizes
      const largeImage = sortedImages[0]?.url;
      const mediumImage = sortedImages[1]?.url || largeImage;
      const smallImage = sortedImages[2]?.url || mediumImage;

      // Update the artist with new image data
      await artist.update({
        image_url: largeImage,
        profile_image_url: mediumImage,
        profile_image_small_url: smallImage,
        profile_image_large_url: largeImage,
        images: artistInfo.images
      });

      logger.info('Successfully updated images for artist:', artist.name);
    } catch (error) {
      logger.error('Error updating images for artist:', artist.name, error);
      throw error;
    }
  }

  async searchReleases(labelId) {
    try {
      logger.info('Searching releases for label:', labelId);
      const releases = new Set();

      // Get label from database
      const label = await Label.findByPk(labelId);
      if (!label) {
        throw new Error(`Label not found: ${labelId}`);
      }

      const labelName = label.display_name || label.name;
      logger.info('Using label name:', labelName);

      // First get all artists for this label through releases
      const artists = await Artist.findAll({
        include: [{
          model: Release,
          as: 'releases',
          required: true,
          where: { label_id: labelId },
          attributes: []
        }],
        attributes: ['name', 'spotify_id'],
        raw: true
      });

      // Build search queries using Spotify's advanced search operators
      const searchQueries = [
        // Exact label match
        `label:"${labelName}"`,
        
        // Try alternative spellings/formats
        `label:"${labelName.toLowerCase()}"`,
        `label:"${labelName.replace(/records/i, 'rec')}"`,
        
        // Search by known artists
        ...artists.filter(a => a.spotify_id).map(artist => 
          `artist:${artist.spotify_id} label:"${labelName}"`
        )
      ];

      logger.info('Using optimized search queries:', {
        labelId,
        labelName,
        totalQueries: searchQueries.length,
        artistCount: artists.length
      });

      const transaction = await sequelize.transaction();

      try {
        for (const searchQuery of searchQueries) {
          logger.info(`Executing search query: ${searchQuery}`);
          
          let offset = 0;
          let hasMore = true;
          let retryCount = 0;
          const maxRetries = 3;

          while (hasMore && offset < 1000) { // Limit to first 1000 results
            try {
              const response = await this.spotifyApi.searchAlbums(searchQuery, {
                limit: 50,
                offset,
                market: 'GB'
              });
              
              if (!response.body.albums || !response.body.albums.items) {
                logger.error('Invalid response from Spotify:', response.body);
                continue;
              }

              const items = response.body.albums.items;
              logger.info('Search result:', {
                query: searchQuery,
                offset,
                limit: 50,
                total: response.body.albums.total,
                found: items.length,
                hasMore: items.length === 50
              });

              // Process albums sequentially to avoid rate limits
              for (const album of items) {
                try {
                  // Get full album details
                  const fullAlbum = await this.getAlbumById(album.id);
                  if (!fullAlbum) {
                    logger.warn(`Could not get full album details for ${album.name} (${album.id})`);
                    continue;
                  }

                  const albumLabel = fullAlbum.label;
                  logger.info('Checking album:', {
                    id: fullAlbum.id,
                    name: fullAlbum.name,
                    label: albumLabel,
                    targetLabel: labelName
                  });

                  // Check if this is our label using fuzzy matching
                  const isMatch = 
                    albumLabel?.toLowerCase().includes(labelName.toLowerCase()) ||
                    labelName.toLowerCase().includes(albumLabel?.toLowerCase());

                  if (isMatch && !releases.has(fullAlbum.id)) {
                    releases.add(fullAlbum.id);
                    logger.info('Found matching album:', {
                      id: fullAlbum.id,
                      name: fullAlbum.name,
                      label: albumLabel
                    });
                  } else {
                    logger.info('Skipping non-matching label:', {
                      albumLabel,
                      targetLabel: labelName
                    });
                  }

                  // Add a small delay between requests
                  await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                  logger.error('Error processing album:', {
                    albumId: album.id,
                    error: error.message
                  });
                }
              }

              hasMore = items.length === 50;
              offset += items.length;
            } catch (error) {
              logger.error('Error in search loop:', error);
              retryCount++;
              if (retryCount >= maxRetries) {
                logger.error('Max retries reached, moving to next query');
                break;
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }

        // Convert the Set back to an array
        const uniqueReleases = Array.from(releases);
        logger.info(`Found ${uniqueReleases.length} unique releases for label: ${labelName}`);
        return uniqueReleases;

      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error('Error searching releases:', error);
      throw error;
    }
  }

  async importTracksFromSpotify(label, transaction = null) {
    try {
      const logger = require('../utils/logger').createLogger('SpotifyService.importTracksFromSpotify');
      logger.info(`Starting import for label: ${label.name}`);

      // Initialize counters
      let totalTracksImported = 0;
      let totalArtistsImported = 0;
      let totalReleasesImported = 0;
      let offset = 0;
      const limit = 50; // Maximum allowed by Spotify
      let hasMore = true;

      while (hasMore) {
        // Get albums with pagination
        const albumsResponse = await this.spotifyApi.getArtistAlbums(label.spotify_id, {
          limit: limit,
          offset: offset,
          include_groups: 'album,single'
        });

        const albums = albumsResponse.body.items;
        logger.info(`Processing ${albums.length} albums from offset ${offset}`);
        hasMore = albumsResponse.body.next !== null;

        for (const album of albums) {
          try {
            logger.info(`Processing release: ${album.name} (${album.id})`);

            // Create or update release
            const [release, created] = await Release.findOrCreate({
              where: { id: album.id },
              defaults: {
                id: album.id,
                title: album.name,
                release_date: new Date(album.release_date),
                artwork_url: album.images[0]?.url,
                images: album.images,
                spotify_url: album.external_urls.spotify,
                spotify_uri: album.uri,
                total_tracks: album.total_tracks,
                label_id: label.id,
                status: 'published'
              },
              transaction
            });

            if (created) {
              totalReleasesImported++;
              logger.info(`Created new release: ${album.name}`);
            }

            // Get all tracks for this album
            let trackOffset = 0;
            let hasMoreTracks = true;

            while (hasMoreTracks) {
              const tracksResponse = await this.spotifyApi.getAlbumTracks(album.id, {
                limit: 50,
                offset: trackOffset
              });

              const tracks = tracksResponse.body.items;
              hasMoreTracks = tracksResponse.body.next !== null;

              for (const track of tracks) {
                try {
                  const [trackRecord, trackCreated] = await Track.findOrCreate({
                    where: { id: track.id },
                    defaults: {
                      id: track.id,
                      title: track.name,  // Use name from Spotify
                      duration: track.duration_ms,
                      preview_url: track.preview_url,
                      spotify_url: track.external_urls?.spotify,
                      spotify_uri: track.uri,
                      release_id: release.id,
                      status: 'published'
                    },
                    transaction
                  });

                  if (trackCreated) {
                    totalTracksImported++;
                    logger.info(`Created new track: ${track.name}`);
                  }

                  // Process artists for this track
                  for (const artist of track.artists) {
                    try {
                      // Get full artist details from Spotify
                      const artistDetails = await this.getArtist(artist.id);
                      
                      const [artistRecord, artistCreated] = await Artist.findOrCreate({
                        where: { id: artist.id },
                        defaults: {
                          id: artist.id,
                          name: artist.name,
                          display_name: artistDetails.name,
                          profile_image_url: artistDetails.images?.[0]?.url || null,
                          profile_image_small_url: artistDetails.images?.[2]?.url || null,
                          profile_image_large_url: artistDetails.images?.[0]?.url || null,
                          spotify_url: artist.external_urls.spotify,
                          spotify_uri: artist.uri,
                          spotify_id: artist.id,
                          external_urls: artistDetails.external_urls || {},
                          label_id: label.id
                        },
                        transaction
                      });

                      if (artistCreated) {
                        totalArtistsImported++;
                        logger.info(`Created new artist: ${artist.name} with image: ${artistDetails.images?.[0]?.url || 'none'}`);
                      } else if (!artistRecord.profile_image_url && artistDetails.images?.[0]?.url) {
                        // Update existing artist with images if they don't have any
                        await artistRecord.update({
                          profile_image_url: artistDetails.images[0].url,
                          profile_image_small_url: artistDetails.images[2]?.url || artistDetails.images[0].url,
                          profile_image_large_url: artistDetails.images[0].url,
                          external_urls: artistDetails.external_urls || {}
                        }, { transaction });
                        logger.info(`Updated images for existing artist: ${artist.name}`);
                      }

                      // Link artist to track
                      await trackRecord.addArtist(artistRecord, { transaction });
                    } catch (error) {
                      logger.error(`Error processing artist ${artist.name}: ${error.message}`);
                    }
                  }
                } catch (error) {
                  logger.error(`Error processing track: ${track.name}`, {
                    trackId: track.id,
                    trackName: track.name,
                    error: error.message
                  });
                }
              }

              trackOffset += tracks.length;
            }
          } catch (error) {
            logger.error(`Error processing album: ${album.name}`, {
              albumId: album.id,
              albumName: album.name,
              error: error.message
            });
          }
        }

        offset += albums.length;
      }

      logger.info(`Import completed. Imported: ${totalTracksImported} tracks, ${totalArtistsImported} artists, ${totalReleasesImported} releases`);
      return { totalTracksImported, totalArtistsImported, totalReleasesImported };

    } catch (error) {
      console.error('Error in importTracksFromSpotify:', error);
      throw error;
    }
  }

  async importReleases(label, albums, transaction = null) {
    const stats = {
      totalTracksImported: 0,
      totalArtistsImported: 0,
      totalReleasesImported: 0
    };

    let outerTransaction = transaction;
    
    try {
      // Start a transaction if one wasn't provided
      const shouldCommit = !outerTransaction;
      if (shouldCommit) {
        outerTransaction = await sequelize.transaction();
      }
      
      for (const album of albums.items) {
        // Skip if the ID is not a valid UUID (if our schema requires UUIDs)
        if (!isValidUuid(album.id)) {
          logger.warn(`Skipping album ${album.name} - ID is not a valid UUID: ${album.id}`);
          continue;
        }
        
        // Use a separate transaction for each album to prevent cascading failures
        const albumTransaction = await sequelize.transaction();
        
        try {
          logger.info(`Processing album: ${album.name}`);
          
          // Get full album details
          const fullAlbum = await this.getAlbum(album.id);
          if (!fullAlbum) {
            await albumTransaction.commit();
            continue;
          }

          // Filter by label - check if label name matches any variations
          const labelConfig = require('../config/labels');
          const labelVariations = Object.values(labelConfig)
            .map(config => config.variations || [])
            .flat();
            
          const matchesLabel = 
            fullAlbum.label === label.name || 
            labelVariations.includes(fullAlbum.label);
            
          if (!matchesLabel) {
            logger.info(`Skipping album ${album.name} - label mismatch: ${fullAlbum.label}`);
            await albumTransaction.commit();
            continue;
          }

          // Create or update release
          const [release, releaseCreated] = await Release.findOrCreate({
            where: { id: album.id },
            defaults: {
              id: album.id,
              title: album.name,
              release_date: new Date(album.release_date),
              artwork_url: album.images[0]?.url,
              images: album.images,
              spotify_url: album.external_urls.spotify,
              spotify_uri: album.uri,
              total_tracks: album.total_tracks,
              label_id: label.id,
              status: 'published'
            },
            transaction: albumTransaction
          });

          if (releaseCreated) {
            stats.totalReleasesImported++;
          }

          // Process all tracks
          for (const track of fullAlbum.tracks.items) {
            try {
              // Skip tracks with non-UUID IDs
              if (!isValidUuid(track.id)) {
                logger.warn(`Skipping track ${track.name} - ID is not a valid UUID: ${track.id}`);
                continue;
              }
              
              const [trackRecord, trackCreated] = await Track.findOrCreate({
                where: { id: track.id },
                defaults: {
                  id: track.id,
                  title: track.name,
                  duration: track.duration_ms,
                  preview_url: track.preview_url,
                  spotify_url: track.external_urls?.spotify,
                  spotify_uri: track.uri,
                  release_id: release.id,
                  status: 'published'
                },
                transaction: albumTransaction
              });

              if (trackCreated) {
                stats.totalTracksImported++;
              }

              // Process artists for this track (with error handling for each artist)
              for (const artist of track.artists) {
                try {
                  // Skip artists with non-UUID IDs
                  if (!isValidUuid(artist.id)) {
                    logger.warn(`Skipping artist ${artist.name} - ID is not a valid UUID: ${artist.id}`);
                    continue;
                  }
                  
                  // Get full artist details from Spotify
                  const artistInfo = await this.getArtist(artist.id);
                  if (!artistInfo) continue;

                  const [artistRecord, artistCreated] = await Artist.findOrCreate({
                    where: { id: artist.id },
                    defaults: {
                      id: artist.id,
                      name: artist.name,
                      spotify_url: artist.external_urls?.spotify,
                      spotify_uri: artist.uri,
                      image_url: artistInfo.images?.[0]?.url,
                      images: artistInfo.images
                    },
                    transaction: albumTransaction
                  });

                  if (artistCreated) {
                    stats.totalArtistsImported++;
                  } else if (!artistRecord.image_url && artistInfo.images?.[0]?.url) {
                    // Update existing artist with images if they don't have any
                    await artistRecord.update({
                      image_url: artistInfo.images[0].url,
                      images: artistInfo.images
                    }, { transaction: albumTransaction });
                  }

                  // Associate artist with track
                  await trackRecord.addArtist(artistRecord, { transaction: albumTransaction });
                } catch (artistError) {
                  logger.error(`Error processing artist ${artist.name}:`, artistError);
                  // Continue with next artist, don't fail the whole album
                }
              }
            } catch (trackError) {
              logger.error(`Error processing track ${track.name}:`, trackError);
              // Continue with next track, don't fail the whole album
            }
          }
          
          // Commit the album transaction - each album is a separate transaction
          await albumTransaction.commit();
          logger.info(`Successfully processed album: ${album.name}`);
          
        } catch (albumError) {
          // Rollback just this album's transaction
          await albumTransaction.rollback();
          logger.error(`Error processing album ${album.name}:`, albumError);
          // Continue with next album
        }
      }

      if (shouldCommit) {
        await outerTransaction.commit();
      }

      logger.info('Import completed with stats:', stats);
      return stats;
    } catch (error) {
      if (outerTransaction && !transaction) {
        try {
          await outerTransaction.rollback();
        } catch (rollbackError) {
          logger.error('Error rolling back transaction:', rollbackError);
        }
      }
      logger.error('Error in importReleases:', error);
      throw error;
    }
  }

  async searchArtists(query, limit = 1) {
    if (!query) {
      throw new Error('Search query is required');
    }

    try {
      await this._refreshTokenIfNeeded();
      const response = await this.spotifyApi.searchArtists(query, { limit });
      return response.body.artists.items;
    } catch (error) {
      logger.error('Error searching for artist:', error);
      return null;
    }
  }

  determineReleaseType(album) {
    // Check for compilation first
    if (album.album_type === 'compilation' || 
        album.name.toLowerCase().includes('compilation') ||
        album.name.toLowerCase().includes('various artists')) {
      return 'compilation';
    }

    const totalTracks = album.total_tracks;
    
    // Singles are typically 1-3 tracks
    if (totalTracks <= 3) {
      return 'single';
    }
    
    // EPs are typically 4-6 tracks
    if (totalTracks <= 6) {
      return 'ep';
    }
    
    // Albums are 7+ tracks
    return 'album';
  }
}

// Singleton instance
const getSpotifyService = async () => {
  if (!spotifyServiceInstance) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not found in environment variables');
    }

    spotifyServiceInstance = new SpotifyService(clientId, clientSecret);
    await spotifyServiceInstance.initialize();
  }

  // Ensure token is fresh
  await spotifyServiceInstance._refreshTokenIfNeeded();
  return spotifyServiceInstance;
};

// Export both the class and the singleton getter
module.exports = {
  SpotifyService,
  getSpotifyService,
};
