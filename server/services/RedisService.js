const redisPool = require('../config/redisPool');

class RedisService {
  constructor() {
    this.isInitialized = false;
    this.TRACKS_CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds
    this.ARTIST_CACHE_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds
    this.ALBUM_CACHE_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds
    this.SEARCH_CACHE_DURATION = 1 * 60 * 60; // 1 hour in seconds
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  async init() {
    try {
      await redisPool.executeCommand('ping');
      this.isInitialized = true;
      console.log('Redis service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Redis service:', error);
      throw error;
    }
  }

  async retryOperation(operation, retries = this.retryAttempts) {
    let lastError;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Redis operation failed (attempt ${i + 1}/${retries}):`, error.message);
        
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  }

  async clearCache() {
    return this.retryOperation(async () => {
      console.log('Clearing Redis cache...');
      await redisPool.executeCommand('flushdb');
      console.log('Redis cache cleared successfully');
    });
  }

  async setSearchResults(query, results) {
    const searchKey = `search:${query.toLowerCase().replace(/\s+/g, '_')}`;
    return this.retryOperation(async () => {
      await redisPool.executeCommand(
        'set',
        searchKey,
        JSON.stringify(results)
      );
    });
  }

  async getSearchResults(query) {
    const searchKey = `search:${query.toLowerCase().replace(/\s+/g, '_')}`;
    return this.retryOperation(async () => {
      const results = await redisPool.executeCommand('get', searchKey);
      return results ? JSON.parse(results) : null;
    });
  }

  async setTrackToCache(track) {
    if (!track || !track.id) {
      console.error('Invalid track data provided to cache');
      return false;
    }

    const trackKey = `track:${track.id}`;
    const labelKey = track.label ? `${this.normalizeLabel(track.label)}:tracks` : null;

    try {
      // Store track details
      const trackData = {
        ...track,
        cached_at: Date.now()
      };
      
      // Verify and set track data
      await this.verifyKeyType(trackKey, 'string');
      await this.executeCommand('set', trackKey, JSON.stringify(trackData));

      // Add track ID to the label set
      if (labelKey) {
        await this.verifyKeyType(labelKey, 'set');
        await this.executeCommand('sadd', labelKey, track.id);
      }

      console.log(`Successfully cached track: ${track.id} for label: ${track.label}`);
      return true;
    } catch (error) {
      console.error(`Error caching track (key: ${trackKey}, labelKey: ${labelKey}):`, error);
      return false;
    }
  }

  async getTrackFromCache(trackId) {
    if (!trackId) return null;
    
    try {
      const trackData = await this.executeCommand('get', `track:${trackId}`);
      return trackData ? JSON.parse(trackData) : null;
    } catch (error) {
      console.error('Error getting track from cache:', error);
      return null;
    }
  }

  async setArtistToCache(artist) {
    try {
      const key = `artist:${artist.id}`;
      const artistData = {
        ...artist,
        cached_at: Date.now()
      };
      
      await this.executeCommand('set', key, JSON.stringify(artistData));
      return true;
    } catch (error) {
      console.error('Error setting artist to cache:', error);
      return false;
    }
  }

  async getArtistFromCache(artistId) {
    try {
      const artistData = await this.executeCommand('get', `artist:${artistId}`);
      return artistData ? JSON.parse(artistData) : null;
    } catch (error) {
      console.error('Error getting artist from cache:', error);
      return null;
    }
  }

  async setArtistDetails(artistId, artistDetails, label) {
    try {
      const key = `artist:${artistId}`;
      const normalizedLabel = this.normalizeLabel(label);
      const artistData = {
        ...artistDetails,
        label,
        cached_at: Date.now()
      };
      
      // Store artist details
      await this.executeCommand('set', key, JSON.stringify(artistData));
      
      // Add artist ID to label set
      await this.executeCommand('sadd', `label:${normalizedLabel}:artists`, artistId);
      
      return true;
    } catch (error) {
      console.error('Error setting artist details to cache:', error);
      return false;
    }
  }

  async getArtistDetails(artistId) {
    return this.retryOperation(async () => {
      const artistKey = `artist:${artistId}`;
      const artistData = await redisPool.executeCommand('get', artistKey);
      return artistData ? JSON.parse(artistData) : null;
    });
  }

  async getArtistsForLabel(label) {
    try {
      const normalizedLabel = this.normalizeLabel(label);
      // Get all artist IDs for the label
      const artistIds = await this.executeCommand('smembers', `label:${normalizedLabel}:artists`);
      if (!artistIds || artistIds.length === 0) {
        return [];
      }

      // Get artist details for each ID
      const artists = [];
      for (const artistId of artistIds) {
        const artistData = await this.executeCommand('get', `artist:${artistId}`);
        if (artistData) {
          artists.push(JSON.parse(artistData));
        }
      }

      return artists;
    } catch (error) {
      console.error('Error getting artists from cache:', error);
      return [];
    }
  }

  async setAlbumToCache(album) {
    try {
      const key = `album:${album.id}`;
      const normalizedLabel = this.normalizeLabel(album.label);
      const albumData = {
        ...album,
        cached_at: Date.now()
      };
      
      // Store album details
      await this.executeCommand('set', key, JSON.stringify(albumData));
      
      // Add album ID to label set
      if (album.label) {
        await this.executeCommand('sadd', `label:${normalizedLabel}:albums`, album.id);
      }
      
      return true;
    } catch (error) {
      console.error('Error setting album to cache:', error);
      return false;
    }
  }

  async getAlbumsForLabel(label) {
    try {
      const normalizedLabel = this.normalizeLabel(label);
      // Get all album IDs for the label
      const albumIds = await this.executeCommand('smembers', `label:${normalizedLabel}:albums`);
      if (!albumIds || albumIds.length === 0) {
        return [];
      }

      // Get album details for each ID
      const albums = [];
      for (const albumId of albumIds) {
        const albumData = await this.executeCommand('get', `album:${albumId}`);
        if (albumData) {
          albums.push(JSON.parse(albumData));
        }
      }

      // Sort by release date, newest first
      albums.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
      
      return albums;
    } catch (error) {
      console.error('Error getting albums from cache:', error);
      return [];
    }
  }

  async setTracksForLabel(label, tracks) {
    if (!label || !tracks) return;
    
    const normalizedLabel = this.normalizeLabel(label);
    const labelTracksKey = `label:${normalizedLabel}:tracks`;
    
    // First, remove any existing tracks for this label
    await this.executeCommand('del', labelTracksKey);
    
    // Add track IDs to the set
    if (tracks.length > 0) {
      const trackIds = tracks.map(track => track.id);
      await this.executeCommand('sadd', labelTracksKey, ...trackIds);
    }
    
    // Store each track's full data individually
    for (const track of tracks) {
      await this.setTrackToCache(track);
    }
  }

  async getTracksForLabel(label, options = {}) {
    const normalizedLabel = this.normalizeLabel(label);
    const labelTracksKey = `${normalizedLabel}:tracks`;

    try {
      // Verify key type before accessing
      await this.verifyKeyType(labelTracksKey, 'set');

      // Get all track IDs for this label
      const trackIds = await this.executeCommand('smembers', labelTracksKey);
      if (!trackIds || trackIds.length === 0) {
        console.log(`No tracks found for label: ${label}`);
        return [];
      }

      // Retrieve track details
      const tracks = [];
      for (const trackId of trackIds) {
        const trackKey = `track:${trackId}`;
        await this.verifyKeyType(trackKey, 'string');
        const trackData = await this.executeCommand('get', trackKey);
        if (trackData) {
          tracks.push(JSON.parse(trackData));
        }
      }

      return tracks;
    } catch (error) {
      console.error(`Error retrieving tracks for label (key: ${labelTracksKey}):`, error);
      return [];
    }
  }

  async getAllTracks() {
    return this.retryOperation(async () => {
      const keys = await redisPool.executeCommand('keys', 'track:*');
      if (!keys.length) return [];

      const tracks = await Promise.all(
        keys.map(key => redisPool.executeCommand('get', key))
      );

      return tracks
        .map(track => JSON.parse(track))
        .filter(track => track && track.popularity); // Only return tracks with popularity data
    });
  }

  async getTracksForLabel(label, options = {}) {
    console.log(`[Redis Service] Getting tracks for label: ${label}`);
    return this.retryOperation(async () => {
      const labelKey = `label:${label}:tracks`;
      const data = await redisPool.executeCommand('get', labelKey);
      
      if (!data) {
        console.log('[Redis Service] No tracks found in cache');
        return { tracks: [], total: 0 };
      }

      try {
        const { tracks, total, cached_at } = JSON.parse(data);
        
        // Apply pagination
        const page = options.page || 1;
        const limit = options.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        const paginatedTracks = tracks.slice(startIndex, endIndex);

        return {
          tracks: paginatedTracks,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          cached_at
        };
      } catch (error) {
        console.error('[Redis Service] Error parsing tracks:', error);
        return { tracks: [], total: 0 };
      }
    });
  }

  async trackPopularityTS(trackId, popularity) {
    return this.retryOperation(async () => {
      const timestamp = Date.now();
      await redisPool.executeCommand('zadd', `popularity:${trackId}`, timestamp, popularity);
      // Keep only last 30 days of data
      const thirtyDaysAgo = timestamp - (30 * 24 * 60 * 60 * 1000);
      await redisPool.executeCommand('zremrangebyscore', `popularity:${trackId}`, '-inf', thirtyDaysAgo);
      return true;
    });
  }

  async getPopularityHistory(trackId, from = '-', to = '+') {
    return this.retryOperation(async () => {
      const data = await redisPool.executeCommand('zrangebyscore', `popularity:${trackId}`, from, to, 'WITHSCORES');
      return data.reduce((acc, val, i) => {
        if (i % 2 === 0) {
          acc.push({
            popularity: parseInt(val),
            timestamp: parseInt(data[i + 1])
          });
        }
        return acc;
      }, []);
    });
  }

  async searchTracks(query, options = {}) {
    return this.retryOperation(async () => {
      const { label, minPopularity = 0 } = options;
      const tracks = await this.getTracksForLabel(label);
      if (!tracks) return [];

      return tracks.filter(track => {
        const matchesQuery = track.name.toLowerCase().includes(query.toLowerCase()) ||
                           track.artists.some(artist => artist.name.toLowerCase().includes(query.toLowerCase()));
        const meetsPopularity = track.popularity >= minPopularity;
        return matchesQuery && meetsPopularity;
      });
    });
  }

  async executeCommand(command, ...args) {
    return this.retryOperation(async () => {
      try {
        return await redisPool.executeCommand(command, ...args);
      } catch (error) {
        console.error(`Redis command error (${command}):`, error);
        throw error;
      }
    });
  }

  async clearAllData() {
    try {
      // Get all keys
      const keys = await this.executeCommand('keys', '*');
      
      // Delete all keys if any exist
      if (keys && keys.length > 0) {
        for (const key of keys) {
          await this.executeCommand('del', key);
        }
      }
      
      console.log(`[Redis Service] Cleared ${keys ? keys.length : 0} keys from Redis`);
      return true;
    } catch (error) {
      console.error('Error clearing Redis data:', error);
      return false;
    }
  }

  async verifyKeyType(key, expectedType) {
    try {
      const type = await this.executeCommand('type', key);
      if (type !== 'none' && type !== expectedType) {
        console.error(`Key type mismatch: ${key} is of type '${type}', expected '${expectedType}'`);
        throw new Error(`Key ${key} is of type '${type}', expected '${expectedType}'`);
      }
      return true;
    } catch (error) {
      console.error(`Error verifying key type for ${key}:`, error);
      throw error;
    }
  }

  normalizeLabel(label) {
    return label.toLowerCase().replace(/\s+/g, '');
  }
}

module.exports = RedisService;
