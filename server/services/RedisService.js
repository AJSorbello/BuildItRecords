const RedisPool = require('../config/redisPool');

class RedisService {
  constructor() {
    this.TRACKS_CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds
    this.ARTIST_CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds
    this.redisPool = new RedisPool(); // Initialize RedisPool in constructor
    this.initialized = false;
  }

  async init() {
    if (this.initialized) {
      return;
    }

    try {
      await this.redisPool.initializePool(); // Initialize the pool
      await this.createSearchIndex();
      this.initialized = true;
      
      // Start health check
      this.startHealthCheck();
      console.log('Redis service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Redis service:', error);
      throw error;
    }
  }

  async waitForConnection(timeout = 30000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      
      const checkConnection = async () => {
        try {
          await this.redisPool.executeCommand('ping');
          console.log('Redis connection established');
          return resolve();
        } catch (error) {
          console.log(`Connection attempt failed, retrying...`);
          
          if (Date.now() - start > timeout) {
            return reject(new Error('Connection timeout'));
          }
          
          setTimeout(checkConnection, 1000);
        }
      };
      
      checkConnection();
    });
  }

  async createSearchIndex() {
    try {
      // Check if index exists
      const indices = await this.redisPool.executeCommand('FT._LIST');
      const indexExists = indices.includes('idx:tracks');

      if (!indexExists) {
        // Create the index if it doesn't exist
        await this.redisPool.executeCommand(
          'FT.CREATE',
          'idx:tracks',
          'ON', 'JSON',
          'PREFIX', '1', 'track:',
          'SCHEMA',
          '$.name', 'AS', 'name', 'TEXT',
          '$.artists[*].name', 'AS', 'artist', 'TEXT',
          '$.album.name', 'AS', 'album', 'TEXT',
          '$.popularity', 'AS', 'popularity', 'NUMERIC',
          '$.label', 'AS', 'label', 'TAG'
        );
        console.log('Search index created successfully');
      } else {
        console.log('Search index already exists');
      }
    } catch (error) {
      console.error('Error creating search index:', error);
      throw error;
    }
  }

  async setTrackJson(trackId, trackData) {
    const key = `track:${trackId}`;
    await this.redisPool.executeCommand('JSON.SET', key, '$', JSON.stringify(trackData));
    await this.redisPool.executeCommand('EXPIRE', key, this.TRACKS_CACHE_DURATION);
  }

  async getTrackJson(trackId) {
    const key = `track:${trackId}`;
    return JSON.parse(await this.redisPool.executeCommand('JSON.GET', key));
  }

  async setArtistJson(artistId, artistData) {
    const key = `artist:${artistId}`;
    await this.redisPool.executeCommand('JSON.SET', key, '$', JSON.stringify(artistData));
    await this.redisPool.executeCommand('EXPIRE', key, this.ARTIST_CACHE_DURATION);
  }

  async getArtistJson(artistId) {
    const key = `artist:${artistId}`;
    return JSON.parse(await this.redisPool.executeCommand('JSON.GET', key));
  }

  async batchSetTracks(tracks) {
    if (!Array.isArray(tracks)) {
      throw new Error('Tracks must be an array');
    }

    const pipeline = this.redisPool.pipeline();
    
    for (const track of tracks) {
      const key = `track:${track.id}`;
      pipeline.json.set(key, '$', track);
    }

    try {
      await pipeline.exec();
      console.log(`Successfully cached ${tracks.length} tracks`);
    } catch (error) {
      console.error('Error caching tracks:', error);
      throw error;
    }
  }

  async searchTracks(query, { label = null, minPopularity = 0 } = {}) {
    let searchQuery = `@name:(${query}) | @artist:(${query}) | @album:(${query})`;
    if (label) {
      searchQuery += ` @label:{${label}}`;
    }
    if (minPopularity > 0) {
      searchQuery += ` @popularity:[${minPopularity} +inf]`;
    }

    const results = await this.redisPool.executeCommand(
      'FT.SEARCH', 'idx:tracks', searchQuery,
      'LIMIT', '0', '20'
    );
    return this._parseSearchResults(results);
  }

  async trackPopularityTS(trackId, popularity) {
    const key = `ts:popularity:track:${trackId}`;
    const timestamp = Date.now();
    await this.redisPool.executeCommand('TS.ADD', key, timestamp, popularity);
  }

  async getPopularityHistory(trackId, fromTimestamp, toTimestamp = '+') {
    const key = `ts:popularity:track:${trackId}`;
    return await this.redisPool.executeCommand('TS.RANGE', key, fromTimestamp, toTimestamp);
  }

  startHealthCheck() {
    setInterval(async () => {
      try {
        await this.redisPool.executeCommand('ping');
      } catch (error) {
        console.error('Redis health check failed:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  _parseSearchResults(results) {
    if (!Array.isArray(results) || results.length < 1) return [];
    const [total, ...documents] = results;
    return documents.reduce((acc, curr, i) => {
      if (i % 2 === 0) {
        const key = curr;
        const value = JSON.parse(documents[i + 1]);
        acc.push({ key, ...value });
      }
      return acc;
    }, []);
  }

  async setCacheWithLabel(key, value, label) {
    const ttl = this._getLabelTTL(label);
    await this.redisPool.executeCommand('SET', key, JSON.stringify(value), 'EX', ttl);
  }

  async getCacheByLabel(key) {
    const value = await this.redisPool.executeCommand('GET', key);
    return value ? JSON.parse(value) : null;
  }

  _getLabelTTL(label) {
    // You can customize TTL based on label if needed
    return this.TRACKS_CACHE_DURATION;
  }

  async getTracksForLabel(label) {
    try {
      const tracks = await this.redisPool.executeCommand('get', `tracks:${label}`);
      return tracks ? JSON.parse(tracks) : null;
    } catch (error) {
      console.error('Error getting tracks for label:', error);
      return null;
    }
  }

  async setTracksForLabel(label, tracks) {
    try {
      await this.redisPool.executeCommand(
        'setex',
        `tracks:${label}`,
        this.TRACKS_CACHE_DURATION,
        JSON.stringify(tracks)
      );
    } catch (error) {
      console.error('Error setting tracks for label:', error);
    }
  }

  async getArtistDetails(artistId) {
    try {
      const artist = await this.redisPool.executeCommand('get', `artist:${artistId}`);
      return artist ? JSON.parse(artist) : null;
    } catch (error) {
      console.error('Error getting artist details:', error);
      return null;
    }
  }

  async setArtistDetails(artistId, details) {
    try {
      await this.redisPool.executeCommand(
        'setex',
        `artist:${artistId}`,
        this.ARTIST_CACHE_DURATION,
        JSON.stringify(details)
      );
    } catch (error) {
      console.error('Error setting artist details:', error);
    }
  }

  async clearCache() {
    try {
      await this.redisPool.executeCommand('flushdb');
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

module.exports = RedisService;
