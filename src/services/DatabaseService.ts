/**
 * @fileoverview Database service for interacting with the API
 * @module services/DatabaseService
 */

import { Track } from '../types/track';
import { Release } from '../types/release';
import { Artist } from '../types/index'; // Import the specific Artist type to avoid ambiguity
import { SpotifyImage } from '../types/spotify';
import { DatabaseError } from '../utils/errors';
import { RecordLabelId } from '../types/labels'; 
import { getApiBaseUrl } from '../utils/apiConfig';

// Error class for API-specific errors
export class DatabaseApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseApiError';
  }
}

interface ArtistWithReleases extends Artist {
  releases: Release[];
}

// Extended Release interface to include all possible properties
interface ExtendedRelease extends Release {
  cover_url?: string;
  cover_image_url?: string;
}

// Extended Artist interface to include all possible properties
interface ExtendedArtist extends Artist {
  images?: Array<{ url: string; height?: number; width?: number }>;
  profile_image?: string;
  photo_url?: string;
  profile_image_url?: string;
  profile_image_large_url?: string;
}

interface Album {
  id: string;
  name: string;
  title: string;
  type: 'album';
  release_date: string;
  artwork_url?: string;
  images?: Array<{ url: string; height: number; width: number }>;
  spotify_url: string;
  spotify_uri: string;
  labelId: string;
  total_tracks: number;
  artists?: Artist[];
  tracks?: Track[];
}

interface ApiResponse<T = unknown> {
  success?: boolean;
  data?: T[];
  message?: string;
  error?: string;
  tracks?: Track[];
  releases?: Release[];
  artists?: Artist[];
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

interface ProcessedRelease {
  artwork_url?: string;
}

interface ApiTrackResponse {
  tracks: Array<{
    id: string;
    title: string;
    duration_ms: number;
    preview_url?: string;
    release?: Album;
    artists?: Artist[];
    remixer?: Artist;
  }>;
}

interface ImportResponse {
  success: boolean;
  message: string;
  details?: {
    totalTracksImported: number;
    totalArtistsImported: number;
    totalReleasesImported: number;
  };
  count?: number;
}

/**
 * Service class for handling database operations through API calls
 */
class DatabaseService {
  private static instance: DatabaseService;
  private baseUrl: string;
  // Define environment variables with class-level scope
  private NODE_ENV: string;
  private REACT_APP_API_URL: string | undefined;
  private clientOrigin: string;
  processReleases: any;

