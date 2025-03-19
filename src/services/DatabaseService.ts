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

    // Use our getBaseUrl method to determine the API base URL
    this.baseUrl = this.getBaseUrl();
    console.log('[DatabaseService] Using API base URL:', this.baseUrl);

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
  private async fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const baseUrl = this.getBaseUrl();
      
      // Construct proper URL, preventing /api/api/ duplications
      let url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      if (!url.startsWith('/api') && !baseUrl.endsWith('/api')) {
        url = `/api${url}`;
      }
      
      const fullUrl = `${baseUrl}${url}`;
      console.log(`🌐 API Request: ${options.method || 'GET'} ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Log response status
      console.log(`🌐 API Response: ${response.status} ${response.statusText} for ${fullUrl}`);
      
      // Clone the response before reading it as json to avoid "body already read" errors
      const responseClone = response.clone();
      
      try {
        const data = await response.json();
        console.log('📦 API Response Data:', data);
        
        if (!response.ok) {
          const error = data.message || response.statusText;
          console.error('❌ API Error:', error);
          return { success: false, message: error, data: null };
        }
        
        return { success: true, data: data.data || data, message: data.message || 'Success' };
      } catch (jsonError) {
        // If we can't parse the response as JSON, try to get the text
        const textData = await responseClone.text();
        console.error('⚠️ Failed to parse JSON response:', textData, jsonError);
        return { 
          success: false, 
          message: `Failed to parse response: ${jsonError}`, 
          data: null 
        };
      }
    } catch (error: any) {
      console.error('🔴 API Request Failed:', error);
      return {
        success: false,
        message: error.message || 'Unknown error occurred',
        data: null,
      };
    }
  }

  /**
   * Get the base URL for API calls based on current environment
   */
  private getBaseUrl(): string {
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
      
      // Log that we're going to fetch from the API to help debug
      console.log(`[DatabaseService] Will fetch releases from API with base URL: ${this.baseUrl}`);
      
      try {
        // Construct the full API URL for releases - ensure /api prefix only appears once
        // If the baseUrl already contains /api, don't add it again
        const apiPath = this.baseUrl.includes('/api') ? '/releases' : '/api/releases';
        const apiUrl = `${this.baseUrl}${apiPath}`;
        const queryParams = `?label=${encodeURIComponent(labelId)}&offset=${offset}&limit=${limit}`;
        
        console.log(`[DatabaseService] Fetching releases from: ${apiUrl}${queryParams}`);
        
        // Make the API call
        const response = await this.fetchApi<ApiResponse<ExtendedRelease>>(`${apiUrl}${queryParams}`);
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
          } else if (labelId === 'buildit-deep') {
            alternativeLabelId = '2';
          } else if (labelId === '2') {
            alternativeLabelId = 'buildit-deep';
          } else if (labelId === 'buildit-tech') {
            alternativeLabelId = '3';
          } else if (labelId === '3') {
            alternativeLabelId = 'buildit-tech';
          }
          
          // Construct API URL with the same path handling logic
          const apiPath = this.baseUrl.includes('/api') ? '/releases' : '/api/releases';
          const apiUrl = `${this.baseUrl}${apiPath}`;
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
          const directApiUrl = 'https://buildit-records-api.onrender.com/releases';
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
        
        // All approaches have failed, return empty results
        console.warn('[DatabaseService] All API approaches failed, returning empty results');
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
      const offset = (page - 1) * limit;
      console.log(`[DatabaseService] Fetching artists for label ${labelId}, page ${page}, limit ${limit}`);
      
      // Normalize the labelId - handle both numeric and string formats
      const normalizedLabelId = String(labelId).toLowerCase();
      
      // Try multiple approaches to fetch artists, with fallbacks
      
      // First approach: Primary API endpoint
      try {
        console.log('[DatabaseService] Primary approach: Using new API endpoint');
        
        // Use the same URL construction logic to avoid /api/api issues
        const apiPath = this.baseUrl.includes('/api') ? '/artists' : '/api/artists';
        const apiUrl = `${this.baseUrl}${apiPath}`;
        const queryParams = `?label=${encodeURIComponent(String(labelId))}&limit=${limit}&offset=${offset}&sort=name`;
        console.log(`[DatabaseService] Fetching from: ${apiUrl}${queryParams}`);
        
        const primaryResponse = await this.fetchApi<ApiResponse<Artist>>(apiUrl + queryParams);
        console.log('[DatabaseService] Primary API response:', primaryResponse);
        
        if (primaryResponse.success && (primaryResponse.data || primaryResponse.artists)) {
          const allArtists = primaryResponse.data || primaryResponse.artists || [];
          
          // Filter the artists by the labelId if possible
          // This is a client-side fallback filter since the API filtering failed
          let filteredArtists = allArtists;
          
          if (allArtists.length > 0 && (allArtists[0] as ArtistBase).labels) {
            filteredArtists = allArtists.filter(artist => {
              // Check if the artist has the current label in their labels array
              const extendedArtist = artist as ArtistBase;
              if (!extendedArtist.labels) return false;
              
              const labelIdStr = String(labelId).toLowerCase();
              return extendedArtist.labels.some((label: { id: string; name?: string }) => 
                String(label.id).toLowerCase() === labelIdStr || 
                (label.name && label.name.toLowerCase() === labelIdStr)
              );
            });
          }
          
          console.log(`[DatabaseService] Primary approach returned ${filteredArtists.length} artists after filtering from ${allArtists.length} total`);
          
          // Sort artists alphabetically by name
          const sortedArtists = [...filteredArtists].sort((a, b) => 
            (a.name || '').localeCompare(b.name || '')
          );
          
          return this.processArtists(sortedArtists);
        }
      } catch (error) {
        console.error('[DatabaseService] Primary approach failed:', error);
      }
      
      // Second approach: Alternative format or fallback endpoint
      try {
        console.log('[DatabaseService] Secondary approach: Trying alternative API format');
        // Try using a different format for the labelId (numerical vs string)
        let alternativeFormat = '';
        
        // Handle different label formats properly - don't default to just label 1
        if (isNaN(Number(labelId))) {
          // If not a number, try label ID 1 or 2 based on name
          if (normalizedLabelId.includes('deep')) {
            alternativeFormat = '2'; // Build It Deep
          } else {
            alternativeFormat = '1'; // Build It Records default
          }
        } else {
          // If it's already a number, map it to the appropriate label name
          if (String(labelId) === '1') {
            alternativeFormat = 'buildit-records';
          } else if (String(labelId) === '2') {
            alternativeFormat = 'buildit-deep';
          } else {
            alternativeFormat = 'buildit-records'; // Default fallback
          }
        }
        
        const fallbackUrl = `${this.baseUrl}/artists?label=${encodeURIComponent(alternativeFormat)}&limit=${limit}&offset=${offset}&sort=name`;
        console.log(`[DatabaseService] Fetching from: ${fallbackUrl}`);
        
        const secondaryResponse = await this.fetchApi<ApiResponse<Artist>>(fallbackUrl);
        console.log('[DatabaseService] Secondary API response:', secondaryResponse);
        
        if (secondaryResponse.success && (secondaryResponse.data || secondaryResponse.artists)) {
          const artistsArray = secondaryResponse.data || secondaryResponse.artists || [];
          console.log(`[DatabaseService] Secondary approach returned ${artistsArray.length} artists`);
          
          // Sort artists alphabetically by name
          const sortedArtists = [...artistsArray].sort((a, b) => 
            (a.name || '').localeCompare(b.name || '')
          );
          
          return this.processArtists(sortedArtists);
        }
      } catch (error) {
        console.error('[DatabaseService] Secondary approach failed:', error);
      }
      
      // Last resort: Get all artists without filtering and filter client-side
      try {
        console.log('[DatabaseService] Last resort approach: Fetching all artists and filtering client-side');
        // Get all artists without filter
        const allArtistsUrl = `${this.baseUrl}/artists?limit=1000&sort=name`; // Increased limit to get more artists
        console.log(`[DatabaseService] Fetching from: ${allArtistsUrl}`);
        
        const lastResortResponse = await this.fetchApi<ApiResponse<Artist>>(allArtistsUrl);
        console.log('[DatabaseService] Last resort API response:', lastResortResponse);
        
        if (lastResortResponse.success && (lastResortResponse.data || lastResortResponse.artists)) {
          const allArtists = lastResortResponse.data || lastResortResponse.artists || [];
          
          // Filter the artists by the labelId if possible
          // This is a client-side fallback filter since the API filtering failed
          let filteredArtists = allArtists;
          
          // Improved filtering logic to handle artists with multiple labels
          if (allArtists.length > 0) {
            filteredArtists = allArtists.filter(artist => {
              // Check if the artist has the current label in their labels array
              const extendedArtist = artist as ArtistBase;
              
              // Handle artists with labels array
              if (extendedArtist.labels && Array.isArray(extendedArtist.labels)) {
                const labelIdStr = String(labelId).toLowerCase();
                return extendedArtist.labels.some((label: { id: string; name?: string }) => 
                  String(label.id).toLowerCase() === labelIdStr || 
                  (label.name && label.name.toLowerCase().includes(labelIdStr))
                );
              }
              
              // If artist has label_id property (direct property), check that
              if (extendedArtist.label_id) {
                return String(extendedArtist.label_id).toLowerCase() === String(labelId).toLowerCase();
              }
              
              // If artist has a labelId property, check that too
              if (extendedArtist.labelId) {
                return String(extendedArtist.labelId).toLowerCase() === String(labelId).toLowerCase();
              }
              
              // Last resort: check if label name is in the artist name or bio
              if (labelId === '2' || normalizedLabelId.includes('deep')) {
                return (
                  (extendedArtist.name && extendedArtist.name.toLowerCase().includes('deep')) || 
                  (extendedArtist.bio && extendedArtist.bio.toLowerCase().includes('build it deep'))
                );
              } else if (labelId === '1' || normalizedLabelId.includes('record')) {
                // Only match Build It Records if explicit mention and no Deep mention
                return (
                  ((extendedArtist.name && extendedArtist.name.toLowerCase().includes('records')) || 
                   (extendedArtist.bio && extendedArtist.bio.toLowerCase().includes('build it records'))) &&
                  !((extendedArtist.name && extendedArtist.name.toLowerCase().includes('deep')) || 
                    (extendedArtist.bio && extendedArtist.bio.toLowerCase().includes('build it deep')))
                );
              }
              
              return false;
            });
          }
          
          console.log(`[DatabaseService] Last resort approach returned ${filteredArtists.length} artists after filtering from ${allArtists.length} total`);
          
          // Sort artists alphabetically by name
          const sortedArtists = [...filteredArtists].sort((a, b) => 
            (a.name || '').localeCompare(b.name || '')
          );
          
          return this.processArtists(sortedArtists);
        }
      } catch (error) {
        console.error('[DatabaseService] Last resort approach failed:', error);
      }

      // If all else fails, return empty array
      console.log('[DatabaseService] All API approaches failed, returning empty array');
      return this.getTestArtists();
      
    } catch (error) {
      console.error('[DatabaseService] Error fetching artists:', error);
      // Return empty array as fallback
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
   * @returns An object containing the tracks
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
      const apiUrl = `${this.baseUrl}${apiPath}`;
      const queryParams = `?label=${encodeURIComponent(labelId)}&sort=${sortBy}&offset=${offset}&limit=${limit}`;
      
      console.log(`[DatabaseService] Fetching tracks from: ${apiUrl}${queryParams}`);
      
      const response = await this.fetchApi<ApiResponse<Track>>(`${apiUrl}${queryParams}`);
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
      const apiUrl = `${this.baseUrl}${apiPath}`;
      
      console.log(`[DatabaseService] Sending import request to: ${apiUrl}`);
      
      const response = await this.fetchApi<ImportResponse>(apiUrl, {
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
  async getTopReleases(
    labelId: string | RecordLabelId,
    limit = 10
  ): Promise<Release[]> {
    try {
      console.log(`[DatabaseService] Getting top releases for label ${labelId}, limit ${limit}`);
      
      // First, fetch releases from the label
      const releaseResult = await this.getReleasesByLabel(labelId, 1, 50);
      
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
