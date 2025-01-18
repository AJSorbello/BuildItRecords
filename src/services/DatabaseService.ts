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

  private async fetchApi<T extends ApiResponse<any>>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error Response:', errorData);
        throw new DatabaseError(
          errorData.message || `HTTP error! status: ${response.status}`,
          response.status === 404 ? 'not_found' : 'api_error'
        );
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      // Some endpoints don't return a success field, so we'll consider them successful if they have data
      if (data.success === false || (!data.success && !data.tracks && !data.releases && !data.data)) {
        throw new DatabaseError(data.message || 'API request failed', 'api_error');
      }

      return data;
    } catch (error) {
      console.error(`API error for ${endpoint}:`, error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to fetch from ${endpoint}: ${error}`,
        'api_error'
      );
    }
  }

  // Release Methods
  public async getReleasesByLabelId(labelId: RecordLabelId, page: number = 1, limit: number = 500): Promise<{ releases: Release[]; totalReleases: number; currentPage: number; totalPages: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;
    const response = await this.fetchApi<ApiResponse<never>>(`/releases?label=${labelId}&offset=${offset}&limit=${limit}`);

    return {
      releases: response.releases || [],
      totalReleases: response.total || 0,
      currentPage: page,
      totalPages: Math.ceil((response.total || 0) / limit),
      hasMore: ((offset + (response.releases?.length || 0)) < (response.total || 0))
    };
  }

  // Track Methods
  public async getTracksByLabel(labelId: RecordLabelId, sortBy?: string): Promise<{ tracks: Track[] }> {
    const endpoint = sortBy ? `/tracks?label=${labelId}&sort=${sortBy}` : `/tracks?label=${labelId}`;
    const response = await this.fetchApi<ApiResponse<never>>(endpoint);

    return {
      tracks: response.tracks || []
    };
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
   * @param {RecordLabelId} labelId - The ID of the label to import tracks for
   * @returns {Promise<{ success: boolean; message: string }>} Import result
   */
  public async importTracksFromSpotify(labelId: RecordLabelId): Promise<{ success: boolean; message: string }> {
    const response = await this.fetchApi<ApiResponse<never>>(`/labels/${labelId}/import`, {
      method: 'POST'
    });

    return {
      success: true, // If we got here, it was successful since errors would have thrown
      message: response.message || 'Import started successfully'
    };
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
}

/**
 * Singleton instance of DatabaseService
 */
export const databaseService = DatabaseService.getInstance();
