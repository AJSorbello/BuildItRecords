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
  user?: any;
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
  
  // Add cache for releases and artists
  private releaseCache: Map<string, { data: Release[], timestamp: number, meta: { hasMore: boolean, totalCount: number } }> = new Map();
  private artistReleasesCache: Map<string, { data: Release[], timestamp: number }> = new Map();
  private CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes cache expiry

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
  }

  /**
   * Process track data to extract remixer information
   * @param track The track to process
   * @returns The processed track with remixer information
   */
  private processTrackRemixInfo(track: any): any {
    // Skip if not a track or already processed
    if (!track || track.isRemixProcessed) return track;
    
    // Mark as processed to avoid reprocessing
    track.isRemixProcessed = true;
    
    // Check if this is a remix based on title
    const isRemix = track.title?.toLowerCase().includes('remix') || false;
    
    if (isRemix) {
      // Set the isRemix flag
      track.isRemix = true;
      
      // Enhanced regex pattern to match more remix formats
      // Match patterns like:
      // - (Artist Remix)
      // - (Artist X Remix)
      // - (Artist's Remix)
      // - (Artist remix)
      // - [Artist Remix]
      const remixerRegexPatterns = [
        /\(([^)]+)\s+remix\)/i,     // (Artist Remix)
        /\[([^\]]+)\s+remix\]/i,    // [Artist Remix]
        /\(([^)]+)\s+rmx\)/i,       // (Artist Rmx)
        /\-\s*([^-]+)\s+remix/i,    // - Artist Remix
        /\"([^"]+)\s+remix\"/i      // "Artist Remix"
      ];
      
      let remixerName = null;
      
      // Try each pattern until we find a match
      for (const pattern of remixerRegexPatterns) {
        const match = track.title.match(pattern);
        if (match && match[1]) {
          remixerName = match[1].trim();
          console.log(`[DatabaseService] Extracted remixer name "${remixerName}" from track "${track.title}" using regex`);
          break;
        }
      }
      
      // Special handling for formats like "No More (Alfonso Tan Remix)"
      // These are common artist remix formats that need special attention
      if (!remixerName) {
        // Common remixer names we might want to detect
        const commonRemixers = ['Alfonso Tan', 'BELLO', 'Kwal'];
        
        for (const remixer of commonRemixers) {
          if (track.title.toLowerCase().includes(remixer.toLowerCase()) && 
              track.title.toLowerCase().includes('remix')) {
            remixerName = remixer;
            console.log(`[DatabaseService] Found common remixer "${remixerName}" in track "${track.title}"`);
            break;
          }
        }
      }
      
      // If we have a remixer name, try to find matching artist
      if (remixerName) {
        if (track.artists && Array.isArray(track.artists) && track.artists.length > 0) {
          // Try to find artist whose name matches the remixer name
          const remixer = track.artists.find((artist: any) => 
            artist.name.toLowerCase().includes(remixerName!.toLowerCase()) || 
            remixerName!.toLowerCase().includes(artist.name.toLowerCase())
          );
          
          if (remixer) {
            // Set the remixer
            track.remixer = remixer;
            console.log(`[DatabaseService] Found remixer for track "${track.title}": ${remixer.name}`);
          } else {
            // Create a synthetic remixer object when we know the name but don't have artist data
            // This helps with dynamically identifying remixers from track titles
            const remixerId = remixerName.toLowerCase().replace(/\s+/g, '-') + '-id';
            track.remixer = {
              id: remixerId,
              name: remixerName,
              role: 'remixer',
              image_url: '/images/placeholder-artist.jpg' // Add placeholder image URL
            };
            console.log(`[DatabaseService] Created synthetic remixer for track "${track.title}": ${remixerName}`);
          }
        } else {
          // Handle case where we have remixer name but no artists array
          const remixerId = remixerName.toLowerCase().replace(/\s+/g, '-') + '-id';
          track.remixer = {
            id: remixerId,
            name: remixerName,
            role: 'remixer',
            image_url: '/images/placeholder-artist.jpg' // Add placeholder image URL
          };
          console.log(`[DatabaseService] Created synthetic remixer with no artists for track "${track.title}": ${remixerName}`);
        }
      }
      
      // If we still don't have a remixer but have multiple artists, use the last one as remixer
      if (!track.remixer && track.artists && track.artists.length > 1) {
        track.remixer = track.artists[track.artists.length - 1];
        console.log(`[DatabaseService] Using last artist as remixer for "${track.title}": ${track.remixer.name}`);
      }
    }
    
    return track;
  }

  /**
   * Process releases data from API response
   * @param response API response containing releases data
   * @returns Array of processed Release objects
   */
  async processReleases(response: any): Promise<Release[]> {
    if (!response || !response.success) {
      console.error('[DatabaseService] Invalid response in processReleases:', response);
      return [];
    }

    const releases = response.data || [];
    
    if (!Array.isArray(releases)) {
      console.error('[DatabaseService] Expected array of releases but got:', typeof releases);
      return [];
    }

    return releases.map((release: any) => {
      // Process each track to extract remixer information
      if (release.tracks && Array.isArray(release.tracks)) {
        release.tracks = release.tracks.map((track: any) => this.processTrackRemixInfo(track));
      }
      
      // Also process album tracks if present
      if (release.album && release.album.tracks && Array.isArray(release.album.tracks)) {
        release.album.tracks = release.album.tracks.map((track: any) => this.processTrackRemixInfo(track));
      }
      
      return {
        ...release,
        // Ensure we have an artists array
        artists: Array.isArray(release.artists) ? release.artists : [],
        label: release.label || null // Fix TypeScript error related to release.label possibly being null
      };
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Get the base URL for API calls based on current environment
   */
  public getBaseUrl(): string {
    // Always use the Render API URL for consistency
    const renderApiUrl = 'https://builditrecords.onrender.com/api';
    console.log('[DatabaseService] Using Render API URL:', renderApiUrl);
    return renderApiUrl;
  }

  /**
   * Format any URL properly
   */
  private formatUrl(baseUrl: string, endpoint: string): string {
    // Clean up the endpoint to prevent URL issues
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Add 'http://' prefix if missing
    const hasProtocol = cleanBase.startsWith('http://') || cleanBase.startsWith('https://');
    const baseWithProtocol = hasProtocol ? cleanBase : `http://${cleanBase}`;
    
    // If endpoint is a full URL, return it
    if (cleanEndpoint.startsWith('http://') || cleanEndpoint.startsWith('https://')) {
      return cleanEndpoint;
    }
    
    // If cleanBase already includes '/api' and endpoint also starts with 'api/'
    if (cleanBase.endsWith('/api') && cleanEndpoint.startsWith('api/')) {
      return `${baseWithProtocol}/${cleanEndpoint.substring(4)}`;
    }
    
    // If cleanBase ends with '/api' and endpoint doesn't start with 'api/'
    if (cleanBase.endsWith('/api')) {
      return `${baseWithProtocol}/${cleanEndpoint}`;
    }
    
    // If endpoint starts with 'api/' and base doesn't end with '/api'
    if (cleanEndpoint.startsWith('api/')) {
      return `${baseWithProtocol}/${cleanEndpoint}`;
    }
    
    // If neither base ends with '/api' nor endpoint starts with 'api/'
    return `${baseWithProtocol}/api/${cleanEndpoint}`;
  }

  /**
   * Fetch data from the API
   * @param endpoint The API endpoint to fetch from
   * @param options Optional fetch options
   * @returns Promise resolving to the API response
   */
  public async fetchApi(endpoint: string, options?: RequestInit): Promise<any> {
    try {
      const apiUrl = this.formatUrl(this.baseUrl, endpoint);
      console.log('[DatabaseService] Making API request to:', apiUrl);
      
      // Set default headers for all requests
      const fetchOptions: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(options?.headers || {})
        },
        // Specify CORS mode explicitly
        mode: 'cors',
        // Don't include credentials to avoid CORS issues
        credentials: 'omit'
      };
      
      // Try direct API request first
      try {
        const response = await fetch(apiUrl, fetchOptions);
        return await response.json();
      } catch (error) {
        console.log('[DatabaseService] Direct API request failed, trying CORS proxy', error);
        
        // Use the cors-anywhere proxy on Render - which we control
        const proxyUrl = 'https://builditrecords.onrender.com/api/proxy?url=' + encodeURIComponent(apiUrl);
        console.log('[DatabaseService] Using server-side proxy:', proxyUrl);
        
        const proxyResponse = await fetch(proxyUrl, {
          ...fetchOptions,
          // Don't include credentials when going through a proxy
          credentials: 'omit'
        });
        
        return await proxyResponse.json();
      }
    } catch (error) {
      console.error('[DatabaseService] All fetch attempts failed:', error);
      throw error;
    }
  }

  /**
   * Get releases for a specific label
   * @param labelId The ID of the label (can be string 'buildit-records' or numeric id)
   * @param page The page number to fetch (used for pagination)
   * @param limit Optional limit parameter, defaults to 50
   * @param releaseType Optional filter by release type: 'album', 'single', 'compilation'
   * @returns An array of releases for the specified label
   */
  public async getReleasesByLabel(
    labelId: string, 
    page = 1,
    limit = 10,
    releaseType?: 'album' | 'single' | 'compilation'
  ): Promise<Release[]> {
    console.log(`[DatabaseService] Getting releases for label: ${labelId}, page: ${page}, limit: ${limit}, type: ${releaseType || 'all'}`);
    
    try {
      // Calculate offset from page number
      const offset = (page - 1) * limit;
      
      // Check cache first
      const cacheKey = `${labelId}-${page}-${limit}-${releaseType}`;
      const cachedReleases = this.releaseCache.get(cacheKey);
      if (cachedReleases && cachedReleases.timestamp > Date.now() - this.CACHE_EXPIRY) {
        console.log(`[DatabaseService] Returning cached releases for label ${labelId}, page ${page}`);
        return cachedReleases.data;
      }
      
      // Log that we're going to fetch from the API to help debug
      console.log(`[DatabaseService] Will fetch releases from API with base URL: ${this.baseUrl}`);
      
      // Translation layer for backend API's swapped label IDs
      let apiLabelId = labelId;
      
      // Use direct 1:1 mapping for label IDs without any swapping
      if (typeof labelId === 'string') {
        if (labelId === 'buildit-tech') {
          apiLabelId = '2'; // BUILD IT TECH ID = 2
        } else if (labelId === 'buildit-deep') {
          apiLabelId = '3'; // BUILD IT DEEP ID = 3
        } else if (labelId === 'buildit-records') {
          apiLabelId = '1'; // BUILD IT RECORDS ID = 1
        }
      } else if (typeof labelId === 'number' || !isNaN(parseInt(labelId, 10))) {
        // For numeric IDs, use them directly - no translation needed
        apiLabelId = String(labelId);
      }
      
      // Construct the full API URL for releases
      const apiPath = this.baseUrl.includes('/api') ? '/releases' : '/api/releases';
      
      // Build query parameters with include_tracks and include_artists to avoid separate API calls
      let queryParams = `?label=${encodeURIComponent(apiLabelId)}&offset=${offset}&limit=${limit}&include_tracks=true&include_artists=true&sort=date:desc`;
      
      // Add release type if specified
      if (releaseType) {
        queryParams += `&type=${encodeURIComponent(releaseType)}`;
      }
      
      console.log(`[DatabaseService] Fetching releases from endpoint: ${apiPath}${queryParams}`);
      
      // Make the API call
      try {
        const response = await this.fetchApi(`${apiPath}${queryParams}`);
        console.log(`[DatabaseService] Releases API response status:`, response?.success);
        
        // Check if we got a valid response with data or releases property
        if (response && (
            (response.data && Array.isArray(response.data)) || 
            (response.releases && Array.isArray(response.releases))
        )) {
          // Extract releases array from response
          const releasesData = response.data || response.releases || [];
          
          // Track total count if available in the response for better pagination handling
          const totalCount = response.total || releasesData.length;
          const hasMore = offset + releasesData.length < totalCount;
          
          // Process each release in parallel, but DO NOT make individual API calls
          const processedReleases = releasesData
            .filter(release => release && release.id)
            .map(release => {
              // Do basic processing here, no additional API calls
              const processedRelease = { ...release } as any;
              
              // Ensure consistent image URL field names
              if (release.cover_url && !release.artwork_url) {
                processedRelease.artwork_url = release.cover_url;
              } else if (release.cover_image_url && !release.artwork_url) {
                processedRelease.artwork_url = release.cover_image_url;
              } else if (release.images && release.images.length > 0 && !release.artwork_url) {
                processedRelease.artwork_url = release.images[0].url;
              }
              
              // Process remix information if there are tracks
              if (processedRelease.tracks && Array.isArray(processedRelease.tracks)) {
                processedRelease.tracks = processedRelease.tracks.map(track => {
                  return this.processTrackRemixInfo(track);
                });
              }
              
              // Store pagination metadata on each release
              processedRelease._meta = {
                page,
                hasMore,
                totalCount
              };
              
              return processedRelease;
            });
          
          console.log(`[DatabaseService] Processed ${processedReleases.length} releases for page ${page}/${Math.ceil(totalCount/limit)}`);
          
          // If we got fewer items than requested and this isn't the first page,
          // we've reached the end of available releases
          if (processedReleases.length < limit && page > 1) {
            console.log(`[DatabaseService] Reached end of releases at page ${page} (got ${processedReleases.length}, expected ${limit})`);
          }
          
          // Cache the processed releases
          this.releaseCache.set(cacheKey, { 
            data: processedReleases, 
            timestamp: Date.now(),
            meta: {
              hasMore,
              totalCount
            }
          });
          
          return processedReleases;
        } else {
          console.error('[DatabaseService] Invalid API response format:', response);
          throw new DatabaseError('Failed to fetch releases. Invalid response format.');
        }
      } catch (error) {
        console.error('[DatabaseService] Error fetching releases:', error);
        throw new DatabaseError('Failed to fetch releases');
      }
    } catch (error) {
      console.error('[DatabaseService] Error in getReleasesByLabel:', error);
      throw new DatabaseError('Failed to fetch releases');
    }
  }
  
  /**
   * Fallback method for releases when all API methods fail
   * @private
   */
  private getFallbackReleases(labelId: string, limit: number, offset: number): Release[] {
    console.log(`[DatabaseService] Using fallback releases for label: ${labelId}, limit: ${limit}, offset: ${offset}`);
    
    // Return empty results instead of fallback data
    return [];
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
    console.log(`[DatabaseService] Fetching artists for label ${labelId}, page ${page}, limit ${limit}`);
    const offset = (page - 1) * limit;
    
    try {
      // Convert numeric label ID to string format if needed for consistent API calls
      let stringLabelId: string;
      if (typeof labelId === 'number' || !isNaN(Number(labelId))) {
        // Convert numeric ID to string format
        const numericId = typeof labelId === 'number' ? labelId : Number(labelId);
        if (numericId === 1) {
          stringLabelId = 'buildit-records';
        } else if (numericId === 2) {
          stringLabelId = 'buildit-tech';
        } else if (numericId === 3) {
          stringLabelId = 'buildit-deep';
        } else {
          stringLabelId = String(labelId);
        }
        console.log(`[DatabaseService] Converted numeric label ID ${labelId} to string format: ${stringLabelId}`);
      } else {
        stringLabelId = String(labelId);
      }
      
      // Direct 1:1 mapping between frontend and backend label IDs
      let apiLabelId = stringLabelId;
      
      if (stringLabelId === 'buildit-tech') {
        apiLabelId = '2'; // BUILD IT TECH ID = 2
        console.log(`[DatabaseService] Using label ID 2 for buildit-tech`);
      } else if (stringLabelId === 'buildit-deep') {
        apiLabelId = '3'; // BUILD IT DEEP ID = 3
        console.log(`[DatabaseService] Using label ID 3 for buildit-deep`);
      } else if (stringLabelId === 'buildit-records') {
        apiLabelId = '1'; // BUILD IT RECORDS ID = 1
        console.log(`[DatabaseService] Using label ID 1 for buildit-records`);
      } else if (!isNaN(parseInt(stringLabelId, 10))) {
        // For numeric IDs, use them directly
        apiLabelId = stringLabelId;
        console.log(`[DatabaseService] Using numeric label ID directly: ${apiLabelId}`);
      }
      
      // First, fetch all releases for this label to determine which artists have actual releases
      console.log(`[DatabaseService] Fetching releases for label ${apiLabelId} to identify valid artists`);
      const releasesResponse = await this.getReleasesByLabel(apiLabelId, 1, 1000);
      const labelReleases = releasesResponse;
      
      // Extract all artist IDs from releases
      const artistIdsWithReleases = new Set<string>();
      const artistNamesWithIds = new Map<string, string>(); // For mapping names to IDs later
      
      labelReleases.forEach(release => {
        // 1. Check for main release artists
        if (release.artists && Array.isArray(release.artists)) {
          release.artists.forEach(artist => {
            if (artist && artist.id) {
              artistIdsWithReleases.add(artist.id);
              if (artist.name) {
                artistNamesWithIds.set(artist.name.toLowerCase(), artist.id);
              }
            }
          });
        }
        
        // 2. Check for artists on individual tracks (important for compilations)
        if (release.tracks && Array.isArray(release.tracks)) {
          release.tracks.forEach(track => {
            // Use any type to handle different track formats from APIs
            const trackItem = track as any;
            
            // Handle track artists
            if (trackItem.artists && Array.isArray(trackItem.artists)) {
              trackItem.artists.forEach(artist => {
                if (artist && artist.id) {
                  artistIdsWithReleases.add(artist.id);
                  if (artist.name) {
                    artistNamesWithIds.set(artist.name.toLowerCase(), artist.id);
                  }
                }
              });
            }
            
            // Handle remixers
            if (trackItem.remixer && trackItem.remixer.id) {
              artistIdsWithReleases.add(trackItem.remixer.id);
              if (trackItem.remixer.name) {
                artistNamesWithIds.set(trackItem.remixer.name.toLowerCase(), trackItem.remixer.id);
              }
            }
            
            // Check for remix info in track name if no explicit remixer info
            const trackName = trackItem.name || trackItem.title;
            if (trackName && typeof trackName === 'string' && 
                trackName.toLowerCase().includes('remix') && 
                (!trackItem.remixer || !trackItem.remixer.id)) {
              // Extract potential remixer name from track title
              const remixMatch = trackName.match(/\(([^)]+)\s+remix\)/i);
              if (remixMatch && remixMatch[1]) {
                const remixerName = remixMatch[1].trim().toLowerCase();
                // Check if we have an ID for this remixer name
                if (artistNamesWithIds.has(remixerName)) {
                  artistIdsWithReleases.add(artistNamesWithIds.get(remixerName)!);
                }
              }
            }
          });
        }
      });
      
      console.log(`[DatabaseService] Found ${artistIdsWithReleases.size} unique artists with releases on label ${apiLabelId}`);
      
      // Create a label query that uses the string format first
      const labelQuery = `label=${encodeURIComponent(apiLabelId)}`;
      
      console.log(`[DatabaseService] Primary approach: Using new API endpoint`);
      const primaryApiUrl = `api/artists?${labelQuery}&limit=${limit}&offset=${offset}&sort=name`;
      console.log(`[DatabaseService] Fetching from: ${primaryApiUrl}`);
      
      // Make the API call with the label ID
      const primaryResponse = await this.fetchApi(`${primaryApiUrl}`);
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
          // Filter and process artists
          return this.filterAndProcessArtists(artists, artistIdsWithReleases);
        }
      }

      // Secondary approach: Try with the label name (buildit-records instead of ID)
      console.log(`[DatabaseService] Secondary approach: Trying alternative API format`);
      const secondaryLabelQuery = labelId === 1 || labelId === '1' ? 'buildit-records' : labelId;
      const secondaryApiUrl = `artists?label=${secondaryLabelQuery}&limit=${limit}&offset=${offset}&sort=name`;
      console.log(`[DatabaseService] Fetching from: ${secondaryApiUrl}`);
      
      const secondaryResponse = await this.fetchApi(secondaryApiUrl);
      console.log(`[DatabaseService] Secondary API response:`, secondaryResponse);
      
      if (secondaryResponse?.success) {
        if (secondaryResponse.data && Array.isArray(secondaryResponse.data)) {
          artists = secondaryResponse.data;
        } else if (secondaryResponse.artists && Array.isArray(secondaryResponse.artists)) {
          artists = secondaryResponse.artists;
        }
        
        if (artists.length > 0) {
          console.log(`[DatabaseService] Found ${artists.length} artists from secondary approach`);
          // Filter and process artists
          return this.filterAndProcessArtists(artists, artistIdsWithReleases);
        }
      }
      
      // Last resort: Fetch all artists and filter by label on client side
      console.log(`[DatabaseService] Last resort approach: Fetching all artists and filtering client-side`);
      const allArtistsUrl = `artists?limit=1000&sort=name`;
      console.log(`[DatabaseService] Fetching from: ${allArtistsUrl}`);
      
      const allArtistsResponse = await this.fetchApi(allArtistsUrl);
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
            (labelId === 'buildit-records' ? 1 : 
             labelId === 'buildit-tech' ? 2 :
             labelId === 'buildit-deep' ? 3 :
             parseInt(labelId, 10)) : 
            labelId;
          
          console.log(`[DatabaseService] Filtering artists by numericLabelId: ${numericLabelId}`);
          
          const filteredArtists = allArtists.filter((artist: Artist) => {
            // First check if this artist has any releases on this label
            if (artist.id && artistIdsWithReleases.has(artist.id)) {
              return true;
            }
            
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
            // Filter and process artists
            return this.filterAndProcessArtists(filteredArtists, artistIdsWithReleases);
          }
        }
      }
      
      console.log(`[DatabaseService] All API approaches failed, returning empty array`);
      return [];
    } catch (error) {
      console.error('[DatabaseService] Error fetching artists for label:', error);
      return [];
    }
  }
  
  /**
   * Filter and process artists to ensure they are valid and have all required properties
   * @param artists Array of artists to process
   * @param artistIdsWithReleases Set of artist IDs that have releases on the specified label
   * @returns Processed and filtered artists with all required properties
   */
  private filterAndProcessArtists(artists: any[], artistIdsWithReleases: Set<string>): Artist[] {
    // Filter out entries that don't appear to be valid artists
    const validArtists = artists.filter(artist => {
      // Check if this is a valid artist entry
      if (!artist.name) return false;
      
      // Filter out entries that look like tracks or sample packs
      // These typically have patterns like "Name + Number" (e.g., "Bass X 8", "Beat Max 52")
      const samplePackPatterns = [
        /^(Bass|Beat|Beats|Beta|Big)\s+[A-Za-z]*\s*\d+$/,  // Bass X 8, Beat Max 52
        /^DJ\s+(Beats|Flow|Loop)\s+\d+$/,                  // DJ Beats master 0, DJ Flow 78
        /^[A-Za-z]+\s+\d+$/,                               // Any word followed by a number
        /^[A-Za-z]+\s+[A-Za-z]+\s+\d+$/                    // Any two words followed by a number
      ];
      
      // Check against all sample pack patterns
      for (const pattern of samplePackPatterns) {
        if (pattern.test(artist.name)) {
          console.log(`[DatabaseService] Filtering out sample pack: ${artist.name}`);
          return false;
        }
      }
      
      // If we have a list of artists with releases, prioritize those
      if (artistIdsWithReleases.size > 0) {
        // Check if this artist has any releases on this label
        const hasReleases = artist.id && artistIdsWithReleases.has(artist.id);
        if (!hasReleases) {
          console.log(`[DatabaseService] Filtering out artist without releases: ${artist.name}`);
          return false;
        }
      }
      
      return true;
    });
    
    console.log(`[DatabaseService] Filtered ${artists.length - validArtists.length} invalid entries out of ${artists.length} total`);
    
    return validArtists.map(artist => {
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
        } else if (processedArtist.releases && Array.isArray(processedArtist.releases) && processedArtist.releases.length > 0) {
          // Use the most recent release's cover art if available
          for (const release of processedArtist.releases) {
            if (release.artwork_url) {
              processedArtist.image_url = release.artwork_url;
              console.log(`[DatabaseService] Using release artwork for artist ${processedArtist.name}: ${release.artwork_url}`);
              break;
            } else if (release.cover_url) {
              processedArtist.image_url = release.cover_url;
              console.log(`[DatabaseService] Using release cover for artist ${processedArtist.name}: ${release.cover_url}`);
              break;
            } else if (release.cover_image_url) {
              processedArtist.image_url = release.cover_image_url;
              console.log(`[DatabaseService] Using release cover image for artist ${processedArtist.name}: ${release.cover_image_url}`);
              break;
            } else if (release.images && Array.isArray(release.images) && release.images.length > 0) {
              processedArtist.image_url = release.images[0].url;
              console.log(`[DatabaseService] Using release image for artist ${processedArtist.name}: ${release.images[0].url}`);
              break;
            }
          }
        } else {
          // Use a default placeholder image if nothing else is available
          processedArtist.image_url = '/images/placeholder-artist.jpg';
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
   * @returns An array of releases for the specified label
   */
  async getReleasesByLabelId(
    labelId: string | RecordLabelId, 
    page = 1,
    limit = 50
  ): Promise<Release[]> {
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
      
      const response = await this.fetchApi(`${apiPath}${queryParams}`);
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
      
      const response = await this.fetchApi(apiPath, {
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
   * Get top releases for a specific label, sorted by popularity
   * @param labelId The ID of the label to fetch top releases for
   * @returns Promise resolving to an array of top releases
   */
  async getTopReleases(labelId: string): Promise<Release[]> {
    console.log(`[DatabaseService] Fetching top releases for label: ${labelId}`);
    
    try {
      // Map label IDs to ensure compatibility with API
      const mappedLabelId = this.mapLabelId(labelId);
      console.log(`[DatabaseService] Mapped label ID from ${labelId} to ${mappedLabelId}`);
      
      // First try dedicated endpoint for actual top Spotify plays
      try {
        // This endpoint should return releases already sorted by actual Spotify play count
        const endpoint = `${this.baseUrl}/api/labels/${mappedLabelId}/top-spotify-plays?limit=10`;
        console.log(`[DatabaseService] Trying Spotify top plays endpoint: ${endpoint}`);
        
        const response = await this.fetchApi(endpoint);
        
        if (response && response.success && (response.data || response.releases)) {
          const topSpotifyReleases = await this.processReleases(response);
          
          if (topSpotifyReleases && topSpotifyReleases.length > 0) {
            console.log(`[DatabaseService] Successfully fetched ${topSpotifyReleases.length} top Spotify plays`);
            
            // Add popularity ranking to each release
            const rankedReleases = topSpotifyReleases.map((release, index) => {
              return {
                ...release,
                popularity_rank: index + 1,
                label: release.label || { id: labelId, name: this.getLabelName(labelId) }
              };
            });
            
            return rankedReleases;
          }
        }
      } catch (error) {
        console.error(`[DatabaseService] Error fetching from top Spotify plays endpoint:`, error);
      }
      
      // Try top releases endpoint which may have popularity data
      try {
        const endpoint = `${this.baseUrl}/api/labels/${mappedLabelId}/top-releases?limit=20`;
        console.log(`[DatabaseService] Trying dedicated top releases endpoint: ${endpoint}`);
        
        const response = await this.fetchApi(endpoint);
        
        if (response && response.success && (response.data || response.releases)) {
          const labelReleases = await this.processReleases(response);
          
          if (labelReleases && labelReleases.length > 0) {
            console.log(`[DatabaseService] Successfully fetched ${labelReleases.length} releases from top releases endpoint`);
            
            // Filter out releases without popularity data and sort by popularity
            const releasesWithPopularity = labelReleases.filter(release => 
              release.popularity !== undefined && release.popularity > 0
            );
            
            if (releasesWithPopularity.length > 0) {
              console.log(`[DatabaseService] Found ${releasesWithPopularity.length} releases with popularity data`);
              
              // Sort by popularity in descending order
              const sortedReleases = releasesWithPopularity.sort((a, b) => b.popularity - a.popularity);
              
              // Add popularity ranking to each release
              const rankedReleases = sortedReleases.map((release, index) => {
                return {
                  ...release,
                  popularity_rank: index + 1,
                  label: release.label || { id: labelId, name: this.getLabelName(labelId) }
                };
              });
              
              return rankedReleases.slice(0, 10);
            }
          }
        }
      } catch (error) {
        console.error(`[DatabaseService] Error fetching from top releases endpoint:`, error);
      }
      
      // Fall back to getting all releases and sorting them ourselves with custom popularity metrics
      let labelReleases: Release[] = [];
      try {
        console.log(`[DatabaseService] Falling back to filtering all releases by label with custom popularity metrics`);
        const allReleases = await this.getAllReleases();
        
        // Filter releases by label ID
        labelReleases = allReleases.filter(release => {
          // Check if the release has the correct label_id
          if (release.label_id === mappedLabelId) {
            return true;
          }
          
          // Check if the release has a label object with the correct id
          if (release.label && typeof release.label === 'object' && 'id' in release.label && 
              (release.label.id === mappedLabelId || release.label.id === labelId)) {
            return true;
          }
          
          return false;
        });
        
        console.log(`[DatabaseService] Found ${labelReleases.length} releases for label ${labelId}`);
      } catch (error) {
        console.error(`[DatabaseService] Error fetching all releases:`, error);
      }
      
      // If we still have no releases, try to use custom hardcoded data for top releases
      if (labelReleases.length === 0) {
        console.log(`[DatabaseService] No releases found for label ${labelId}, returning hardcoded popular releases`);
        return this.getTestTopReleases(labelId);
      }
      
      // Custom popularity scoring 
      const releasesWithPopularity = labelReleases.map(release => {
        // Start with any existing popularity data
        let calculatedPopularity = release.popularity || 0;
        
        // Use stream count if available - this is the primary metric
        if (release.stream_count && typeof release.stream_count === 'number' && release.stream_count > 0) {
          // Convert stream count to a popularity value (0-100)
          const streamPopularity = Math.min(100, Math.max(40, Math.log10(release.stream_count) * 20));
          calculatedPopularity = Math.max(calculatedPopularity, streamPopularity);
        }
        
        // Factor in release date as a secondary factor
        const releaseDate = release.release_date ? new Date(release.release_date).getTime() : 0;
        const now = Date.now();
        const ageInDays = (now - releaseDate) / (1000 * 60 * 60 * 24);
        
        // Smaller boost for newer releases
        const datePopularity = Math.max(5, 20 - Math.min(15, Math.floor(ageInDays / 90)));
        
        // Track count factor - for EPs and albums
        let trackCountPopularity = 0;
        if (release.total_tracks && release.total_tracks > 1) {
          trackCountPopularity = Math.min(10, release.total_tracks); 
        }
        
        // Final popularity score heavily weighted toward actual play metrics
        const combinedPopularity = calculatedPopularity * 0.85 + 
                                   datePopularity * 0.1 + 
                                   trackCountPopularity * 0.05;
        
        return {
          ...release,
          popularity: combinedPopularity
        };
      });
      
      // Log popularity values for debugging
      releasesWithPopularity.forEach(release => {
        const artists = release.artists ? release.artists.map(a => a.name).join(', ') : 'Unknown';
        console.log(`[DatabaseService] Release "${release.title}" by ${artists} has popularity: ${release.popularity}`);
      });
      
      // Sort releases by our calculated popularity
      const sortedReleases = releasesWithPopularity.sort((a, b) => {
        return b.popularity - a.popularity;
      });
      
      // Add popularity ranking to each release
      const rankedReleases = sortedReleases.map((release, index) => {
        return {
          ...release,
          popularity_rank: index + 1,
          label: release.label || { id: labelId, name: this.getLabelName(labelId) }
        };
      });
      
      // Return the top 10 releases
      return rankedReleases.slice(0, 10);
    } catch (error) {
      console.error('[DatabaseService] Error getting top releases:', error);
      return [];
    }
  }
  
  /**
   * Get label name from label ID
   * @param labelId The label ID
   * @returns The label name
   */
  private getLabelName(labelId: string): string {
    const labelNames: Record<string, string> = {
      '1': 'Build It Records',
      '2': 'Build It Tech',
      '3': 'Build It Deep',
      'buildit-records': 'Build It Records',
      'buildit-tech': 'Build It Tech',
      'buildit-deep': 'Build It Deep'
    };
    
    return labelNames[labelId] || 'Unknown Label';
  }

  /**
   * Map label IDs to ensure compatibility with API
   * @param labelId The label ID to map
   * @returns The mapped label ID
   */
  private mapLabelId(labelId: string): string {
    const labelMap: Record<string, string> = {
      'buildit-records': '1',
      'buildit-tech': '2',
      'buildit-deep': '3'
    };
    
    return labelMap[labelId] || labelId;
  }
  
  /**
   * Get test top releases for a specific label
   * @param labelId The ID of the label to get test releases for
   * @returns Array of test releases
   */
  private getTestTopReleases(labelId: string): Release[] {
    const labelName = labelId === 'buildit-records' ? 'Build It Records' : 
                      labelId === 'buildit-tech' ? 'Build It Tech' : 
                      labelId === 'buildit-deep' ? 'Build It Deep' : 'Unknown Label';
    
    // Create 10 test releases
    return Array.from({ length: 10 }, (_, i) => ({
      id: `test-release-${labelId}-${i + 1}`,
      title: `Top ${labelName} Release ${i + 1}`,
      name: `Top ${labelName} Release ${i + 1}`,
      release_date: new Date(Date.now() - (i * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      artwork_url: `/images/placeholder-release.jpg`,
      label_id: labelId,
      label: { id: labelId, name: labelName },
      popularity: 100 - i * 10,
      popularity_rank: i + 1,
      artists: [{
        id: `test-artist-${i + 1}`,
        name: `Artist ${i + 1}`,
        image_url: `/images/placeholder-artist.jpg`,
        uri: `spotify:artist:test-artist-${i + 1}`,
        type: 'artist',
        external_urls: { spotify: `https://open.spotify.com/artist/test-artist-${i + 1}` },
        spotify_url: `https://open.spotify.com/artist/test-artist-${i + 1}`
      }],
      tracks: [],
      uri: `spotify:album:test-release-${labelId}-${i + 1}`,
      type: 'album',
      external_urls: { spotify: `https://open.spotify.com/album/test-release-${labelId}-${i + 1}` },
      spotify_url: `https://open.spotify.com/album/test-release-${labelId}-${i + 1}`
    })) as Release[];
  }

  /**
   * Get all releases from the API
   * @returns Promise<Release[]> Array of all releases
   */
  async getAllReleases(): Promise<Release[]> {
    try {
      console.log('[DatabaseService] Getting all releases');
      
      // Construct the API endpoint
      const apiPath = this.baseUrl.includes('/api') ? '/api/releases' : '/releases';
      const queryParams = '?limit=100&include_artists=true&include_tracks=true';
      
      console.log(`[DatabaseService] Fetching releases from: ${apiPath}${queryParams}`);
      
      const response = await this.fetchApi(`${apiPath}${queryParams}`);
      
      if (response && response.success && (
        (response.data && Array.isArray(response.data)) || 
        (response.releases && Array.isArray(response.releases))
      )) {
        const releases = await this.processReleases(response);
        console.log(`[DatabaseService] Fetched ${releases.length} releases`);
        
        // For each release, make sure we have track data
        const releasesWithTracks = await Promise.all(
          releases.map(async (release) => {
            if (!release.tracks || release.tracks.length === 0) {
              console.log(`[DatabaseService] Release ${release.id} has no tracks, fetching individually`);
              try {
                // Try to fetch the individual release with tracks included
                const releaseEndpoint = `${this.baseUrl.includes('/api') ? '/releases' : '/api/releases'}/${release.id}?include_tracks=true&include_artists=true`;
                const releaseResponse = await this.fetchApi(releaseEndpoint);
                
                if (releaseResponse && releaseResponse.success) {
                  const processedRelease = await this.processReleases({
                    success: true,
                    data: [releaseResponse.data || releaseResponse.release]
                  });
                  
                  if (processedRelease && processedRelease.length > 0) {
                    console.log(`[DatabaseService] Successfully fetched tracks for release ${release.id}`);
                    return processedRelease[0];
                  }
                }
              } catch (err) {
                console.error(`[DatabaseService] Failed to fetch individual release ${release.id}:`, err);
              }
            }
            return release;
          })
        );
        
        return releasesWithTracks;
      }
      
      // If API call fails or returns no data, use fallback data
      console.warn('[DatabaseService] Failed to fetch releases from API, using fallback data');
      return this.getFallbackReleases('all', 50, 0);
    } catch (error) {
      console.error('[DatabaseService] Error getting all releases:', error);
      return this.getFallbackReleases('all', 50, 0);
    }
  }

  /**
   * Get releases for a specific artist
   * @param artistId The ID of the artist to fetch releases for
   * @param forceFresh Whether to force a fresh fetch, ignoring the cache
   * @returns An array of releases for the specified artist
   */
  async getReleasesByArtist(artistId: string, forceFresh = false): Promise<Release[]> {
    try {
      console.log(`[DatabaseService] Getting releases for artist ${artistId}`);
      
      // Check cache first if we're not forcing a fresh fetch
      if (!forceFresh) {
        const cacheKey = `artist-releases-${artistId}`;
        const cachedReleases = this.artistReleasesCache.get(cacheKey);
        if (cachedReleases && cachedReleases.timestamp > Date.now() - this.CACHE_EXPIRY) {
          console.log(`[DatabaseService] Returning cached releases for artist ${artistId}`);
          return cachedReleases.data;
        }
      }
      
      // Get artist's name for better matching
      let artistName = '';
      try {
        // Get artist directly from API without defining a new method
        const apiPath = this.baseUrl.includes('/api') ? '/artists' : '/api/artists';
        const response = await this.fetchApi(`${apiPath}/${artistId}`);
        
        if (response && response.data) {
          const artist = response.data;
          if (artist && artist.name) {
            artistName = artist.name;
            console.log(`[DatabaseService] Found artist name "${artistName}" for ID ${artistId}`);
          }
        }
      } catch (err) {
        console.warn(`[DatabaseService] Could not fetch artist name for ${artistId}, continuing without it`);
      }
      
      // Instead of loading ALL releases, load a batch of recent releases first (optimization)
      // Use the existing getAllReleases method with no arguments
      const recentReleases = await this.getAllReleases();
      console.log(`[DatabaseService] Found ${recentReleases.length} recent releases to search through`);
      
      // Process these recent releases to find the artist's tracks
      const addedReleaseIds = new Set<string>();
      const artistReleases: Release[] = [];
      
      // Find primary releases (artist is main artist)
      const primaryReleases = recentReleases.filter(release => {
        if (release.artists && Array.isArray(release.artists)) {
          return release.artists.some(artist => artist.id === artistId);
        }
        return false;
      });
      
      // Add primary releases
      primaryReleases.forEach(release => {
        if (!addedReleaseIds.has(release.id)) {
          artistReleases.push({ ...release, artistRole: 'Artist' });
          addedReleaseIds.add(release.id);
        }
      });
      
      console.log(`[DatabaseService] Found ${primaryReleases.length} primary releases for artist ${artistId}`);
      
      // Process remaining releases for remixes and features
      for (const release of recentReleases) {
        // Skip if already added
        if (addedReleaseIds.has(release.id)) continue;
        
        // Check if artist appears in any tracks
        if (release.tracks && Array.isArray(release.tracks)) {
          let foundAsRemixer = false;
          let foundAsFeature = false;
          let trackTitle = '';
          
          for (const track of release.tracks) {
            // Pre-process track for remix info
            const processedTrack = this.processTrackForPlayback(track);
            
            // Check if track is a remix by this artist
            if (processedTrack.remixer && processedTrack.remixer.id === artistId) {
              foundAsRemixer = true;
              trackTitle = processedTrack.title || '';
              break;
            }
            
            // Check if artist appears in track artists
            if (track.artists && Array.isArray(track.artists)) {
              if (track.artists.some(a => a.id === artistId)) {
                foundAsFeature = true;
                trackTitle = track.title || '';
                break;
              }
            }
          }
          
          // Add release with appropriate role
          if (foundAsRemixer) {
            artistReleases.push({
              ...release,
              artistRole: 'Remixer',
              artistTrackTitle: trackTitle
            });
            addedReleaseIds.add(release.id);
          } else if (foundAsFeature) {
            artistReleases.push({
              ...release,
              artistRole: 'Featured',
              artistTrackTitle: trackTitle
            });
            addedReleaseIds.add(release.id);
          }
        }
      }
      
      // Cache the processed releases
      const cacheKey = `artist-releases-${artistId}`;
      this.artistReleasesCache.set(cacheKey, {
        data: artistReleases,
        timestamp: Date.now()
      });
      
      console.log(`[DatabaseService] Returning ${artistReleases.length} releases for artist ${artistId}`);
      return artistReleases;
    } catch (error) {
      console.error(`[DatabaseService] Error in getReleasesByArtist:`, error);
      return [];
    }
  }

  /**
   * Get releases for a specific artist with pagination
   * @param artistId The ID of the artist to fetch releases for
   * @param page The page number (for pagination)
   * @param limit Maximum number of releases to return per page
   * @returns Array of releases for the specified artist
   */
  public async getArtistReleases(
    artistId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<Release[]> {
    try {
      console.log(`[DatabaseService] Getting releases for artist ${artistId} (page ${page}, limit ${limit})`);
      
      // Get all releases for the artist with enhanced remixes and appearance detection
      const artistReleases = await this.getReleasesByArtist(artistId);
      
      // Sort releases by release date (newest first)
      const sortedReleases = artistReleases.sort((a, b) => {
        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
        return dateB - dateA;
      });
      
      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      // Return the paginated releases
      return sortedReleases.slice(startIndex, endIndex);
    } catch (error) {
      console.error(`[DatabaseService] Error getting releases for artist ${artistId}:`, error);
      return [];
    }
  }

  /**
   * Admin login with username and password
   * @param username The admin username
   * @param password The admin password
   * @returns Login response with token if successful
   */
  async adminLogin(
    username: string,
    password: string
  ): Promise<AdminLoginResponse> {
    try {
      console.log(`[DatabaseService] Attempting admin login for user: ${username}`);
      const token = localStorage.getItem('adminToken');
      if (token) {
        console.log('[DatabaseService] adminLogin: Token already exists in localStorage');
        return { success: true, token, message: 'Already logged in' };
      }
      
      console.log('[DatabaseService] adminLogin: No token found in localStorage, proceeding with login');
      const apiUrl = this.formatUrl(this.getBaseUrl(), 'admin/login');
      console.log('[DatabaseService] adminLogin API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      console.log('[DatabaseService] adminLogin response status:', response.status);
      
      if (!response.ok) {
        console.error('[DatabaseService] Login error:', data);
        throw new Error(data.message || 'Login failed');
      }
      
      console.log('[DatabaseService] Login success:', {
        success: data.success,
        hasToken: !!data.token,
        tokenLength: data.token ? data.token.length : 0
      });
      
      return data;
    } catch (error) {
      console.error('[DatabaseService] adminLogin error:', error);
      throw error;
    }
  }

  /**
   * Verify admin token stored in localStorage
   * @returns Verification response indicating if the token is valid
   */
  async verifyAdminToken(): Promise<TokenVerificationResponse> {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.log('[DatabaseService] verifyAdminToken: No token found in localStorage');
        return { verified: false, message: 'No token found' };
      }
      
      console.log('[DatabaseService] Verifying admin token');
      const apiUrl = this.formatUrl(this.getBaseUrl(), 'admin/verify-admin-token');
      console.log(`[DatabaseService] verifyAdminToken API URL: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log('[DatabaseService] verifyAdminToken response:', data);
      
      return {
        verified: data.success === true,
        message: data.message,
        user: data.data?.user
      };
    } catch (error) {
      console.error('[DatabaseService] verifyAdminToken error:', error);
      return { verified: false, message: error instanceof Error ? error.message : 'Verification request failed' };
    }
  }

  /**
   * Get a single release by ID with tracks and artists included
   * @param releaseId The ID of the release to fetch
   * @returns Promise resolving to the release with tracks and artists
   */
  async getRelease(releaseId: string): Promise<Release | null> {
    console.log(`[DatabaseService] Fetching single release with ID: ${releaseId}`);
    
    try {
      // Try multiple API endpoints to ensure we get tracks
      const apiEndpoints = [
        // Primary endpoint with all parameters
        `${this.baseUrl.includes('/api') ? '/releases' : '/api/releases'}/${releaseId}?include_tracks=true&include_artists=true&include_remixes=true`,
        
        // Alternative endpoint format
        `${this.baseUrl}/api/releases/${releaseId}?include_tracks=true&include_artists=true&include_remixes=true`,
        
        // Fallback endpoint without /api prefix
        `${this.baseUrl}/releases/${releaseId}?include_tracks=true&include_artists=true&include_remixes=true`
      ];
      
      let release: Release | null = null;
      let tracksFound = false;
      
      // Try each endpoint until we get a successful response with tracks
      for (const endpoint of apiEndpoints) {
        if (tracksFound) break;
        
        try {
          console.log(`[DatabaseService] Trying endpoint: ${endpoint}`);
          const response = await this.fetchApi(endpoint);
          
          if (response && response.success) {
            const releaseData = response.data || response.release;
            
            // Log the raw response to help debug track issues
            console.log(`[DatabaseService] Raw release data from ${endpoint}:`, {
              hasTracks: releaseData.tracks && releaseData.tracks.length > 0,
              trackCount: releaseData.tracks?.length || 0,
              hasAlbum: releaseData.album ? true : false,
              albumTrackCount: releaseData.album?.tracks?.length || 0
            });
            
            // Process the release data
            const processedReleases = await this.processReleases({
              success: true,
              data: [releaseData]
            });
            
            if (processedReleases && processedReleases.length > 0) {
              const processedRelease = processedReleases[0];
              
              // If tracks are missing, try to get them from the album property
              if (!processedRelease.tracks || processedRelease.tracks.length === 0) {
                if (releaseData.album && releaseData.album.tracks && releaseData.album.tracks.length > 0) {
                  console.log(`[DatabaseService] Using tracks from album property:`, 
                    releaseData.album.tracks.length);
                  processedRelease.tracks = releaseData.album.tracks;
                  tracksFound = true;
                }
              } else {
                tracksFound = true;
              }
              
              release = processedRelease;
              
              // If we found tracks, break the loop
              if (tracksFound) {
                console.log(`[DatabaseService] Found tracks using endpoint: ${endpoint}`);
                break;
              }
            }
          }
        } catch (endpointError) {
          console.error(`[DatabaseService] Error with endpoint ${endpoint}:`, endpointError);
          // Continue to next endpoint
        }
      }
      
      // If we have a release but no tracks, try a direct tracks endpoint
      if (release && (!release.tracks || release.tracks.length === 0)) {
        try {
          console.log(`[DatabaseService] Attempting direct tracks API call for release ${releaseId}`);
          const tracksEndpoint = `${this.baseUrl}/api/tracks?release_id=${releaseId}`;
          const tracksResponse = await this.fetchApi(tracksEndpoint);
          
          if (tracksResponse && tracksResponse.success && 
              (tracksResponse.data || tracksResponse.tracks) && 
              (tracksResponse.data?.length > 0 || tracksResponse.tracks?.length > 0)) {
            
            const tracks = tracksResponse.data || tracksResponse.tracks;
            console.log(`[DatabaseService] Found ${tracks.length} tracks from direct tracks API call`);
            release.tracks = tracks;
            tracksFound = true;
          }
        } catch (tracksError) {
          console.error(`[DatabaseService] Error in direct tracks API call:`, tracksError);
        }
      }
      
      // If we have a release, return it even if we couldn't find tracks
      if (release) {
        console.log(`[DatabaseService] Returning release ${releaseId} with ${release.tracks?.length || 0} tracks`);
        return release;
      }
      
      console.error(`[DatabaseService] Failed to fetch release ${releaseId} from any endpoint`);
      return null;
    } catch (error) {
      console.error(`[DatabaseService] Error fetching release ${releaseId}:`, error);
      return null;
    }
  }

  /**
   * Submit a demo for review
   * @param demoData The demo submission data
   * @returns Promise resolving to the API response
   */
  async submitDemo(demoData: any): Promise<any> {
    try {
      console.log('[DatabaseService] Submitting demo:', demoData);
      
      const response = await fetch(`${this.getBaseUrl()}/submit-demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(demoData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[DatabaseService] Error submitting demo:', errorData);
        throw new Error(errorData.message || 'Failed to submit demo');
      }
      
      const data = await response.json();
      console.log('[DatabaseService] Demo submitted successfully:', data);
      return data;
    } catch (error) {
      console.error('[DatabaseService] Error in submitDemo:', error);
      throw error;
    }
  }

  /**
   * Submit a VIP subscription request
   * @param subscriptionData The subscription data (name, email, plan)
   * @returns Promise resolving to the API response
   */
  async subscribeToVIP(subscriptionData: {
    name: string;
    email: string;
    plan: string;
  }): Promise<any> {
    try {
      console.log('[DatabaseService] Processing VIP subscription:', subscriptionData);
      
      // Create endpoint URL
      const apiPath = this.baseUrl.includes('/api') ? '/api/subscribe-vip' : '/subscribe-vip';
      console.log(`[DatabaseService] Sending subscription to: ${apiPath}`);
      
      const response = await fetch(`${this.baseUrl}${apiPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[DatabaseService] Error processing VIP subscription:', errorData);
        throw new Error(errorData.message || 'Failed to process subscription');
      }
      
      const data = await response.json();
      console.log('[DatabaseService] VIP subscription processed successfully:', data);
      
      // Store subscription status in localStorage for client-side verification
      localStorage.setItem('vipSubscriptionStatus', JSON.stringify({
        subscribed: true,
        plan: subscriptionData.plan,
        email: subscriptionData.email,
        timestamp: new Date().toISOString()
      }));
      
      return data;
    } catch (error) {
      console.error('[DatabaseService] Error in subscribeToVIP:', error);
      throw error;
    }
  }

  /**
   * Check if the user has an active VIP subscription
   * @returns Object containing subscription status
   */
  getVIPSubscriptionStatus(): { subscribed: boolean; plan?: string; email?: string } {
    try {
      const subscriptionData = localStorage.getItem('vipSubscriptionStatus');
      if (!subscriptionData) {
        return { subscribed: false };
      }
      
      const subscription = JSON.parse(subscriptionData);
      return {
        subscribed: subscription.subscribed || false,
        plan: subscription.plan,
        email: subscription.email
      };
    } catch (error) {
      console.error('[DatabaseService] Error checking VIP subscription status:', error);
      return { subscribed: false };
    }
  }

  /**
   * Fetch an artist with their releases included, ensuring image availability
   * @param artistId The ID of the artist to fetch
   * @returns Promise resolving to the artist with releases included
   */
  public async getArtistWithReleases(artistId: string): Promise<Artist | null> {
    try {
      console.log(`[DatabaseService] Fetching artist ${artistId} with releases`);
      
      // First, get the artist details
      const response = await fetch(`${this.getBaseUrl()}/artists/${artistId}`);
      if (!response.ok) {
        console.error(`[DatabaseService] Error fetching artist ${artistId}:`, await response.text());
        return null;
      }
      
      const data = await response.json();
      if (!data.success || !data.data) {
        console.error(`[DatabaseService] Invalid artist data for ${artistId}:`, data);
        return null;
      }
      
      const artist = data.data;
      
      // Now get the artist's releases
      const releases = await this.getArtistReleases(artistId, 1, 10);
      artist.releases = releases;
      
      // Process the artist to ensure it has all required fields
      const processedArtist = this.filterAndProcessArtists([artist], new Set([artistId]))[0];
      
      return processedArtist || null;
    } catch (error) {
      console.error(`[DatabaseService] Error fetching artist with releases ${artistId}:`, error);
      return null;
    }
  }

  /**
   * Process a track to ensure it has consistent field names and Spotify URLs
   * This is a public utility method that can be used by components
   * @param track Any track object
   * @returns Processed track with consistent fields and URLs
   */
  public processTrackForPlayback(track: any): any {
    if (!track) return track;
    
    // Create a deep copy to avoid mutating the original
    const processedTrack = { ...track };
    
    // Process Spotify URLs
    if (!processedTrack.spotify_url && processedTrack.external_urls && processedTrack.external_urls.spotify) {
      processedTrack.spotify_url = processedTrack.external_urls.spotify;
    }
    
    // Use preview_url as a fallback
    if (!processedTrack.spotify_url && processedTrack.preview_url) {
      processedTrack.spotify_url = processedTrack.preview_url;
    }
    
    // Try to construct URL from track ID if all else fails
    if (!processedTrack.spotify_url && processedTrack.id) {
      processedTrack.spotify_url = `https://open.spotify.com/track/${processedTrack.id}`;
    }
    
    // Process remix information
    processedTrack.isRemixProcessed = true;
    if (processedTrack.title && !processedTrack.isRemix) {
      // Extract remixer info from title
      const remixRegex = /\(([^)]+)\s+Remix\)/i;
      const remixMatch = processedTrack.title.match(remixRegex);
      
      if (remixMatch && remixMatch[1]) {
        const remixerName = remixMatch[1].trim();
        processedTrack.isRemix = true;
        
        if (!processedTrack.remixer) {
          processedTrack.remixer = {
            name: remixerName,
            role: 'Remixer'
          };
        }
      }
    }
    
    return processedTrack;
  }
}

// Export the singleton instance as a named export
export const databaseService = DatabaseService.getInstance();

// Also export the class as the default export
export default DatabaseService;
