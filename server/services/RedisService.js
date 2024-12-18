const redis = require('../config/redis');

class RedisService {
  constructor() {
    this.redis = redis;
    this.TRACKS_CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds
    this.ARTIST_CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds
  }

  async createSearchIndex() {
    try {
      // Check if index exists
      const indices = await this.redis.call('FT._LIST');
      if (!indices.includes('idx:tracks')) {
        await this.redis.call(
          'FT.CREATE',
          'idx:tracks',
          'ON', 'HASH',
          'PREFIX', '1', 'track:',
          'SCHEMA',
          'title', 'TEXT', 'SORTABLE',
          'artist', 'TEXT', 'SORTABLE',
          'label', 'TAG', 'SORTABLE'
        );
      }
    } catch (error) {
      console.error('Error creating search index:', error);
    }
  }

  async getTracksForLabel(label) {
    try {
      const tracks = await this.redis.get(`tracks:${label}`);
      return tracks ? JSON.parse(tracks) : null;
    } catch (error) {
      console.error('Error getting tracks for label:', error);
      return null;
    }
  }

  async setTracksForLabel(label, tracks) {
    try {
      await this.redis.setex(
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
      const artist = await this.redis.get(`artist:${artistId}`);
      return artist ? JSON.parse(artist) : null;
    } catch (error) {
      console.error('Error getting artist details:', error);
      return null;
    }
  }

  async setArtistDetails(artistId, details) {
    try {
      await this.redis.setex(
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
      await this.redis.flushdb();
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

module.exports = RedisService;