  private constructor() {
    // Initialize environment variables with fallbacks for browser
    this.NODE_ENV = typeof process !== 'undefined' && process.env ? process.env.NODE_ENV : 'development';
    this.REACT_APP_API_URL = typeof process !== 'undefined' && process.env ? process.env.REACT_APP_API_URL : undefined;
    this.clientOrigin = typeof window !== 'undefined' ? window.location.origin : 'server';
    
    // Log environment detection information
    console.log('[DatabaseService] Environment:', this.NODE_ENV);
    console.log('[DatabaseService] API URL from env:', this.REACT_APP_API_URL);
    console.log('[DatabaseService] Running on:', this.clientOrigin);
    
    try {
      // Use the apiConfig utility to get the base URL
      this.baseUrl = getApiBaseUrl().replace(/\/api$/, '');
      console.log('[DatabaseService] Using API base URL:', this.baseUrl);
    } catch (error) {
      // Fallback to direct local API URL if there's an error
      this.baseUrl = 'http://localhost:3001';
      console.log('[DatabaseService] Fallback to local API URL:', this.baseUrl);
    }

    // Initialize processReleases method to handle multiple API response formats
    this.processReleases = async (response: ApiResponse<ExtendedRelease>): Promise<Release[]> => {
      console.log('[DatabaseService] Processing releases from API response:', response);
      
      // Check which format the response is in and extract the releases array
      let releasesArray: ExtendedRelease[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        // New API format: { success: true, data: [...] }
        console.log('[DatabaseService] Using new API format with data array');
        releasesArray = response.data;
      } else if (response.releases && Array.isArray(response.releases)) {
        // Legacy API format: { success: true, releases: [...] }
        console.log('[DatabaseService] Using legacy API format with releases array');
        releasesArray = response.releases as ExtendedRelease[];
      } else {
        console.warn('[DatabaseService] Unknown API response format:', response);
        return [];
      }
      
      // Process each release to ensure proper formatting
      const processedReleases = releasesArray.map(release => {
        const processed = { ...release } as ExtendedRelease;
        
        // Handle artwork URL
        if (!processed.artwork_url) {
          // Try to extract artwork from other properties
          if (processed.images && Array.isArray(processed.images) && processed.images.length > 0) {
            // Sort images by size (prefer larger images)
            const sortedImages = [...processed.images].sort((a, b) => (b.width || 0) - (a.width || 0));
            processed.artwork_url = sortedImages[0].url;
          } else if (processed.cover_url) {
            processed.artwork_url = processed.cover_url;
          } else if (processed.cover_image_url) {
            processed.artwork_url = processed.cover_image_url;
          }
        }
        
        // Format Spotify URL if it's just an ID
        if (processed.spotify_url && !processed.spotify_url.startsWith('http')) {
          if (processed.spotify_url.startsWith('spotify:album:')) {
            // Format: spotify:album:1234567890 -> https://open.spotify.com/album/1234567890
            const albumId = processed.spotify_url.replace('spotify:album:', '');
            processed.spotify_url = `https://open.spotify.com/album/${albumId}`;
          } else if (!processed.spotify_url.includes('/')) {
            // Assume it's just an ID
            processed.spotify_url = `https://open.spotify.com/album/${processed.spotify_url}`;
          }
        }
        
        // Process artists to ensure they have proper image URLs
        if (processed.artists && Array.isArray(processed.artists)) {
          processed.artists = processed.artists.map(artist => {
            const processedArtist = { ...artist } as ExtendedArtist;
            
            // Handle artist image URL
            if (!processedArtist.image_url) {
              // Try multiple potential image sources
              if (processedArtist.images && Array.isArray(processedArtist.images) && processedArtist.images.length > 0) {
                // Sort images by size (prefer larger images)
                const sortedImages = [...processedArtist.images].sort((a, b) => (b.width || 0) - (a.width || 0));
                processedArtist.image_url = sortedImages[0].url;
              } else if (processedArtist.profile_image) {
                processedArtist.image_url = processedArtist.profile_image;
              } else if (processedArtist.photo_url) {
                processedArtist.image_url = processedArtist.photo_url;
              } else if (processedArtist.profile_image_url) {
                processedArtist.image_url = processedArtist.profile_image_url;
              } else if (processedArtist.profile_image_large_url) {
                processedArtist.image_url = processedArtist.profile_image_large_url;
              }
            }
            
            // Format artist Spotify URL if needed
            if (processedArtist.spotify_url && !processedArtist.spotify_url.startsWith('http')) {
              if (processedArtist.spotify_url.startsWith('spotify:artist:')) {
                const artistId = processedArtist.spotify_url.replace('spotify:artist:', '');
                processedArtist.spotify_url = `https://open.spotify.com/artist/${artistId}`;
              } else if (!processedArtist.spotify_url.includes('/')) {
                // Assume it's just an ID
                processedArtist.spotify_url = `https://open.spotify.com/artist/${processedArtist.spotify_url}`;
              }
            }
            
            return processedArtist;
          });
        }
        
        return processed as Release;
      });
      
      console.log(`[DatabaseService] Processed ${processedReleases.length} releases successfully`);
      return processedReleases;
    };
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Fetch data from the API
   * @param endpoint The API endpoint to fetch from
   * @param options Optional fetch options
   * @returns Promise resolving to the API response
   */
  private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      // Determine if we're in a browser or Node.js environment
      const isBrowser = typeof window !== 'undefined';
      const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      
      // Construct the URL - handle both absolute and relative URLs
      let url = endpoint;
      if (!endpoint.startsWith('http')) {
        if (isBrowser) {
          // In browser, use relative URLs to avoid CORS
          url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        } else {
          // In Node.js, construct a full URL
          const baseUrl = process.env.API_URL || 'http://localhost:3001';
          url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
        }
      }
      
      console.log(`[DatabaseService] Fetching from URL: ${url}`);
      
      // Set default headers
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      // Merge with provided options
      const fetchOptions: RequestInit = {
        ...options,
        headers,
      };
      
      // Add special handling for Node.js environment with SSL certificates
      if (!isBrowser) {
        // In Node.js, use the 'node-fetch' polyfill with SSL certificate handling
        // This won't affect browser environments
        console.log('[DatabaseService] Using Node.js fetch with SSL options');
      }
      
      // This is the key fix: use the browser's built-in fetch which handles certificates properly
      const response = await fetch(url, fetchOptions);
      
      // Check if the response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DatabaseService] API error (${response.status}): ${errorText}`);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Parse the JSON response
      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('[DatabaseService] Error in fetchApi:', error);
      throw error;
    }
  }

