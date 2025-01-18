const SpotifyWebApi = require('spotify-web-api-node');
const { Label, Release, Artist, Track } = require('../models');
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

      // Search with the exact label name
      const limit = 50;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const requestFn = async () => {
          const response = await this.spotifyApi.searchAlbums(`label:"${labelName}"`, {
            limit,
            offset,
            market: 'GB'
          });
          
          if (!response.body.albums || !response.body.albums.items) {
            logger.error('Invalid response from Spotify:', response.body);
            return;
          }

          logger.info('Search result:', {
            query: `label:"${labelName}"`,
            offset,
            limit,
            total: response.body.albums.total,
            found: response.body.albums.items.length
          });

          for (const album of response.body.albums.items) {
            try {
              const fullAlbum = await this.getAlbumById(album.id);
              if (!fullAlbum) continue;

              const albumLabel = fullAlbum.label;
              logger.info('Checking album:', {
                id: fullAlbum.id,
                name: fullAlbum.name,
                label: albumLabel
              });

              // Check if the album label matches our label name
              const isMatchingLabel = albumLabel && 
                albumLabel.toLowerCase().includes(labelName.toLowerCase());

              if (isMatchingLabel) {
                logger.info('Found matching release:', {
                  id: fullAlbum.id,
                  name: fullAlbum.name,
                  label: albumLabel,
                });
                releases.add(fullAlbum);
              }
            } catch (error) {
              logger.error(`Failed to fetch full album details for ${album.name}:`, error.message);
            }

            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          offset += limit;
          hasMore = response.body.albums.items.length === limit;
        };

        await this.makeRequest(requestFn);
      }

      const releasesArray = Array.from(releases);
      logger.info(`Found ${releasesArray.length} total unique releases`);
      return releasesArray;

    } catch (error) {
      logger.error('Error searching releases:', error);
      throw error;
    }
  }

  async importReleases(label, albums, transaction) {
    try {
      logger.info(`Importing ${albums.length} releases for label ${label.name}`);

      for (const album of albums) {
        try {
          // Create or update release
          const [release, created] = await Release.findOrCreate({
            where: { spotify_id: album.id },
            defaults: {
              title: album.name,
              release_date: album.release_date,
              spotify_url: album.external_urls.spotify,
              artwork_url: album.images[0]?.url,
              total_tracks: album.total_tracks,
              label_id: label.id,
              type: album.album_type,
              popularity: album.popularity
            },
            transaction
          });

          if (!created) {
            // Update existing release
            await release.update({
              title: album.name,
              release_date: album.release_date,
              spotify_url: album.external_urls.spotify,
              artwork_url: album.images[0]?.url,
              total_tracks: album.total_tracks,
              type: album.album_type,
              popularity: album.popularity
            }, { transaction });
          }

          // Create or update artists and associate with release
          for (const artistData of album.artists) {
            // Fetch full artist data to get images
            const artistInfo = await this.makeRequest(async () => {
              const result = await this.spotifyApi.getArtist(artistData.id);
              return result.body;
            });

            const [artist] = await Artist.findOrCreate({
              where: { id: artistData.id },
              defaults: {
                name: artistData.name,
                spotify_url: artistData.external_urls.spotify,
                image_url: artistInfo.images[0]?.url, // Save largest image URL
                images: artistInfo.images || [] // Save all image sizes
              },
              transaction
            });

            // Always update the image information if Spotify has it
            if (artistInfo.images?.length > 0) {
              await artist.update({
                name: artistData.name, // Keep name in sync
                spotify_url: artistData.external_urls.spotify, // Keep Spotify URL in sync
                image_url: artistInfo.images[0].url,
                images: artistInfo.images
              }, { transaction });
            }

            await release.addArtist(artist, { transaction });
          }

          // Import tracks
          for (const track of album.tracks.items) {
            const [trackRecord] = await Track.findOrCreate({
              where: { spotify_id: track.id },
              defaults: {
                title: track.name,
                duration_ms: track.duration_ms,
                track_number: track.track_number,
                disc_number: track.disc_number,
                preview_url: track.preview_url,
                spotify_url: track.external_urls.spotify,
                popularity: track.popularity,
                release_id: release.id,
                is_playable: track.is_playable !== false
              },
              transaction
            });

            // Associate track artists
            for (const artistData of track.artists) {
              const [artist] = await Artist.findOrCreate({
                where: { id: artistData.id },
                defaults: {
                  name: artistData.name,
                  spotify_url: artistData.external_urls.spotify
                },
                transaction
              });

              await trackRecord.addArtist(artist, { transaction });
            }
          }

          logger.info(`Successfully imported release: ${album.name}`);
        } catch (error) {
          logger.error(`Error importing release ${album.name}:`, error);
          // Continue with next album even if one fails
          continue;
        }
      }

      logger.info(`Finished importing ${albums.length} releases`);
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
