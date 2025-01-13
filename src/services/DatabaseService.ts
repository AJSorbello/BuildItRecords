import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { Track, Release, Artist, Album } from '../types/models';
import { SpotifyTrack, SpotifyRelease, SpotifyArtist, SpotifyAlbum } from '../types/spotify';
import { API_URL } from '../config';
import { logger } from '../utils/logger';
import { RecordLabel } from '../types/label';
import { PaginatedResponse, ApiError } from '../types/api';

export class DatabaseApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'DatabaseApiError';
  }
}

export class DatabaseService {
  private static instance: DatabaseService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = `${API_URL}/api`;
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async request<T>(options: AxiosRequestConfig): Promise<T> {
    try {
      console.log(`Making ${options.method} request to ${options.url}`);
      const token = localStorage.getItem('adminToken');
      const response = await axios({
        ...options,
        baseURL: this.baseUrl,
        headers: {
          ...options.headers,
          Authorization: token ? `Bearer ${token}` : '',
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message);
      }
      console.error('Unknown error:', error);
      throw new Error('An unexpected error occurred');
    }
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message;
      
      // Handle specific error cases
      if (status === 401) {
        throw new DatabaseApiError('Authentication required. Please log in again.', status);
      } else if (status === 404) {
        throw new DatabaseApiError('Resource not found.', status);
      } else if (status === 403) {
        throw new DatabaseApiError('Access denied. Insufficient permissions.', status);
      }
      
      throw new DatabaseApiError(message, status);
    }
    throw new DatabaseApiError('An unexpected error occurred');
  }

  // Labels
  async getLabels(): Promise<RecordLabel[]> {
    return this.request<RecordLabel[]>({
      method: 'GET',
      url: '/labels'
    });
  }

  // Artists
  async getArtists(params: { search?: string; label?: string } = {}): Promise<Artist[]> {
    return this.request<Artist[]>({
      method: 'GET',
      url: '/artists',
      params
    });
  }

  async getArtistById(id: string): Promise<Artist & { releases: Release[] }> {
    return this.request<Artist & { releases: Release[] }>({
      method: 'GET',
      url: `/artists/${id}`
    });
  }

  async getArtistsForLabel(labelId: string): Promise<Artist[]> {
    return this.request<Artist[]>({
      method: 'GET',
      url: `/labels/${labelId}/artists`
    });
  }

  // Releases
  async getReleasesByLabelId(labelId: string, offset: number = 0, limit: number = 10): Promise<PaginatedResponse<Release>> {
    try {
      const response = await this.request<PaginatedResponse<Release>>({
        method: 'GET',
        url: '/releases',
        params: { labelId, offset, limit }
      });

      if (!response.items) {
        logger.warn(`No releases found for label ${labelId}`);
        return {
          items: [],
          total: 0,
          limit,
          offset
        };
      }

      return response;
    } catch (error) {
      logger.error('Error fetching releases:', error);
      throw this.handleError(error);
    }
  }

  // Tracks
  async getTracks(labelId?: string): Promise<Track[]> {
    try {
      console.log('Fetching tracks for label:', labelId);
      const response = await this.request<{ tracks: Track[] }>({
        method: 'GET',
        url: labelId ? `/labels/${labelId}/tracks` : '/tracks'
      });
      
      // Validate and clean the response
      const tracks = response.tracks || [];
      return tracks.map(track => ({
        ...track,
        artists: Array.isArray(track.artists) ? track.artists.filter(a => a && a.id) : [],
        release: Array.isArray(track.release) ? track.release.filter(r => r && r.id) : []
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching tracks:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch tracks');
      }
      console.error('Unknown error fetching tracks:', error);
      throw new Error('An unexpected error occurred while fetching tracks');
    }
  }

  async getTrackById(id: string): Promise<Track> {
    const response = await this.request<{ track: Track }>({
      method: 'GET',
      url: `/tracks/${id}`
    });
    return response.track;
  }

  async searchTracks(query: string, labelId?: string): Promise<{ tracks: Track[] }> {
    const response = await this.request<{ tracks: Track[] }>({
      method: 'GET',
      url: labelId ? `/labels/${labelId}/tracks/search` : '/tracks/search',
      params: { query }
    });
    return { tracks: response.tracks || [] };
  }

  async importTracksByLabel(labelId: string): Promise<Track[]> {
    const response = await this.request<{ tracks: Track[] }>({
      method: 'POST',
      url: `/labels/${labelId}/import`
    });
    return response.tracks || [];
  }

  async updateTrack(trackId: string, updates: Partial<Track>): Promise<Track> {
    return this.request<Track>({
      method: 'PUT',
      url: `/tracks/${trackId}`,
      data: updates
    });
  }

  async verifyAdminToken(): Promise<{ verified: boolean }> {
    return this.request<{ verified: boolean }>({
      method: 'GET',
      url: '/admin/verify-admin-token'
    });
  }

  // Helper methods
  private formatArtist(artist: SpotifyArtist): Artist {
    return {
      id: artist.id,
      name: artist.name,
      images: artist.images,
      external_urls: artist.external_urls
    };
  }

  private formatAlbum(album: SpotifyAlbum, tracks?: SpotifyTrack[]): Album {
    return {
      id: album.id,
      name: album.name,
      images: album.images,
      artists: album.artists.map(artist => this.formatArtist(artist)),
      release_date: album.release_date,
      tracks: tracks?.map(track => this.formatTrack(track)) || [],
      external_urls: album.external_urls
    };
  }

  private formatTrack(track: SpotifyTrack, albumData?: SpotifyAlbum): Track {
    return {
      id: track.id,
      name: track.name,
      duration_ms: track.duration_ms,
      artists: track.artists.map(artist => this.formatArtist(artist)),
      album: albumData ? this.formatAlbum(albumData) : track.album,
      preview_url: track.preview_url,
      external_urls: track.external_urls
    };
  }

  private formatRelease(release: SpotifyRelease): Release {
    return {
      id: release.id,
      name: release.name,
      artists: release.artists.map(artist => this.formatArtist(artist)),
      album: this.formatAlbum(release.album, release.tracks),
      tracks: release.tracks.map(track => this.formatTrack(track, release.album)),
      external_urls: {
        spotify: release.external_urls.spotify
      }
    };
  }
}

export const databaseService = DatabaseService.getInstance();
export type { RecordLabel, PaginatedResponse };