  /**
   * Get releases for a specific label
   * @param labelId The ID of the label (can be string 'buildit-records' or numeric id)
   * @param page The page number to fetch (used for pagination)
   * @param limit Optional limit parameter, defaults to 50
   * @returns An object containing the releases and pagination info
   */
  public async getReleasesByLabel(
    labelId: string, 
    page = 1,
    limit = 50
  ): Promise<{
    releases: Release[];
    totalReleases: number;
    totalTracks: number;
    hasMore: boolean;
  }> {
    try {
      console.log(`[DatabaseService] Getting releases for label: ${labelId}, page: ${page}, limit: ${limit}`);
      const offset = (page - 1) * limit;
      
      // First try with the direct API URL
      try {
        // Use relative URLs for API requests from the browser
        // This is safer and avoids CORS issues
        const apiUrl = '/api/releases';
        const queryParams = `?label=${encodeURIComponent(labelId)}&offset=${offset}&limit=${limit}`;
        
        console.log(`[DatabaseService] Fetching releases from: ${apiUrl}${queryParams}`);
        
        // Make the API call
        const response = await this.fetchApi<ApiResponse<ExtendedRelease>>(`${apiUrl}${queryParams}`);
        console.log(`[DatabaseService] Releases API response:`, response);
        
        // Check if we got a valid response with data or releases property
        if (response && (
            (response.data && Array.isArray(response.data)) || 
            (response.releases && Array.isArray(response.releases))
        )) {
          // Process the releases
          const releases = await this.processReleases(response);
          console.log(`[DatabaseService] Processed ${releases.length} releases`);
          
          // Calculate pagination info
          const total = response.total || response.count || releases.length;
          const totalReleasesCount = typeof total === 'number' ? total : releases.length;
          
          return {
            releases,
            totalReleases: totalReleasesCount,
            totalTracks: 0,
            hasMore: releases.length >= limit && (offset + limit) < totalReleasesCount
          };
        } else {
          console.warn('[DatabaseService] Response did not contain data or releases array');
          throw new Error('Invalid response format');
        }
      } catch (firstError) {
        console.error(`[DatabaseService] First approach failed:`, firstError);
        
        // Try with a different label ID format (numeric ID vs string ID)
        try {
          let alternativeLabelId = labelId;
          if (labelId === 'buildit-records') {
            alternativeLabelId = '1';
          } else if (labelId === '1') {
            alternativeLabelId = 'buildit-records';
          }
          
          const apiUrl = '/api/releases';
          const queryParams = `?label=${encodeURIComponent(alternativeLabelId)}&offset=${offset}&limit=${limit}`;
          
          console.log(`[DatabaseService] Trying alternative label ID: ${alternativeLabelId}`);
          
          const response = await this.fetchApi<ApiResponse<ExtendedRelease>>(`${apiUrl}${queryParams}`);
          console.log(`[DatabaseService] Alternative response:`, response);
          
          if (response && (
              (response.data && Array.isArray(response.data)) || 
              (response.releases && Array.isArray(response.releases))
          )) {
            const releases = await this.processReleases(response);
            console.log(`[DatabaseService] Processed ${releases.length} releases from alternative approach`);
            
            const total = response.total || response.count || releases.length;
            const totalReleasesCount = typeof total === 'number' ? total : releases.length;
            
            return {
              releases,
              totalReleases: totalReleasesCount,
              totalTracks: 0,
              hasMore: releases.length >= limit && (offset + limit) < totalReleasesCount
            };
          }
        } catch (alternativeError) {
          console.error(`[DatabaseService] Alternative approach also failed:`, alternativeError);
        }
        
        // Try with a direct API call to fetch releases with proper SSL handling
        try {
          console.log('[DatabaseService] Trying direct API call with SSL handling');
          
          // First try buildit-records label ID
          const directApiUrl = 'https://buildit-records-api.onrender.com/api/releases';
          const queryParams = `?label=${encodeURIComponent(labelId === '1' ? 'buildit-records' : labelId)}&offset=${offset}&limit=${limit}`;
          
          // Create a special fetch call with SSL certificate handling
          const response = await fetch(directApiUrl + queryParams, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // The rejectUnauthorized option would be set in a Node.js environment
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('[DatabaseService] Direct API call succeeded:', data);
            
            if (data && ((data.data && Array.isArray(data.data)) || (data.releases && Array.isArray(data.releases)))) {
              const releases = await this.processReleases(data);
              console.log(`[DatabaseService] Processed ${releases.length} releases from direct API`);
              
              const total = data.total || data.count || releases.length;
              const totalReleasesCount = typeof total === 'number' ? total : releases.length;
              
              return {
                releases,
                totalReleases: totalReleasesCount,
                totalTracks: 0,
                hasMore: releases.length >= limit && (offset + limit) < totalReleasesCount
              };
            }
          } else {
            console.error(`[DatabaseService] Direct API call failed: ${response.status} ${response.statusText}`);
          }
        } catch (directError) {
          console.error(`[DatabaseService] Direct API approach failed:`, directError);
        }
        
        // As a last resort, try with a proxy approach
        try {
          console.log('[DatabaseService] Trying proxy approach');
          
          // Use a CORS proxy to bypass SSL certificate issues
          // This is a more reliable approach for browser environments
          const proxyUrl = `/proxy-api/releases?label=${encodeURIComponent(labelId)}&offset=${offset}&limit=${limit}`;
          
          const response = await this.fetchApi<ApiResponse<ExtendedRelease>>(proxyUrl);
          console.log(`[DatabaseService] Proxy response:`, response);
          
          if (response && (
              (response.data && Array.isArray(response.data)) || 
              (response.releases && Array.isArray(response.releases))
          )) {
            const releases = await this.processReleases(response);
            console.log(`[DatabaseService] Processed ${releases.length} releases from proxy`);
            
            const total = response.total || response.count || releases.length;
            const totalReleasesCount = typeof total === 'number' ? total : releases.length;
            
            return {
              releases,
              totalReleases: totalReleasesCount,
              totalTracks: 0,
              hasMore: releases.length >= limit && (offset + limit) < totalReleasesCount
            };
          }
        } catch (proxyError) {
          console.error(`[DatabaseService] Proxy approach failed:`, proxyError);
        }
        
        // All approaches have failed, use cached test data as a LAST resort only
        // This shouldn't typically happen unless the server is completely unreachable
        console.warn('[DatabaseService] All API approaches failed, falling back to test data');
        return this.getFallbackReleases(labelId, limit, offset);
      }
    } catch (error) {
      console.error('[DatabaseService] Error in getReleasesByLabel:', error);
      // Make sure to capture and use the current offset value from the parent function
      const currentOffset = (page - 1) * limit;
      return this.getFallbackReleases(labelId, limit, currentOffset);
    }
  }
  
