import { Track } from '../types/track';
import { Artist } from '../types/artist';
import { Album } from '../types/album';
import { Release } from '../types/release';
import { 
  PaginatedResponse, 
  QueryOptions, 
  ImportStatus
} from '../types/paginated-response';
import { PopularityHistory, Market } from '../types/common';
import { Cache } from '../utils/cache';
import { logger } from '../utils/logger';
import { apiService } from './ApiService';
import { DatabaseError } from '../types/errors';
import { RecordLabelId } from '../types/label';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class DatabaseService {
  private static instance: DatabaseService;
  private trackCache: Cache<Track | PaginatedResponse<Track>>;
  private artistCache: Cache<Artist | PaginatedResponse<Artist>>;
  private albumCache: Cache<Album | PaginatedResponse<Album>>;
  private popularityCache: Cache<PopularityHistory[]>;
  private marketCache: Cache<Market[]>;
  private releaseCache: Cache<Release | PaginatedResponse<Release>>;

  private constructor() {
    this.trackCache = new Cache({ ttl: CACHE_TTL });
    this.artistCache = new Cache({ ttl: CACHE_TTL });
    this.albumCache = new Cache({ ttl: CACHE_TTL });
    this.popularityCache = new Cache({ ttl: CACHE_TTL });
    this.marketCache = new Cache({ ttl: CACHE_TTL });
    this.releaseCache = new Cache({ ttl: CACHE_TTL });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private handleError(error: unknown, method: string): never {
    logger.error(`DatabaseService.${method} error:`, error);
    throw new DatabaseError(
      `Error in DatabaseService.${method}`,
      method,
      error
    );
  }

  // Authentication methods
  async adminLogin(username: string, password: string): Promise<{ token: string }> {
    try {
      const response = await apiService.post<{ success: boolean; data: { token: string }; message: string }>('/auth/login', {
        username,
        password
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }
      
      return { token: response.data.token };
    } catch (error) {
      this.handleError(error, 'adminLogin');
    }
  }

  // Artist methods
  async getArtists(options?: QueryOptions): Promise<PaginatedResponse<Artist>> {
    try {
      const cacheKey = `artists-${JSON.stringify(options)}`;
      const cachedData = this.artistCache.get(cacheKey) as PaginatedResponse<Artist> | undefined;
      if (cachedData) return cachedData;

      const response = await apiService.get<PaginatedResponse<Artist>>('/artists', { params: options });
      this.artistCache.set(cacheKey, response);
      return response;
    } catch (error) {
      this.handleError(error, 'getArtists');
    }
  }

  async getArtist(id: string): Promise<Artist | null> {
    try {
      const cacheKey = `artist-${id}`;
      const cachedData = this.artistCache.get(cacheKey) as Artist | undefined;
      if (cachedData) return cachedData;

      const artist = await apiService.get<Artist>(`/artists/${id}`);
      if (!artist) {
        logger.warn(`Artist not found: ${id}`);
        return null;
      }

      this.artistCache.set(cacheKey, artist);
      return artist;
    } catch (error) {
      this.handleError(error, 'getArtist');
    }
  }

  async getArtistTracks(artistId: string): Promise<Track[]> {
    try {
      const cacheKey = `artist-tracks-${artistId}`;
      const cachedData = this.trackCache.get(cacheKey) as Track[] | undefined;
      if (cachedData) return cachedData;

      const tracks = await apiService.get<Track[]>(`/artists/${artistId}/tracks`);
      if (!tracks) return [];
      
      this.trackCache.set(cacheKey, tracks);
      return tracks;
    } catch (error) {
      this.handleError(error, 'getArtistTracks');
    }
  }

  async getArtistReleases(artistId: string): Promise<Release[]> {
    try {
      const cacheKey = `artist-releases-${artistId}`;
      const cachedData = this.releaseCache.get(cacheKey) as Release[] | undefined;
      if (cachedData) return cachedData;

      const releases = await apiService.get<Release[]>(`/artists/${artistId}/releases`);
      if (!releases) return [];
      
      this.releaseCache.set(cacheKey, releases);
      return releases;
    } catch (error) {
      this.handleError(error, 'getArtistReleases');
    }
  }

  async createArtist(artist: Partial<Artist>): Promise<Artist> {
    try {
      const response = await apiService.post<Artist>('/artists', artist);
      this.artistCache.clear(); // Clear cache since collection changed
      return response;
    } catch (error) {
      this.handleError(error, 'createArtist');
    }
  }

  async updateArtist(id: string, updates: Partial<Artist>): Promise<Artist | null> {
    try {
      const response = await apiService.put<Artist>(`/artists/${id}`, updates);
      if (!response) {
        logger.warn(`Artist not found for update: ${id}`);
        return null;
      }

      this.artistCache.clear(); // Clear cache since collection changed
      return response;
    } catch (error) {
      this.handleError(error, 'updateArtist');
    }
  }

  async deleteArtist(id: string): Promise<void> {
    try {
      await apiService.delete(`/artists/${id}`);
      this.artistCache.clear(); // Clear cache since collection changed
    } catch (error) {
      this.handleError(error, 'deleteArtist');
    }
  }

  // Album methods
  async getAlbums(options?: QueryOptions): Promise<PaginatedResponse<Album>> {
    try {
      const cacheKey = `albums-${JSON.stringify(options)}`;
      const cachedData = this.albumCache.get(cacheKey) as PaginatedResponse<Album> | undefined;
      if (cachedData) return cachedData;

      const response = await apiService.get<PaginatedResponse<Album>>('/albums', { params: options });
      this.albumCache.set(cacheKey, response);
      return response;
    } catch (error) {
      this.handleError(error, 'getAlbums');
    }
  }

  async getAlbum(id: string): Promise<Album | null> {
    try {
      const cacheKey = `album-${id}`;
      const cachedData = this.albumCache.get(cacheKey) as Album | undefined;
      if (cachedData) return cachedData;

      const album = await apiService.get<Album>(`/albums/${id}`);
      if (!album) {
        logger.warn(`Album not found: ${id}`);
        return null;
      }

      this.albumCache.set(cacheKey, album);
      return album;
    } catch (error) {
      this.handleError(error, 'getAlbum');
    }
  }

  async getAlbumPopularityHistory(albumId: string): Promise<PopularityHistory[]> {
    try {
      const cacheKey = `album-popularity-${albumId}`;
      const cachedData = this.popularityCache.get(cacheKey) as PopularityHistory[] | undefined;
      if (cachedData) return cachedData;

      const history = await apiService.get<PopularityHistory[]>(`/albums/${albumId}/popularity`);
      this.popularityCache.set(cacheKey, history);
      return history;
    } catch (error) {
      this.handleError(error, 'getAlbumPopularityHistory');
    }
  }

  async getAlbumMarkets(albumId: string): Promise<Market[]> {
    try {
      const cacheKey = `album-markets-${albumId}`;
      const cachedData = this.marketCache.get(cacheKey) as Market[] | undefined;
      if (cachedData) return cachedData;

      const markets = await apiService.get<Market[]>(`/albums/${albumId}/markets`);
      this.marketCache.set(cacheKey, markets);
      return markets;
    } catch (error) {
      this.handleError(error, 'getAlbumMarkets');
    }
  }

  async createAlbum(album: Partial<Album>): Promise<Album> {
    try {
      const response = await apiService.post<Album>('/albums', album);
      this.albumCache.clear(); // Clear cache since collection changed
      return response;
    } catch (error) {
      this.handleError(error, 'createAlbum');
    }
  }

  async updateAlbum(id: string, updates: Partial<Album>): Promise<Album | null> {
    try {
      const response = await apiService.put<Album>(`/albums/${id}`, updates);
      if (!response) {
        logger.warn(`Album not found for update: ${id}`);
        return null;
      }

      this.albumCache.clear(); // Clear cache since collection changed
      return response;
    } catch (error) {
      this.handleError(error, 'updateAlbum');
    }
  }

  async deleteAlbum(id: string): Promise<void> {
    try {
      await apiService.delete(`/albums/${id}`);
      this.albumCache.clear(); // Clear cache since collection changed
    } catch (error) {
      this.handleError(error, 'deleteAlbum');
    }
  }

  // Track methods
  async getTrack(id: string): Promise<Track | null> {
    try {
      const cached = this.trackCache.get(id);
      if (cached && !this.isPaginatedResponse(cached)) {
        return cached as Track;
      }

      const track = await apiService.get<Track>(`/tracks/${id}`);
      this.trackCache.set(id, track);
      return track;
    } catch (error) {
      this.handleError(error, 'getTrack');
    }
  }

  async getTracks(options?: QueryOptions): Promise<PaginatedResponse<Track>> {
    try {
      const cacheKey = 'tracks' + JSON.stringify(options);
      const cached = this.trackCache.get(cacheKey);
      if (cached && this.isPaginatedResponse(cached)) {
        return cached as PaginatedResponse<Track>;
      }

      const response = await apiService.get<PaginatedResponse<Track>>('/tracks', { params: options });
      this.trackCache.set(cacheKey, response);
      return response;
    } catch (error) {
      this.handleError(error, 'getTracks');
    }
  }

  async getTracksByLabel(labelId: RecordLabelId): Promise<PaginatedResponse<Track>> {
    try {
      const cacheKey = `tracks-label-${labelId}`;
      const cached = this.trackCache.get(cacheKey);
      if (cached && this.isPaginatedResponse(cached)) {
        return cached as PaginatedResponse<Track>;
      }

      const response = await this.getTracks({ filter: { labelId } });
      this.trackCache.set(cacheKey, response);
      return response;
    } catch (error) {
      this.handleError(error, 'getTracksByLabel');
    }
  }

  async getTracksByAlbum(albumId: string): Promise<Track[]> {
    try {
      const cacheKey = `album-tracks-${albumId}`;
      const cachedData = this.trackCache.get(cacheKey) as Track[] | undefined;
      if (cachedData) return cachedData;

      const tracks = await apiService.get<Track[]>(`/albums/${albumId}/tracks`);
      if (!tracks) return [];
      
      this.trackCache.set(cacheKey, tracks);
      return tracks;
    } catch (error) {
      this.handleError(error, 'getTracksByAlbum');
    }
  }

  async createTrack(track: Track): Promise<Track> {
    try {
      const response = await apiService.post<Track>('/tracks', track);
      this.trackCache.clear(); // Clear cache since collection changed
      return response;
    } catch (error) {
      this.handleError(error, 'createTrack');
    }
  }

  async updateTrack(id: string, updates: Partial<Track>): Promise<Track | null> {
    try {
      const response = await apiService.put<Track>(`/tracks/${id}`, updates);
      if (!response) {
        logger.warn(`Track not found for update: ${id}`);
        return null;
      }

      this.trackCache.clear(); // Clear cache since collection changed
      return response;
    } catch (error) {
      this.handleError(error, 'updateTrack');
    }
  }

  async deleteTrack(id: string): Promise<void> {
    try {
      await apiService.delete(`/tracks/${id}`);
      this.trackCache.clear(); // Clear cache since collection changed
    } catch (error) {
      this.handleError(error, 'deleteTrack');
    }
  }

  // Release methods
  async getRelease(id: string): Promise<Release | null> {
    try {
      const cached = this.releaseCache.get(id);
      if (cached && !this.isPaginatedResponse(cached)) {
        return cached as Release;
      }

      const release = await apiService.get<Release>(`/releases/${id}`);
      this.releaseCache.set(id, release);
      return release;
    } catch (error) {
      this.handleError(error, 'getRelease');
    }
  }

  async getReleases(options?: QueryOptions): Promise<PaginatedResponse<Release>> {
    try {
      const cacheKey = `releases-${JSON.stringify(options)}`;
      const cached = this.releaseCache.get(cacheKey);
      if (cached && this.isPaginatedResponse(cached)) {
        return cached as PaginatedResponse<Release>;
      }

      const response = await apiService.get<PaginatedResponse<Release>>('/releases', { params: options });
      this.releaseCache.set(cacheKey, response);
      return response;
    } catch (error) {
      this.handleError(error, 'getReleases');
    }
  }

  async getReleasesByLabelId(labelId: RecordLabelId): Promise<Release[]> {
    try {
      const cacheKey = `label-releases-${labelId}`;
      const cachedData = this.releaseCache.get(cacheKey) as Release[] | undefined;
      if (cachedData) return cachedData;

      const releases = await apiService.get<Release[]>(`/labels/${labelId}/releases`);
      if (!releases) return [];
      
      this.releaseCache.set(cacheKey, releases);
      return releases;
    } catch (error) {
      this.handleError(error, 'getReleasesByLabelId');
    }
  }

  async createRelease(release: Partial<Release>): Promise<Release> {
    try {
      const response = await apiService.post<Release>('/releases', release);
      this.releaseCache.clear(); // Clear cache since collection changed
      return response;
    } catch (error) {
      this.handleError(error, 'createRelease');
    }
  }

  async updateRelease(id: string, updates: Partial<Release>): Promise<Release | null> {
    try {
      const response = await apiService.put<Release>(`/releases/${id}`, updates);
      if (!response) {
        logger.warn(`Release not found for update: ${id}`);
        return null;
      }

      this.releaseCache.clear(); // Clear cache since collection changed
      return response;
    } catch (error) {
      this.handleError(error, 'updateRelease');
    }
  }

  async deleteRelease(id: string): Promise<void> {
    try {
      await apiService.delete(`/releases/${id}`);
      this.releaseCache.clear(); // Clear cache since collection changed
    } catch (error) {
      this.handleError(error, 'deleteRelease');
    }
  }

  // Import methods
  async importTracksFromSpotify(labelId: RecordLabelId): Promise<{ success: boolean; message: string; tracksImported?: number }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string; tracksImported?: number }>(
        `/labels/${labelId}/import-tracks`,
        {}
      );
      return response;
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error importing tracks from Spotify:', error);
        return {
          success: false,
          message: error.message
        };
      }
      return {
        success: false,
        message: 'An unknown error occurred while importing tracks'
      };
    }
  }

  // Helper method to check if a response is paginated
  private isPaginatedResponse<T>(response: any): response is PaginatedResponse<T> {
    return (
      response &&
      Array.isArray(response.items) &&
      typeof response.total === 'number' &&
      typeof response.limit === 'number' &&
      typeof response.offset === 'number'
    );
  }
}

export const databaseService = DatabaseService.getInstance();
export { DatabaseError };
