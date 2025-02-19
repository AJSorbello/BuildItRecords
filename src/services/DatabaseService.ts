/**
 * @fileoverview Service for handling database operations and API calls
 * @module services/DatabaseService
 */

import type { Track, LocalTrack } from '../types/track';
import type { Artist } from '../types/artist';
import type { Release, ReleaseResponse } from '../types/release';
import type { RecordLabelId } from '../types/labels';
import type { SpotifyImage } from '../types/spotify';
import { DatabaseError } from '../utils/errors';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  tracks?: Track[];
  releases?: ReleaseResponse[];
  total?: number;
  offset?: number;
  limit?: number;
  count?: number;
}

interface AdminLoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}

interface TokenVerificationResponse {
  verified: boolean;
  message?: string;
}

interface ProcessedRelease extends Omit<Release, 'artwork_url'> {
  artwork_url?: string;
}

interface ApiTrackResponse {
  tracks: Array<{
    id: string;
    title: string;
    duration_ms: number;
    preview_url?: string;
    release?: ReleaseResponse;
    artists?: Artist[];
    remixer?: Artist;
  }>;
}

/**
 * Service class for handling database operations through API calls
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private baseUrl: string;

  private constructor() {
    const apiUrl = process.env.REACT_APP_API_URL;
    this.baseUrl = apiUrl || 'http://localhost:3001/api';
    console.log('DatabaseService initialized with baseUrl:', this.baseUrl);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const token = localStorage.getItem('adminToken');
      const url = `${this.baseUrl}${endpoint}`;
      console.log('Making API request to:', url);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      console.log('API Response status:', response.status);
      const data = await response.json();
      console.log('API Response data:', data);

      if (!response.ok) {
        console.error('API Error Response:', data);
        throw new DatabaseError(
          data.error || `HTTP error! status: ${response.status}`,
          response.status === 404 ? 'not_found' : 'api_error'
        );
      }

      return data;
    } catch (error) {
      console.error(`API error for ${endpoint}:`, error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'api_error'
      );
    }
  }

  // Release Methods
  public async getReleasesByLabelId(labelId: string): Promise<{
    releases: Release[];
    totalReleases: number;
    totalTracks: number;
  }> {
    try {
      console.log('Fetching releases for label:', labelId);
      
      // Map label IDs to their string values
      const labelIdMap: { [key: string]: string } = {
        'buildit-records': 'buildit-records',
        'buildit-tech': 'buildit-tech',
        'buildit-deep': 'buildit-deep'
      };

      const dbLabelId = labelIdMap[labelId];
      if (!dbLabelId) {
        console.warn(`No label ID found for label: ${labelId}`);
        return {
          releases: [],
          totalReleases: 0,
          totalTracks: 0
        };
      }

      console.log('Using label ID:', dbLabelId);
      const response = await this.fetchApi<{
        success: boolean;
        releases: ReleaseResponse[];
        totalReleases: number;
        totalTracks: number;
        error?: string;
      }>(`/releases?label=${dbLabelId}`);

      console.log('API response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch releases');
      }

      // Process the releases to ensure all fields are properly mapped
      const processedReleases = await this.processReleases(response);

      return {
        releases: processedReleases,
        totalReleases: response.totalReleases || processedReleases.length,
        totalTracks: response.totalTracks || processedReleases.reduce((acc, rel) => acc + (rel.total_tracks || 0), 0)
      };
    } catch (error) {
      console.error('Error in getReleasesByLabelId:', error);
      throw error;
    }
  }

  // Gets top releases for a label based on Spotify popularity
  public async getTopReleases(labelId: string): Promise<Release[]> {
    try {
      console.log('Fetching top releases for label:', labelId);

      // Map label IDs to their string values
      const labelIdMap: { [key: string]: string } = {
        'buildit-records': 'buildit-records',
        'buildit-tech': 'buildit-tech',
        'buildit-deep': 'buildit-deep'
      };

      const dbLabelId = labelIdMap[labelId];
      if (!dbLabelId) {
        console.warn(`No label ID found for label: ${labelId}`);
        return [];
      }

      // Use the existing /releases endpoint with sort and limit parameters
      const response = await this.fetchApi<ApiResponse<never>>(`/releases?label=${dbLabelId}&sort=popularity&order=desc&limit=10`);
      
      if (!response.releases || !Array.isArray(response.releases)) {
        console.warn(`No releases found for label: ${labelId}`);
        return [];
      }

      const releases = response.releases.map(release => ({
        ...release,
        title: release.title || 'Unknown Album',
        release_date: release.release_date,
        artwork_url: release.artwork_url || release.images?.[0]?.url || null,
        images: (release.images || []).map(img => ({
          url: img.url,
          height: img.height || 0,
          width: img.width || 0
        })),
        artists: release.artists || []
      }));

      console.log('Processed top releases:', releases);
      return releases;
    } catch (error) {
      if (error instanceof DatabaseError && error.message.includes('404')) {
        console.warn(`Label not found: ${labelId}`);
        return [];
      }
      console.error('Error fetching top releases:', error);
      throw new DatabaseError('Failed to fetch top releases');
    }
  }

  public async processReleases(response: { releases: ReleaseResponse[] }): Promise<Release[]> {
    try {
      const releases = response.releases.map((release) => {
        const processedImages = (release.images || []).map((img: SpotifyImage) => ({
          url: img.url,
          height: img.height !== null ? img.height : 0,
          width: img.width !== null ? img.width : 0
        }));

        return {
          id: release.id,
          title: release.title || 'Unknown Album',
          type: 'album' as const,
          artists: release.artists || [],
          tracks: release.tracks || [],
          images: processedImages,
          artwork_url: release.artwork_url,
          release_date: release.release_date,
          external_urls: {
            spotify: release.spotify_url || ''
          },
          uri: release.spotify_uri || '',
          total_tracks: release.total_tracks || 0,
          release_date_precision: 'day',
          label: undefined
        } satisfies Release;
      });

      return releases;
    } catch (error) {
      console.error('Error processing releases:', error);
      throw error;
    }
  }

  public async processTracks(response: ApiTrackResponse): Promise<Track[]> {
    try {
      const tracks = response.tracks.map((track) => {
        const release = track.release;
        const processedRelease = release ? {
          id: release.id,
          title: release.title || 'Unknown Album',
          type: 'album' as const,
          artists: release.artists || [],
          tracks: [],
          images: (release.images || []).map((img: SpotifyImage) => ({
            url: img.url,
            height: img.height !== null ? img.height : 0,
            width: img.width !== null ? img.width : 0
          })),
          artwork_url: release.artwork_url,
          release_date: release.release_date,
          external_urls: {
            spotify: release.spotify_url || ''
          },
          uri: release.spotify_uri || '',
          total_tracks: release.total_tracks || 0,
          release_date_precision: 'day',
          label: undefined
        } satisfies Release : undefined;

        return {
          id: track.id,
          title: track.title || 'Unknown Track',
          duration: track.duration_ms || 0,
          track_number: 1,
          disc_number: 1,
          preview_url: track.preview_url || undefined,
          external_urls: { spotify: '' },
          external_ids: {},
          uri: '',
          type: 'track' as const,
          release: processedRelease,
          artists: track.artists || [],
          remixer: track.remixer || null,
          isrc: '',
          name: track.title || 'Unknown Track'
        } satisfies Track;
      });

      return tracks;
    } catch (error) {
      console.error('Error processing tracks:', error);
      throw error;
    }
  }

  // Track Methods
  public async getTracksByLabel(labelId: string, sortBy: string = 'created_at'): Promise<{
    tracks: Track[];
    total: number;
  }> {
    try {
      // Map label IDs to their string values
      const labelIdMap: { [key: string]: string } = {
        'buildit-records': 'buildit-records',
        'buildit-tech': 'buildit-tech',
        'buildit-deep': 'buildit-deep'
      };

      const dbLabelId = labelIdMap[labelId];
      if (!dbLabelId) {
        console.warn(`No label ID found for label: ${labelId}`);
        return {
          tracks: [],
          total: 0
        };
      }

      // Use the /all endpoint to get all tracks without pagination
      const response = await this.fetchApi(`/tracks/all/${dbLabelId}`);
      const tracks = (response.tracks || []).map(track => {
        // Process the release/album data
        const release = track.release || track.album;
        const processedRelease = release ? {
          ...release,
          title: release.title || 'Unknown Album',
          release_date: release.release_date,
          artwork_url: release.artwork_url || release.images?.[0]?.url || null,
          images: (release.images || []).map(img => ({
            url: img.url,
            height: img.height || 0,
            width: img.width || 0
          })),
          artists: release.artists || []
        } : null;

        return {
          ...track,
          title: track.title || 'Unknown Track',
          name: track.name || track.title || 'Unknown Track',
          release: processedRelease,
          artists: track.artists || [],
          label: track.label || track.label_id || null,
          artwork_url: track.artwork_url || track.images?.[0]?.url || processedRelease?.artwork_url || null
        };
      });
      
      return {
        tracks,
        total: response.total || tracks.length
      };
    } catch (error) {
      console.error('Error in getTracksByLabel:', error);
      throw error;
    }
  }

  public async getTrackById(trackId: string): Promise<Track | null> {
    try {
      const response = await this.fetchApi<ApiResponse<Track>>(`/tracks/${trackId}`);
      return response.data || null;
    } catch (error) {
      if (error instanceof DatabaseError && error.code === 'not_found') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Imports tracks from Spotify for a specific label
   * @param {string} labelId - The ID of the label to import tracks for
   * @returns {Promise<{ success: boolean; message: string }>} Import result
   */
  public async importTracksFromSpotify(labelId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.fetchApi<ApiResponse<never>>(`/labels/${labelId}/import`, {
      method: 'POST'
    });

    return {
      success: true, // If we got here, it was successful since errors would have thrown
      message: response.message || 'Import started successfully'
    };
  }

  /**
   * Gets all artists for a specific label
   * @param {string | { id: string }} labelId - The ID of the label to get artists for
   * @returns {Promise<Artist[]>} Array of artists
   */
  public async getArtistsForLabel(labelId: string | { id: string }): Promise<Artist[]> {
    try {
      const id = typeof labelId === 'string' ? labelId : labelId.id;
      
      if (!id) {
        console.error('Invalid label ID:', labelId);
        return [];
      }

      // Convert label ID to lowercase for consistency
      const normalizedId = id.toLowerCase();
      
      // Map label names to IDs if needed
      const labelMap: { [key: string]: string } = {
        'records': 'buildit-records',
        'tech': 'buildit-tech',
        'deep': 'buildit-deep'
      };

      const finalId = labelMap[normalizedId] || normalizedId;
      console.log('Fetching artists for label:', finalId);
      
      const response = await this.fetchApi<Artist[] | ApiResponse<Artist[]>>(`/artists/search?label=${finalId}`);
      
      // Handle both array and object responses
      const artists = Array.isArray(response) ? response : response.data || [];
      console.log('Found artists:', artists.length);
      return artists;
    } catch (error) {
      console.error('Error fetching artists for label:', error);
      throw new DatabaseError('Failed to fetch artists');
    }
  }

  /**
   * Authenticates an admin user
   * @param {string} username - Admin username
   * @param {string} password - Admin password
   * @returns {Promise<AdminLoginResponse>} Login response with token if successful
   */
  public async adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
    try {
      const response = await this.fetchApi<ApiResponse<{ token: string }>>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      return {
        success: true,
        token: response.data?.token,
        message: response.message || 'Login successful'
      };
    } catch (error) {
      console.error('Admin login failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  /**
   * Verifies the admin token stored in localStorage
   * @returns {Promise<TokenVerificationResponse>} Verification result
   */
  public async verifyAdminToken(): Promise<TokenVerificationResponse> {
    try {
      const response = await this.fetchApi<ApiResponse<never>>('/admin/verify');

      return {
        verified: true, // If we got here, it was successful since errors would have thrown
        message: response.message
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return {
        verified: false,
        message: error instanceof Error ? error.message : 'Token verification failed'
      };
    }
  }

  public async getTracksByArtist(artistId: string): Promise<Track[]> {
    try {
      console.log('Fetching tracks for artist:', artistId);
      const response = await this.fetchApi<{ success: boolean; data: Track[]; total: number }>(`/tracks/search?artist=${artistId}`);
      console.log('Track response:', response);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching tracks for artist:', error);
      throw new DatabaseError('Failed to fetch artist tracks');
    }
  }

  /**
   * Delete a track from the database
   * @param trackId - ID of the track to delete
   * @returns Promise resolving to success status
   */
  public async deleteTrack(trackId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tracks/${trackId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete track: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Error deleting track:', error);
      throw error;
    }
  }
}

/**
 * Singleton instance of DatabaseService
 */
export const databaseService = DatabaseService.getInstance();