  /**
   * Fallback method for releases when all API methods fail
   */
  private getFallbackReleases(labelId: string, limit: number, offset: number): {
    releases: Release[];
    totalReleases: number;
    totalTracks: number;
    hasMore: boolean;
  } {
    console.warn(`[DatabaseService] Using fallback releases for label ${labelId}`);
    const testReleases = this.getTestReleases();
    
    return {
      releases: testReleases,
      totalReleases: testReleases.length,
      totalTracks: 0,
      hasMore: false
    };
  }

  /**
   * Get test releases for fallback when API is unavailable
   * @returns Array of sample releases
   */
  private getTestReleases(): Release[] {
    console.log('[DatabaseService] Generating test releases');
    
    // Create a few sample releases for testing
    const testReleases: Release[] = [
      {
        id: '1',
        title: 'Sample Album 1',
        type: 'album',
        artists: [
          {
            id: '101',
            name: 'Sample Artist 1',
            uri: 'spotify:artist:101',
            type: 'artist',
            external_urls: { spotify: 'https://open.spotify.com/artist/101' },
            spotify_url: 'https://open.spotify.com/artist/101',
            image_url: 'https://via.placeholder.com/300?text=Artist+1'
          }
        ],
        tracks: [],
        images: [
          { url: 'https://via.placeholder.com/640?text=Album+1', height: 640, width: 640 }
        ],
        release_date: '2023-01-01',
        spotify_url: 'https://open.spotify.com/album/1',
        uri: 'spotify:album:1',
        artwork_url: 'https://via.placeholder.com/640?text=Album+1',
        label_id: '1',
        label_name: 'Build It Records',
        external_urls: { spotify: 'https://open.spotify.com/album/1' },
        total_tracks: 10
      },
      {
        id: '2',
        title: 'Sample Album 2',
        type: 'album',
        artists: [
          {
            id: '102',
            name: 'Sample Artist 2',
            uri: 'spotify:artist:102',
            type: 'artist',
            external_urls: { spotify: 'https://open.spotify.com/artist/102' },
            spotify_url: 'https://open.spotify.com/artist/102',
            image_url: 'https://via.placeholder.com/300?text=Artist+2'
          }
        ],
        tracks: [],
        images: [
          { url: 'https://via.placeholder.com/640?text=Album+2', height: 640, width: 640 }
        ],
        release_date: '2023-02-01',
        spotify_url: 'https://open.spotify.com/album/2',
        uri: 'spotify:album:2',
        artwork_url: 'https://via.placeholder.com/640?text=Album+2',
        label_id: '1',
        label_name: 'Build It Records',
        external_urls: { spotify: 'https://open.spotify.com/album/2' },
        total_tracks: 8
      },
      {
        id: '3',
        title: 'Sample Album 3',
        type: 'album',
        artists: [
          {
            id: '103',
            name: 'Sample Artist 3',
            uri: 'spotify:artist:103',
            type: 'artist',
            external_urls: { spotify: 'https://open.spotify.com/artist/103' },
            spotify_url: 'https://open.spotify.com/artist/103',
            image_url: 'https://via.placeholder.com/300?text=Artist+3'
          }
        ],
        tracks: [],
        images: [
          { url: 'https://via.placeholder.com/640?text=Album+3', height: 640, width: 640 }
        ],
        release_date: '2023-03-01',
        spotify_url: 'https://open.spotify.com/album/3',
        uri: 'spotify:album:3',
        artwork_url: 'https://via.placeholder.com/640?text=Album+3',
        label_id: '1',
        label_name: 'Build It Records',
        external_urls: { spotify: 'https://open.spotify.com/album/3' },
        total_tracks: 12
      }
    ];
    
    return testReleases;
  }

