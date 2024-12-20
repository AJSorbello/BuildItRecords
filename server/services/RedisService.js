const Redis = require('redis');

class RedisService {
  constructor() {
    this.TRACKS_CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds
    this.ARTIST_CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds
    this.SEARCH_CACHE_DURATION = 1 * 60 * 60; // 1 hour in seconds
    this.client = null;
    this.initialized = false;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  async init() {
    if (this.initialized) {
      return;
    }

    try {
      this.client = Redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379
        }
      });

      // Handle errors
      this.client.on('error', (err) => {
        console.error('Redis error:', err);
        this.initialized = false;
      });

      await this.client.connect();
      this.initialized = true;
      console.log('Redis service initialized successfully');
      
      // Start health check
      this.startHealthCheck();
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

  async setTrackJson(trackId, trackData) {
    return this.retryOperation(async () => {
      const key = `track:${trackId}`;
      await this.client.set(key, JSON.stringify(trackData));
      await this.client.expire(key, this.TRACKS_CACHE_DURATION);
      return true;
    });
  }

  async getTrackJson(trackId) {
    return this.retryOperation(async () => {
      const key = `track:${trackId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    });
  }

  async batchSetTracks(tracks) {
    if (!Array.isArray(tracks)) {
      throw new Error('Tracks must be an array');
    }

    return this.retryOperation(async () => {
      const multi = this.client.multi();
      
      for (const track of tracks) {
        const key = `track:${track.id}`;
        multi.set(key, JSON.stringify(track));
        multi.expire(key, this.TRACKS_CACHE_DURATION);
      }

      await multi.exec();
      console.log(`Successfully cached ${tracks.length} tracks`);
      return true;
    });
  }

  async setCacheWithLabel(key, value, label) {
    return this.retryOperation(async () => {
      const ttl = this._getLabelTTL(label);
      await this.client.set(key, JSON.stringify(value));
      await this.client.expire(key, ttl);
      return true;
    });
  }

  async getCacheByLabel(key) {
    return this.retryOperation(async () => {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    });
  }

  _getLabelTTL(label) {
    switch (label?.toLowerCase()) {
      case 'search':
        return this.SEARCH_CACHE_DURATION;
      case 'track':
        return this.TRACKS_CACHE_DURATION;
      case 'artist':
        return this.ARTIST_CACHE_DURATION;
      default:
        return this.SEARCH_CACHE_DURATION; // Default to shortest duration
    }
  }

  async clearCache() {
    return this.retryOperation(async () => {
      await this.client.flushDb();
      console.log('Cache cleared successfully');
      return true;
    });
  }

  async startHealthCheck() {
    const checkHealth = async () => {
      try {
        await this.client.ping();
      } catch (error) {
        console.error('Redis health check failed:', error);
        this.initialized = false;
        
        // Try to reinitialize
        try {
          await this.init();
        } catch (reinitError) {
          console.error('Failed to reinitialize Redis:', reinitError);
        }
      }
    };

    // Run health check every minute
    setInterval(checkHealth, 60000);
  }

  async createSearchIndex() {
    // Temporarily disabled
    return;
  }

  async waitForConnection(timeout = 30000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      
      const checkConnection = async () => {
        try {
          await this.client.ping();
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

  async setArtistJson(artistId, artistData) {
    const key = `artist:${artistId}`;
    await this.client.set(key, JSON.stringify(artistData));
    await this.client.expire(key, this.ARTIST_CACHE_DURATION);
  }

  async getArtistJson(artistId) {
    const key = `artist:${artistId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async searchTracks(query, { label = null, minPopularity = 0 } = {}) {
    let searchQuery = `@name:(${query}) | @artist:(${query}) | @album:(${query})`;
    if (label) {
      searchQuery += ` @label:{${label}}`;
    }
    if (minPopularity > 0) {
      searchQuery += ` @popularity:[${minPopularity} +inf]`;
    }

    const results = await this.client.sendCommand(['FT.SEARCH', 'idx:tracks', searchQuery, 'LIMIT', '0', '20']);
    return this._parseSearchResults(results);
  }

  async trackPopularityTS(trackId, popularity) {
    const key = `ts:popularity:track:${trackId}`;
    const timestamp = Date.now();
    await this.client.sendCommand(['TS.ADD', key, timestamp, popularity]);
  }

  async getPopularityHistory(trackId, fromTimestamp, toTimestamp = '+') {
    const key = `ts:popularity:track:${trackId}`;
    return await this.client.sendCommand(['TS.RANGE', key, fromTimestamp, toTimestamp]);
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

  async getTracksForLabel(label) {
    try {
      const tracks = await this.client.get(`tracks:${label}`);
      return tracks ? JSON.parse(tracks) : null;
    } catch (error) {
      console.error('Error getting tracks for label:', error);
      return null;
    }
  }

  async setTracksForLabel(label, tracks) {
    try {
      await this.client.setex(`tracks:${label}`, this.TRACKS_CACHE_DURATION, JSON.stringify(tracks));
    } catch (error) {
      console.error('Error setting tracks for label:', error);
    }
  }

  async getArtistDetails(artistId) {
    try {
      const artist = await this.client.get(`artist:${artistId}`);
      return artist ? JSON.parse(artist) : null;
    } catch (error) {
      console.error('Error getting artist details:', error);
      return null;
    }
  }

  async setArtistDetails(artistId, details) {
    try {
      await this.client.setex(`artist:${artistId}`, this.ARTIST_CACHE_DURATION, JSON.stringify(details));
    } catch (error) {
      console.error('Error setting artist details:', error);
    }
  }

  async getAllTrackKeys() {
    return this.retryOperation(async () => {
      return await this.client.keys('track:*');
    });
  }

  async getAllTracks() {
    return this.retryOperation(async () => {
      const keys = await this.getAllTrackKeys();
      if (keys.length === 0) return [];

      const tracks = await Promise.all(
        keys.map(async (key) => {
          const data = await this.client.get(key);
          return data ? JSON.parse(data) : null;
        })
      );

      return tracks.filter(track => track !== null);
    });
  }
}

module.exports = RedisService;
