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

// Define standard API response interface
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  error?: string;
  // Add properties from ApiResponseExtended that could also appear in ApiResponse
  releases?: any[];
  artists?: any[];
  tracks?: any[];
  total?: number;
  count?: number;
  details?: any;
}

// Response interface with optional fields for different API response formats
interface ApiResponseExtended<T> {
  success?: boolean;
  data?: T[];
  message?: string;
  error?: string;
  releases?: T[];
  artists?: T[];
  tracks?: T[];
  total?: number;
  offset?: number;
  limit?: number;
  count?: number;
}

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

// Base interface for shared artist properties that might be optional
interface ArtistBase {
  id: string;
  name: string;
  image_url?: string;
  spotify_url: string;
  profile_image?: string;
  photo_url?: string;
  profile_image_url?: string;
  profile_image_large_url?: string;
  bio?: string;
  genres?: string[];
  tags?: string[];
  // Make sure labels definition matches the one in Artist interface
  labels?: Array<{ id: string; name?: string }>;
  images?: Array<{ url: string; height?: number; width?: number }>;
  url?: string;
  height?: number;
  width?: number;
  label_id?: string | number; // Added for TypeScript compatibility
  labelId?: string | number;  // Added for TypeScript compatibility
}

// Extended Artist interface that adds optional properties to the Artist type
interface ExtendedArtist extends Artist, ArtistBase {}

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

    // Use our getBaseUrl method to determine the API base URL
    this.baseUrl = this.getBaseUrl();
    console.log('[DatabaseService] Using API base URL:', this.baseUrl);

    // Initialize processReleases method to handle multiple API response formats
    this.processReleases = async (response: ApiResponseExtended<ExtendedRelease>): Promise<Release[]> => {
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
      } else if (response.success && Array.isArray(response.data)) {
        // Real-server.js format: { success: true, message: "...", data: [...] }
        console.log('[DatabaseService] Using real-server.js format with success and data');
        releasesArray = response.data;
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
  public async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Clean up the endpoint to prevent URL issues
      // If endpoint is a full URL, extract just the path to avoid double URL prefixing
      let url;
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
      
      // Check if the endpoint is a full URL (starts with http)
      if (cleanEndpoint.startsWith('http')) {
        console.warn(`[DatabaseService] Received full URL as endpoint: ${cleanEndpoint}`);
        try {
          // Parse the URL and extract the path and query parameters
          const urlObj = new URL(cleanEndpoint);
          // Remove any /api prefix from the pathname
          const path = urlObj.pathname.replace(/^\/api\//, '');
          url = `${this.baseUrl}/${path}${urlObj.search}`;
        } catch (error) {
          console.error(`[DatabaseService] Error parsing URL: ${error}`);
          // If URL parsing fails, just use the baseUrl with the endpoint
          url = `${this.baseUrl}/${cleanEndpoint}`;
        }
      } else {
        // Normal endpoint processing
        // If both baseUrl and endpoint include /api, remove from one
        if (this.baseUrl.includes('/api') && cleanEndpoint.startsWith('api/')) {
          url = `${this.baseUrl}/${cleanEndpoint.substring(4)}`;
        } 
        // If baseUrl includes /api and endpoint doesn't start with api/
        else if (this.baseUrl.includes('/api')) {
          url = `${this.baseUrl}/${cleanEndpoint}`;
        }
        // If baseUrl doesn't include /api and endpoint starts with api/
        else if (cleanEndpoint.startsWith('api/')) {
          url = `${this.baseUrl}/${cleanEndpoint}`;
        }
        // If neither includes /api
        else {
          url = `${this.baseUrl}/api/${cleanEndpoint}`;
        }
      }
      
      console.log(`[DatabaseService] Making API request to: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        credentials: 'omit', // Changed from 'include' to fix CORS issues
      });
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data as ApiResponse<T>;
      } else {
        // Return a basic success response for non-JSON responses
        return {
          success: response.ok,
          data: null,
          message: response.ok ? 'Success' : `Error: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      console.error('🔴 Network Error for', endpoint, ':', error);
      // Return a failed response
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error.stack : String(error)
      };
    }
  }

  /**
   * Get the base URL for API calls based on current environment
   */
  private getBaseUrl(): string {
    // Check if we're in a Vercel deployment
    if (typeof window !== 'undefined' && 
        (window.location.hostname.includes('vercel.app') || 
         window.location.hostname.includes('builditrecords.com'))) {
      // Always use the Render API for Vercel deployments
      const renderApiUrl = 'https://buildit-records-api.onrender.com';
      console.log('Vercel deployment detected - using Render API URL:', renderApiUrl);
      return renderApiUrl;
    }
    
    // Try to use the current window origin in the browser to adapt to any port
    if (typeof window !== 'undefined') {
      // For local development using localhost:3001 directly
      if (window.location.hostname === 'localhost') {
        const localApiUrl = `http://localhost:3001`;
        console.log('[DatabaseService] Using local development API URL:', localApiUrl);
        return localApiUrl;
      }
    
      // Use window origin for other environments
      const origin = window.location.origin;
      console.log('[DatabaseService] Using window origin for API URL:', origin);
      return origin;
    }
    
    // Fallback to localhost for SSR
    return 'http://localhost:3001';
  }

  /**
   * Get releases for a specific label
   * @param labelId The ID of the label (can be string 'buildit-records' or numeric id)
   * @param page The page number to fetch (used for pagination)
   * @param limit Optional limit parameter, defaults to 50
   * @param releaseType Optional filter by release type: 'album', 'single', 'compilation'
   * @returns An object containing the releases and pagination info
   */
  public async getReleasesByLabel(
    labelId: string, 
    page = 1,
    limit = 50,
    releaseType?: 'album' | 'single' | 'compilation'
  ): Promise<{
    releases: Release[];
    totalReleases: number;
    totalTracks: number;
    hasMore: boolean;
  }> {
    console.log(`[DatabaseService] Getting releases for label: ${labelId}, page: ${page}, limit: ${limit}${releaseType ? ', type: ' + releaseType : ''}`);
    
    // Convert page + limit to offset/limit for API
    const offset = (page - 1) * limit;
    
    // Log that we're going to fetch from the API to help debug
    console.log(`[DatabaseService] Will fetch releases from API with base URL: ${this.baseUrl}`);
    
    try {
      // Construct the full API URL for releases - ensure /api prefix only appears once
      // If the baseUrl already contains /api, don't add it again
      const apiPath = this.baseUrl.includes('/api') ? '/releases' : '/api/releases';
      
      // Build query parameters
      let queryParams = `?label=${encodeURIComponent(labelId)}&offset=${offset}&limit=${limit}`;
      
      // Add release type if specified
      if (releaseType) {
        queryParams += `&type=${encodeURIComponent(releaseType)}`;
      }
      
      console.log(`[DatabaseService] Fetching releases from endpoint: ${apiPath}${queryParams}`);
      
      // Make the API call
      try {
        const response = await this.fetchApi<ApiResponseExtended<ExtendedRelease>>(`${apiPath}${queryParams}`);
        console.log(`[DatabaseService] Releases API response status:`, response?.success);
        
        // Check if we got a valid response with data or releases property
        if (response && (
            (response.data && Array.isArray(response.data)) || 
            (response.releases && Array.isArray(response.releases))
        )) {
          // Process the releases
          const releases = await this.processReleases(response);
          console.log(`[DatabaseService] Processed ${releases.length} releases`);
          
          // Calculate pagination info
          // Access the properties using non-null assertion since we've checked for their existence above
          const total = response.total! || response.count! || releases.length;
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
          } else if (labelId === 'buildit-deep') {
            alternativeLabelId = '2';
          } else if (labelId === '2') {
            alternativeLabelId = 'buildit-deep';
          } else if (labelId === 'buildit-tech') {
            alternativeLabelId = '3';
          } else if (labelId === '3') {
            alternativeLabelId = 'buildit-tech';
          }
          
          const queryParams = `?label=${encodeURIComponent(alternativeLabelId)}&offset=${offset}&limit=${limit}`;
          
          console.log(`[DatabaseService] Trying alternative label ID: ${alternativeLabelId}`);
          console.log(`[DatabaseService] Fetching from endpoint: ${apiPath}${queryParams}`);
          
          const response = await this.fetchApi<ApiResponseExtended<ExtendedRelease>>(`${apiPath}${queryParams}`);
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
          
          // Try direct API call as last option
          try {
            // First try buildit-records label ID
            const directApiEndpoint = 'releases';
            const queryParams = `?label=${encodeURIComponent(labelId === '1' ? 'buildit-records' : labelId)}&offset=${offset}&limit=${limit}`;
            
            console.log(`[DatabaseService] Trying direct API call: ${directApiEndpoint}${queryParams}`);
            
            // Use our fetchApi method for consistent URL handling and error handling
            const directResponse = await this.fetchApi<ApiResponseExtended<ExtendedRelease>>(`${directApiEndpoint}${queryParams}`);
            
            if (directResponse && ((directResponse.data && Array.isArray(directResponse.data)) || 
                                 (directResponse.releases && Array.isArray(directResponse.releases)))) {
              const releases = await this.processReleases(directResponse);
              const total = directResponse.total || directResponse.count || releases.length;
              const totalReleasesCount = typeof total === 'number' ? total : releases.length;
              
              return {
                releases,
                totalReleases: totalReleasesCount,
                totalTracks: 0,
                hasMore: releases.length >= limit && (offset + limit) < totalReleasesCount
              };
            }
          } catch (finalError) {
            console.error(`[DatabaseService] All API approaches failed:`, finalError);
          }
        }
      }
      
      // If all attempts failed, fall back to default data
      return this.getFallbackReleases(labelId, limit, offset);
    } catch (generalError) {
      console.error('[DatabaseService] General error in getReleasesByLabel:', generalError);
      return this.getFallbackReleases(labelId, limit, offset);
    }
  }
  
  /**
   * Fallback method for releases when all API methods fail
   * @private
   */
  private getFallbackReleases(labelId: string, limit: number, offset: number): {
    releases: Release[];
    totalReleases: number;
    totalTracks: number;
    hasMore: boolean;
  } {
    console.error(`[DatabaseService] API call failed - returning empty results for label ${labelId}`);
    
    // Return empty results instead of fallback data
    return {
      releases: [],
      totalReleases: 0,
      totalTracks: 0,
      hasMore: false
    };
  }

  /**
   * Get test releases for fallback when API is unavailable
   * @returns Array of sample releases
   */
  private getTestReleases(): Release[] {
    console.error('[DatabaseService] API call failed - using fallback release data');
    // Return all releases from the fallback data
    return [];
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
    try {
      const labelQuery = typeof labelId === 'number' ? `label=${labelId}` : `label=${labelId}`;
      const offset = (page - 1) * limit;
      
      console.log(`[DatabaseService] Fetching artists for label ${labelId}, page ${page}, limit ${limit}`);
      
      // Primary approach: Try the structure /api/artists?label=1
      console.log(`[DatabaseService] Primary approach: Using new API endpoint`);
      const primaryApiUrl = `api/artists?${labelQuery}&limit=${limit}&offset=${offset}&sort=name`;
      console.log(`[DatabaseService] Fetching from: ${primaryApiUrl}`);
      
      // Make the API call with the label ID
      const primaryResponse = await this.fetchApi<ApiResponseExtended<Artist>>(primaryApiUrl);
      console.log(`[DatabaseService] Primary API response:`, primaryResponse);
      
      // Extract artists from response in various formats
      let artists: Artist[] = [];
      
      if (primaryResponse?.success) {
        if (primaryResponse.data && Array.isArray(primaryResponse.data)) {
          artists = primaryResponse.data;
        } else if (primaryResponse.artists && Array.isArray(primaryResponse.artists)) {
          artists = primaryResponse.artists;
        }
        
        if (artists.length > 0) {
          console.log(`[DatabaseService] Found ${artists.length} artists from primary approach`);
          return this.processArtists(artists);
        }
      }

      // Secondary approach: Try with the label name (buildit-records instead of ID)
      console.log(`[DatabaseService] Secondary approach: Trying alternative API format`);
      const secondaryLabelQuery = labelId === 1 || labelId === '1' ? 'buildit-records' : labelId;
      const secondaryApiUrl = `artists?label=${secondaryLabelQuery}&limit=${limit}&offset=${offset}&sort=name`;
      console.log(`[DatabaseService] Fetching from: ${secondaryApiUrl}`);
      
      const secondaryResponse = await this.fetchApi<ApiResponseExtended<Artist>>(secondaryApiUrl);
      console.log(`[DatabaseService] Secondary API response:`, secondaryResponse);
      
      if (secondaryResponse?.success) {
        if (secondaryResponse.data && Array.isArray(secondaryResponse.data)) {
          artists = secondaryResponse.data;
        } else if (secondaryResponse.artists && Array.isArray(secondaryResponse.artists)) {
          artists = secondaryResponse.artists;
        }
        
        if (artists.length > 0) {
          console.log(`[DatabaseService] Found ${artists.length} artists from secondary approach`);
          return this.processArtists(artists);
        }
      }
      
      // Last resort: Fetch all artists and filter by label on client side
      console.log(`[DatabaseService] Last resort approach: Fetching all artists and filtering client-side`);
      const allArtistsUrl = `artists?limit=1000&sort=name`;
      console.log(`[DatabaseService] Fetching from: ${allArtistsUrl}`);
      
      const allArtistsResponse = await this.fetchApi<ApiResponseExtended<Artist>>(allArtistsUrl);
      console.log(`[DatabaseService] Last resort API response:`, allArtistsResponse);
      
      let allArtists: Artist[] = [];
      if (allArtistsResponse?.success) {
        if (allArtistsResponse.data && Array.isArray(allArtistsResponse.data)) {
          allArtists = allArtistsResponse.data;
        } else if (allArtistsResponse.artists && Array.isArray(allArtistsResponse.artists)) {
          allArtists = allArtistsResponse.artists;
        }
        
        // Filter artists by the label ID
        if (allArtists.length > 0) {
          // Convert labelId to number if it's a string to match potential numeric IDs in the data
          const numericLabelId = typeof labelId === 'string' ? 
            (labelId === 'buildit-records' ? 1 : parseInt(labelId, 10)) : 
            labelId;
          
          const filteredArtists = allArtists.filter((artist: Artist) => {
            // Check various label properties that might exist
            const artistLabelId = artist.labelId || artist.label_id;
            if (artistLabelId) {
              // Convert to number to match safely
              const artistNumericLabelId = typeof artistLabelId === 'string' ? 
                parseInt(artistLabelId, 10) : artistLabelId;
                
              return artistNumericLabelId === numericLabelId;
            }
            
            // Check if it has a labels array
            if (artist.labels && Array.isArray(artist.labels)) {
              return artist.labels.some(label => {
                const labelNumericId = typeof label.id === 'string' ? 
                  parseInt(label.id, 10) : label.id;
                return labelNumericId === numericLabelId;
              });
            }
            
            return false;
          });
          
          if (filteredArtists.length > 0) {
            console.log(`[DatabaseService] Found ${filteredArtists.length} artists from all artists (filtered from ${allArtists.length} total)`);
            return this.processArtists(filteredArtists);
          }
        }
      }
      
      console.log(`[DatabaseService] All API approaches failed, returning empty array`);
      return [];
    } catch (error) {
      console.error('[DatabaseService] Error fetching artists for label:', error);
      return this.getTestArtists();
    }
  }
  
  /**
   * Process artists to ensure they have all required properties
   * @param artists Array of artists to process
   * @returns Processed artists with all required properties
   */
  private processArtists(artists: any[]): Artist[] {
    return artists.map(artist => {
      // Make a copy of the artist object to avoid modifying the original
      const processedArtist = { ...artist } as any;

      // Ensure required fields exist with default values if needed
      processedArtist.uri = processedArtist.uri || `spotify:artist:${processedArtist.id}`;
      processedArtist.type = processedArtist.type || 'artist';
      processedArtist.external_urls = processedArtist.external_urls || { 
        spotify: processedArtist.spotify_url || `https://open.spotify.com/artist/${processedArtist.id}` 
      };
      
      // Handle image URL - ensure at least one image URL is set
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
        } else {
          // Use a default placeholder image if nothing else is available
          processedArtist.image_url = 'https://via.placeholder.com/500?text=Artist+Image';
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
      
      return processedArtist as Artist;
    });
  }
  
  /**
   * Get test artists for fallback when API is unavailable
   * @returns Empty array instead of test artists
   */
  private getTestArtists(): Artist[] {
    console.error('[DatabaseService] API call failed - returning empty artist array');
    
    // Return empty array instead of fallback data
    return [];
  }

  /**
   * Get releases for a specific label by ID
   * This is an alias for getReleasesByLabel to maintain compatibility with the AdminDashboard
   * @param labelId The ID of the label
   * @param page Optional page number for pagination
   * @param limit Optional limit parameter
   * @returns An object containing the releases and pagination info
   */
  async getReleasesByLabelId(
    labelId: string | RecordLabelId, 
    page = 1,
    limit = 50
  ): Promise<{
    releases: Release[];
    totalReleases: number;
    totalTracks: number;
    hasMore?: boolean;
  }> {
    console.log(`[DatabaseService] getReleasesByLabelId called with labelId: ${labelId}`);
    return this.getReleasesByLabel(labelId, page, limit);
  }
  
  /**
   * Get tracks for a specific label
   * @param labelId The ID of the label
   * @param sortBy Optional field to sort by (created_at, title, etc.)
   * @param page Optional page number for pagination
   * @param limit Optional limit parameter
   * @returns Promise resolving to an array of tracks
   */
  async getTracksByLabel(
    labelId: string | RecordLabelId,
    sortBy = 'created_at',
    page = 1,
    limit = 50
  ): Promise<{
    tracks: Track[];
    totalTracks?: number;
  }> {
    try {
      console.log(`[DatabaseService] Getting tracks for label ${labelId}, sorted by ${sortBy}`);
      
      const offset = (page - 1) * limit;
      // Use the same URL construction logic to avoid /api/api issues
      const apiPath = this.baseUrl.includes('/api') ? '/tracks' : '/api/tracks';
      const queryParams = `?label=${encodeURIComponent(labelId)}&sort=${sortBy}&offset=${offset}&limit=${limit}`;
      
      console.log(`[DatabaseService] Fetching tracks from: ${apiPath}${queryParams}`);
      
      const response = await this.fetchApi<ApiResponse<Track>>(`${apiPath}${queryParams}`);
      console.log('[DatabaseService] Tracks response:', response);
      
      // Extract tracks array and ensure it's properly typed
      let tracksArray: Track[] = [];
      if (response.data && Array.isArray(response.data)) {
        tracksArray = response.data;
      } else if (response.tracks && Array.isArray(response.tracks)) {
        tracksArray = response.tracks;
      }
      
      console.log(`[DatabaseService] Successfully retrieved ${tracksArray.length} tracks`);
      
      return {
        tracks: tracksArray,
        totalTracks: response.total || tracksArray.length
      };
    } catch (error) {
      console.error('[DatabaseService] Error getting tracks:', error);
      
      // Return empty array on error
      return {
        tracks: [],
        totalTracks: 0
      };
    }
  }
  
  /**
   * Import tracks from Spotify for a specific label
   * @param labelId The ID of the label to import tracks for
   * @returns Import response with success status and details
   */
  async importTracksFromSpotify(
    labelId: string | RecordLabelId
  ): Promise<ImportResponse> {
    try {
      console.log(`[DatabaseService] Starting Spotify import for label: ${labelId}`);
      
      // Use the same URL construction logic to avoid /api/api issues
      const apiPath = this.baseUrl.includes('/api') ? '/admin/import-tracks' : '/api/admin/import-tracks';
      
      console.log(`[DatabaseService] Sending import request to: ${apiPath}`);
      
      const response = await this.fetchApi<ImportResponse>(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ labelId })
      });
      
      console.log('[DatabaseService] Import response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Import failed with unknown error');
      }
      
      return {
        success: true,
        message: response.message || 'Import successful',
        details: response.details || {
          totalTracksImported: 0,
          totalArtistsImported: 0,
          totalReleasesImported: 0
        }
      };
    } catch (error) {
      console.error('[DatabaseService] Error importing tracks:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import tracks'
      };
    }
  }

  /**
   * Get top releases for a specific label
   * @param labelId The ID of the label
   * @param limit Optional limit parameter, defaults to 10
   * @returns Promise resolving to an array of releases
   */
  public async getTopReleases(
    labelId: string | RecordLabelId,
    limit = 10
  ): Promise<Release[]> {
    try {
      console.log(`[DatabaseService] Getting top ${limit} releases for label ${labelId}`);
      
      // Use getReleasesByLabel method for consistency but request a higher limit
      // to ensure we have enough releases to sort and filter from
      const releaseResult = await this.getReleasesByLabel(labelId.toString(), 1, 50);
      
      if (!releaseResult.releases || releaseResult.releases.length === 0) {
        console.warn(`[DatabaseService] No releases found for label ${labelId}`);
        return [];
      }
      
      // Sort releases by popularity, release date, or other criteria
      // For now, we'll simply use the most recent releases as the "top" ones
      const sortedReleases = [...releaseResult.releases].sort((a, b) => {
        // First sort by release date (newest first)
        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
        
        if (dateB !== dateA) {
          return dateB - dateA; // Newer releases first
        }
        
        // If release dates are the same, sort by title
        return (a.title || '').localeCompare(b.title || '');
      });
      
      // Limit to the requested number of items
      const topReleases = sortedReleases.slice(0, limit);
      
      console.log(`[DatabaseService] Returning ${topReleases.length} top releases for label ${labelId}`);
      return topReleases;
    } catch (error) {
      console.error('[DatabaseService] Error getting top releases:', error);
      // Return empty array on error
      return [];
    }
  }
}

// Export the singleton instance as a named export
export const databaseService = DatabaseService.getInstance();

// Also export the class as the default export
export default DatabaseService;