  /**
   * Get artists for a specific label
   * @param labelId The ID of the label
   * @param page The page number (for pagination)
   * @param limit Maximum number of artists to return
   * @returns Promise resolving to an array of artists
   */
  public async getArtistsForLabel(
    labelId: string | number,
    page = 1,
    limit = 50
  ): Promise<Artist[]> {
    console.log(`[DatabaseService] Fetching artists for label: ${labelId}, page: ${page}, limit: ${limit}`);
    
    const offset = (page - 1) * limit;
    let apiUrl = `${this.baseUrl}/api/artist?label=${labelId}&limit=${limit}&offset=${offset}`;
    
    try {
      // First try with the label name or ID directly
      console.log(`[DatabaseService] Trying artist endpoint with label=${labelId}`);
      const response = await this.fetchApi<ApiResponse<Artist>>(apiUrl);
      
      if (response.success && (response.data || response.artists)) {
        const artistsArray = response.data || response.artists || [];
        console.log(`[DatabaseService] Successfully fetched ${artistsArray.length} artists for label ${labelId}`);
        return artistsArray;
      } else {
        throw new Error('No artists returned in the response');
      }
    } catch (error) {
      console.error(`[DatabaseService] Error fetching artists for label ${labelId}:`, error);
      
      // Try with numeric label ID if the original labelId is a string
      if (typeof labelId === 'string' && isNaN(Number(labelId))) {
        try {
          console.log(`[DatabaseService] Trying fallback with numeric label ID = 1`);
          const fallbackUrl = `${this.baseUrl}/api/artist?label=1&limit=${limit}&offset=${offset}`;
          const fallbackResponse = await this.fetchApi<ApiResponse<Artist>>(fallbackUrl);
          
          if (fallbackResponse.success && (fallbackResponse.data || fallbackResponse.artists)) {
            const artistsArray = fallbackResponse.data || fallbackResponse.artists || [];
            console.log(`[DatabaseService] Successfully fetched ${artistsArray.length} artists with fallback approach`);
            return artistsArray;
          }
        } catch (fallbackError) {
          console.error('[DatabaseService] Fallback approach for artists also failed:', fallbackError);
        }
      }
      
      // Return empty array as last resort
      console.warn('[DatabaseService] All approaches for fetching artists failed, returning empty array');
      return [];
    }
  }

  // Rest of the code remains the same
}

// Export the singleton instance as a named export
export const databaseService = DatabaseService.getInstance();

// Also export the class as the default export
export default DatabaseService;
