const redisPool = require('../config/redisPool');

class RedisService {
  constructor() {
    this.TRACKS_CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds
    this.ARTIST_CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.initializeService();
  }

  async initializeService() {
    try {
      // Wait for pool to be ready
      await this.waitForConnection();
      await this.createSearchIndex();
      console.log('Redis service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Redis service:', error);
    }
  }

  async waitForConnection(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      
      const checkConnection = async () => {
        if (this.retryAttempts >= this.maxRetries) {
          return reject(new Error('Max retry attempts reached'));
        }

        try {
          await redisPool.executeCommand('ping');
          this.isConnected = true;
          return resolve();
        } catch (error) {
          this.retryAttempts++;
          console.log(`Connection attempt ${this.retryAttempts} failed, retrying...`);
          
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
      const indices = await redisPool.executeCommand('call', 'FT._LIST');
      if (!indices.includes('idx:tracks')) {
        await redisPool.executeCommand(
          'call',
          'FT.CREATE',
          'idx:tracks',
          'ON', 'HASH',
          'PREFIX', '1', 'track:',
          'SCHEMA',
          'title', 'TEXT', 'SORTABLE',
          'artist', 'TEXT', 'SORTABLE',
          'label', 'TAG', 'SORTABLE'
        );
        console.log('Search index created successfully');
      }
    } catch (error) {
      if (error.message.includes('Index already exists')) {
        console.log('Search index already exists');
      } else {
        console.error('Error creating search index:', error);
        throw error;
      }
    }
  }

  async getTracksForLabel(label) {
    try {
      const tracks = await redisPool.executeCommand('get', `tracks:${label}`);
      return tracks ? JSON.parse(tracks) : null;
    } catch (error) {
      console.error('Error getting tracks for label:', error);
      return null;
    }
  }

  async setTracksForLabel(label, tracks) {
    try {
      await redisPool.executeCommand(
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
      const artist = await redisPool.executeCommand('get', `artist:${artistId}`);
      return artist ? JSON.parse(artist) : null;
    } catch (error) {
      console.error('Error getting artist details:', error);
      return null;
    }
  }

  async setArtistDetails(artistId, details) {
    try {
      await redisPool.executeCommand(
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
      await redisPool.executeCommand('flushdb');
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

module.exports = RedisService;
