import { Track } from '../types/track';
import { RecordLabel } from '../constants/labels';

class RedisService {
  private static instance: RedisService;
  private readonly API_URL = '/api/redis';
  private readonly TRACKS_CACHE_DURATION = 300; // 5 minutes in seconds
  private readonly CACHE_HITS = new Map<string, number>();
  private readonly CACHE_MISSES = new Map<string, number>();

  private constructor() {}

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  async getTracksForLabel(label: RecordLabel): Promise<Track[] | null> {
    try {
      const cacheKey = `tracks:${label}`;
      const response = await fetch(`${this.API_URL}/tracks/${label}`);
      if (!response.ok) {
        this.CACHE_MISSES.set(cacheKey, (this.CACHE_MISSES.get(cacheKey) || 0) + 1);
        return null;
      }
      const data = await response.json();
      this.CACHE_HITS.set(cacheKey, (this.CACHE_HITS.get(cacheKey) || 0) + 1);
      return data;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async setTracksForLabel(label: RecordLabel, tracks: Track[]): Promise<void> {
    try {
      await fetch(`${this.API_URL}/tracks/${label}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tracks, duration: this.TRACKS_CACHE_DURATION }),
      });
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async getArtistDetails(artistId: string): Promise<any | null> {
    try {
      const cacheKey = `artist:${artistId}`;
      const response = await fetch(`${this.API_URL}/artist/${artistId}`);
      if (!response.ok) {
        this.CACHE_MISSES.set(cacheKey, (this.CACHE_MISSES.get(cacheKey) || 0) + 1);
        return null;
      }
      const data = await response.json();
      this.CACHE_HITS.set(cacheKey, (this.CACHE_HITS.get(cacheKey) || 0) + 1);
      return data;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async setArtistDetails(artistId: string, details: any): Promise<void> {
    try {
      await fetch(`${this.API_URL}/artist/${artistId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ details, duration: this.TRACKS_CACHE_DURATION }),
      });
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await fetch(`${this.API_URL}/clear`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Redis clear cache error:', error);
    }
  }

  async getCacheStats(): Promise<{
    hits: Map<string, number>;
    misses: Map<string, number>;
    memory: { used: string; peak: string; };
  }> {
    try {
      const response = await fetch(`${this.API_URL}/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch cache stats');
      }
      const data = await response.json();
      return {
        hits: this.CACHE_HITS,
        misses: this.CACHE_MISSES,
        memory: data.memory,
      };
    } catch (error) {
      console.error('Redis get cache stats error:', error);
      return {
        hits: this.CACHE_HITS,
        misses: this.CACHE_MISSES,
        memory: {
          used: 'N/A',
          peak: 'N/A',
        },
      };
    }
  }
}

export const redisService = RedisService.getInstance();
