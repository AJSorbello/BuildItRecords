/**
 * @fileoverview Service for handling database operations and API calls
 * @module services/DatabaseService
 */

import type { Track, LocalTrack } from '../types/track';
import type { Artist } from '../types/artist';
import type { Release } from '../types/release';
import type { RecordLabelId } from '../types/labels';
import { DatabaseError } from '../utils/errors';

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  tracks?: Track[];
  releases?: Release[];
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
        releases: Release[];
        totalReleases: number;
        totalTracks: number;
        error?: string;
      }>(`/releases/label/${dbLabelId}`);

      console.log('API response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch releases');
      }

      return {
        releases: response.releases || [],
        totalReleases: response.totalReleases || 0,
        totalTracks: response.totalTracks || 0
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

      const releases = response.releases.map(release => {
        // Ensure release has required properties
        if (!release.images && release.artwork_url) {
          release.images = [{ url: release.artwork_url }];
        }
        return {
          ...release,
          artwork_url: release.artwork_url || release.images?.[0]?.url || null
        };
      });

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
      return {
        tracks: response.tracks || [],
        total: response.total || 0
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
   * @param {string} labelId - The ID of the label to get artists for
   * @returns {Promise<Artist[]>} Array of artists
   */
  public async getArtistsForLabel(labelId: string): Promise<Artist[]> {
    try {
      if (!labelId || typeof labelId !== 'string') {
        console.error('Invalid label ID:', labelId);
        return [];
      }

      console.log('Fetching artists for label:', labelId);
      const response = await this.fetchApi<Artist[] | ApiResponse<Artist[]>>(`/artists/search?label=${labelId}`);
      
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
}

/**
 * Singleton instance of DatabaseService
 */
export const databaseService = DatabaseService.getInstance();
