const SpotifyWebApi = require('spotify-web-api-node');
const { Label, Release, Artist, Track, sequelize } = require('../models');
const logger = require('../utils/logger');

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
        // Check if we need to wait for rate limit
        if (this._rateLimitResetTime) {
          const waitTime = this._rateLimitResetTime - Date.now();
          if (waitTime > 0) {
            logger.info(`Waiting for rate limit reset: ${Math.ceil(waitTime / 1000)}s remaining`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
          this._rateLimitResetTime = null;
        }

        // Ensure token is fresh
        await this._refreshTokenIfNeeded();

        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

        const result = await requestFn();
        
        // Reset retry count on successful request
        retryCount = 0;
        
        return result;

      } catch (error) {
        lastError = error;
        logger.error('Spotify API request failed:', {
          error: error.message,
          statusCode: error.statusCode,
          headers: error.headers,
          retryCount,
          maxRetries
        });

        if (error.statusCode === 429) {
          const retryAfter = parseInt(error.headers['retry-after'] || '30');
          await this._handleRateLimit(retryAfter);
          retryCount++;
          continue;
        }

        if (error.statusCode === 401) {
          // Token expired or invalid, try refreshing
          logger.info('Token expired, refreshing...');
          await this._refreshTokenIfNeeded();
          retryCount++;
          continue;
        }

        // For other errors, increment retry count and try again
        if (retryCount < maxRetries - 1) {
          retryCount++;
          // Exponential backoff
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
          logger.info(`Retrying in ${backoffTime/1000} seconds... (attempt ${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }

        throw error;
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

  async searchAlbums(query, options = { limit: 50 }) {
    try {
      const requestFn = async () => {
        logger.info('Searching albums with query:', query);
        const result = await this.spotifyApi.searchAlbums(query, options);
        
        if (!result.body || !result.body.albums) {
          logger.error('No album data in search response:', result);
          return { items: [] };
        }

        logger.info('Found albums:', {
          total: result.body.albums.total,
          returned: result.body.albums.items.length,
          query
        });

        return result.body.albums;
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
      const requestFn = async () => {
        logger.info('Fetching artist by ID:', artistId);
        const result = await this.spotifyApi.getArtist(artistId);
        
        if (!result.body) {
          logger.error('No artist data in response:', result);
          return null;
        }

        logger.info('Found artist:', {
          id: result.body.id,
          name: result.body.name,
          hasImages: result.body.images && result.body.images.length > 0
        });

        return result.body;
      };

      return await this.makeRequest(requestFn);
    } catch (error) {
      logger.error('Error fetching artist by ID:', error);
      throw error;
    }
  }

  async updateArtistImages(artistId) {
    try {
      // Fetch full artist data from Spotify
      const artistInfo = await this.getArtist(artistId);
      
      if (!artistInfo) {
        logger.error('Could not fetch artist info from Spotify:', artistId);
        return null;
      }

      // Find the artist in our database
      const artist = await Artist.findByPk(artistId);
      if (!artist) {
        logger.error('Artist not found in database:', artistId);
        return null;
      }

      // Update the artist with new image data
      if (artistInfo.images && artistInfo.images.length > 0) {
        await artist.update({
          image_url: artistInfo.images[0].url,
          images: artistInfo.images
        });
        logger.info('Updated artist images:', {
          artistId,
          artistName: artist.name,
          imageUrl: artistInfo.images[0].url,
          imageCount: artistInfo.images.length
        });
        return artist;
      } else {
        logger.warn('No images available for artist:', {
          artistId,
          artistName: artist.name
        });
        return artist;
      }
    } catch (error) {
      logger.error('Error updating artist images:', error);
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

      // First get all artists for this label
      const artists = await Artist.findAll({
        where: { label_id: labelId },
        attributes: ['name'],
        raw: true
      });

      // Base search queries - always include label to filter at search time
      const searchQueries = [
        `label:"${labelName}"`,                     // Exact label match with quotes
        `recordlabel:"${labelName}"`,               // Alternative field
        ...artists.map(artist => 
          `label:"${labelName}" artist:"${artist.name}"`  // Combine exact label with exact artist
        )
      ];

      logger.info('Will try search queries:', {
        labelId,
        labelName,
        totalQueries: searchQueries.length,
        artistCount: artists.length
      });

      const transaction = await sequelize.transaction();

      try {
        for (const searchQuery of searchQueries) {
          logger.info(`Trying search query: ${searchQuery}`);
          
          // Search with the exact label name
          let offset = 0;
          let hasMore = true;
          let retryCount = 0;
          const maxRetries = 3;

          while (hasMore) {
            try {
              const requestFn = async () => {
                const response = await this.spotifyApi.searchAlbums(searchQuery, {
                  limit: 50,
                  offset,
                  market: 'GB'
                });
                
                if (!response.body.albums || !response.body.albums.items) {
                  logger.error('Invalid response from Spotify:', response.body);
                  return;
                }

                logger.info('Search result:', {
                  query: searchQuery,
                  offset,
                  limit: 50,
                  total: response.body.albums.total,
                  found: response.body.albums.items.length,
                  hasMore: response.body.albums.items.length === 50
                });

                for (const album of response.body.albums.items) {
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

                    // Strict equality check for the label
                    const isMatchingLabel = albumLabel && albumLabel.toLowerCase() === labelName.toLowerCase();

                    if (!isMatchingLabel) {
                      logger.info('Skipping non-matching label:', {
                        albumLabel,
                        targetLabel: labelName
                      });
                      continue;
                    }

                    logger.info('Found matching release:', {
                      id: fullAlbum.id,
                      name: fullAlbum.name,
                      label: albumLabel,
                    });
                    releases.add(fullAlbum);

                  } catch (error) {
                    logger.error(`Failed to fetch full album details for ${album.name}:`, error.message);
                    if (retryCount < maxRetries) {
                      retryCount++;
                      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                      continue;
                    }
                  }

                  // Add a small delay to avoid rate limiting
                  await new Promise(resolve => setTimeout(resolve, 100));
                }

                offset += 50;
                hasMore = response.body.albums.items.length === 50 && offset < response.body.albums.total;
              };

              await this.makeRequest(requestFn);
              retryCount = 0; // Reset retry count on success
            } catch (error) {
              logger.error('Error in search request:', error);
              if (retryCount < maxRetries) {
                retryCount++;
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                continue;
              }
              throw error;
            }
          }
        }

        logger.info('Found releases:', {
          total: releases.size,
          labelId
        });

        // Import releases and tracks
        await this.importReleases(label, Array.from(releases), transaction);
        await transaction.commit();
        
        return Array.from(releases);
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
                      label_id: label.id,
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
                    const [artistRecord, artistCreated] = await Artist.findOrCreate({
                      where: { id: artist.id },
                      defaults: {
                        id: artist.id,
                        name: artist.name,
                        spotify_url: artist.external_urls.spotify,
                        spotify_uri: artist.uri,
                        label_id: label.id
                      },
                      transaction
                    });

                    if (artistCreated) {
                      totalArtistsImported++;
                      logger.info(`Created new artist: ${artist.name}`);
                    }

                    // Link artist to track
                    await trackRecord.addArtist(artistRecord, { transaction });
                  }
                } catch (error) {
                  logger.error(`Error processing track ${track.name}: ${error.message}`);
                }
              }

              trackOffset += tracks.length;
            }
          } catch (error) {
            logger.error(`Error processing album ${album.name}: ${error.message}`);
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

  async importReleases(label, albums, transaction) {
    try {
      logger.info(`Starting import of ${albums.length} releases for label ${label.name}`);
      let totalTracksImported = 0;
      let totalTracksSkipped = 0;
      let totalTracksAttempted = 0;
      let totalArtistsImported = 0;
      let totalReleasesImported = 0;

      for (const album of albums) {
        try {
          logger.info(`Processing release: ${album.name} (${album.id})`);
          totalTracksAttempted += album.tracks?.items?.length || 0;

          // Get full album details
          const fullAlbum = await this.getAlbumById(album.id);
          if (!fullAlbum) {
            logger.warn(`Could not get full album details for ${album.name} (${album.id})`);
            continue;
          }

          // Create or update release
          const [release, created] = await Release.findOrCreate({
            where: { id: fullAlbum.id },
            defaults: {
              id: fullAlbum.id,
              title: fullAlbum.name,
              release_date: fullAlbum.release_date,
              spotify_url: fullAlbum.external_urls.spotify,
              artwork_url: fullAlbum.images[0]?.url,
              total_tracks: fullAlbum.total_tracks,
              label_id: label.id,
              type: fullAlbum.album_type,
              popularity: fullAlbum.popularity
            },
            transaction
          });

          if (created) {
            totalReleasesImported++;
            logger.info(`Created new release: ${fullAlbum.name}`);
          }

          // Process all artists for the release
          for (const artist of fullAlbum.artists || []) {
            const [artistRecord, artistCreated] = await Artist.findOrCreate({
              where: { id: artist.id },
              defaults: {
                id: artist.id,
                name: artist.name,
                spotify_url: artist.external_urls?.spotify,
                spotify_uri: artist.uri,
                label_id: label.id
              },
              transaction
            });

            if (artistCreated) {
              totalArtistsImported++;
              logger.info(`Created new artist: ${artist.name}`);
            }

            // Link artist to release
            await release.addArtist(artistRecord, { transaction });
          }

          // Process all tracks
          for (const track of fullAlbum.tracks.items || []) {
            try {
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
                  label_id: label.id,
                  status: 'published',
                  track_number: track.track_number,
                  disc_number: track.disc_number
                },
                transaction
              });

              if (trackCreated) {
                totalTracksImported++;
                logger.info(`Created new track: ${track.name}`);
              } else {
                totalTracksSkipped++;
              }

              // Process all artists for this track
              for (const artist of track.artists || []) {
                const [artistRecord, artistCreated] = await Artist.findOrCreate({
                  where: { id: artist.id },
                  defaults: {
                    id: artist.id,
                    name: artist.name,
                    spotify_url: artist.external_urls?.spotify,
                    spotify_uri: artist.uri,
                    label_id: label.id
                  },
                  transaction
                });

                if (artistCreated) {
                  totalArtistsImported++;
                  logger.info(`Created new artist: ${artist.name}`);
                }

                // Link artist to track
                await trackRecord.addArtist(artistRecord, { transaction });
              }
            } catch (error) {
              logger.error(`Error processing track ${track.name}: ${error.message}`);
            }
          }
        } catch (error) {
          logger.error(`Error processing album ${album.name}: ${error.message}`);
        }
      }

      logger.info('Import completed:', {
        totalReleasesImported,
        totalTracksImported,
        totalTracksSkipped,
        totalTracksAttempted,
        totalArtistsImported
      });

      return {
        totalReleasesImported,
        totalTracksImported,
        totalTracksSkipped,
        totalTracksAttempted,
        totalArtistsImported
      };

    } catch (error) {
      logger.error('Error in importReleases:', error);
      throw error;
    }
  }
}

const getSpotifyService = () => {
  if (!spotifyServiceInstance) {
    logger.info('Creating new SpotifyService instance');
    spotifyServiceInstance = new SpotifyService(
      process.env.SPOTIFY_CLIENT_ID,
      process.env.SPOTIFY_CLIENT_SECRET
    );
  }
  return spotifyServiceInstance;
};

module.exports = getSpotifyService;
