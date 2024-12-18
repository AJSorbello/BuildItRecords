const Redis = require('ioredis');

class RedisService {
  constructor(redisClient) {
    this.redis = redisClient;
    this.DEFAULT_EXPIRY = 3600; // 1 hour in seconds
  }

  // JSON Operations for Tracks and Artists
  async setTrackJson(trackId, trackData) {
    const key = `track:${trackId}`;
    await this.redis.json.set(key, '$', trackData);
    await this.redis.expire(key, this.DEFAULT_EXPIRY);
  }

  async getTrackJson(trackId) {
    const key = `track:${trackId}`;
    return await this.redis.json.get(key);
  }

  async setArtistJson(artistId, artistData) {
    const key = `artist:${artistId}`;
    await this.redis.json.set(key, '$', artistData);
    await this.redis.expire(key, this.DEFAULT_EXPIRY);
  }

  async getArtistJson(artistId) {
    const key = `artist:${artistId}`;
    return await this.redis.json.get(key);
  }

  // Search Operations
  async createSearchIndex() {
    try {
      await this.redis.call(
        'FT.CREATE', 'idx:tracks',
        'ON', 'JSON',
        'PREFIX', '1', 'track:',
        'SCHEMA',
        '$.name', 'AS', 'name', 'TEXT',
        '$.artists[*].name', 'AS', 'artist', 'TEXT',
        '$.album.name', 'AS', 'album', 'TEXT',
        '$.popularity', 'AS', 'popularity', 'NUMERIC',
        '$.label', 'AS', 'label', 'TAG'
      );
    } catch (error) {
      if (!error.message.includes('Index already exists')) {
        throw error;
      }
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

    const results = await this.redis.call(
      'FT.SEARCH', 'idx:tracks', searchQuery,
      'LIMIT', '0', '20'
    );
    return this._parseSearchResults(results);
  }

  // Time Series Operations for Popularity Tracking
  async trackPopularityTS(trackId, popularity) {
    const key = `ts:popularity:track:${trackId}`;
    const timestamp = Date.now();
    await this.redis.call('TS.ADD', key, timestamp, popularity);
  }

  async getPopularityHistory(trackId, fromTimestamp, toTimestamp = '+') {
    const key = `ts:popularity:track:${trackId}`;
    return await this.redis.call('TS.RANGE', key, fromTimestamp, toTimestamp);
  }

  // Batch Operations
  async batchSetTracks(tracks) {
    const pipeline = this.redis.pipeline();
    for (const track of tracks) {
      const key = `track:${track.id}`;
      pipeline.json.set(key, '$', track);
      pipeline.expire(key, this.DEFAULT_EXPIRY);
    }
    return await pipeline.exec();
  }

  // Helper Methods
  _parseSearchResults(results) {
    if (!Array.isArray(results) || results.length < 1) return [];
    const [total, ...documents] = results;
    const parsed = [];
    
    for (let i = 0; i < documents.length; i += 2) {
      const key = documents[i];
      const data = JSON.parse(documents[i + 1][1]);
      parsed.push({ id: key.split(':')[1], ...data });
    }
    
    return parsed;
  }

  // Cache Operations with Label-specific TTL
  async setCacheWithLabel(key, value, label) {
    const ttl = this._getLabelTTL(label);
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async getCacheByLabel(key) {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  _getLabelTTL(label) {
    // Different cache durations for different labels
    const labelTTLs = {
      'Universal': 7200,    // 2 hours
      'Sony': 7200,        // 2 hours
      'Warner': 7200,      // 2 hours
      'Independent': 3600,  // 1 hour
      'default': 3600      // 1 hour
    };
    return labelTTLs[label] || labelTTLs.default;
  }
}

module.exports = RedisService;
