/**
 * @fileoverview Database service for interacting with the API
 * @module services/DatabaseService
 */

import { Track } from '../types/track';
import { Release } from '../types/release';
import { Artist } from '../types/artist';
import { SpotifyImage } from '../types/spotify';
import { DatabaseError } from '../utils/errors';
import { RecordLabelId } from '../types/labels'; 
import { getApiBaseUrl } from '../utils/apiConfig';

interface ArtistWithReleases extends Artist {
  releases: Release[];
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

  private constructor() {
    // Log environment detection information
    console.log('[DatabaseService] Environment:', process.env.NODE_ENV);
    console.log('[DatabaseService] API URL from env:', process.env.REACT_APP_API_URL);
    console.log('[DatabaseService] Running on:', typeof window !== 'undefined' ? window.location.origin : 'server');
    
    // For local development, temporarily use direct connection to avoid proxy issues
    if (process.env.NODE_ENV === 'development') {
      this.baseUrl = 'http://localhost:3003';
      console.log('[DatabaseService] Using direct local API URL for development:', this.baseUrl);
    } else {
      this.baseUrl = getApiBaseUrl();
      console.log('[DatabaseService] Using API URL:', this.baseUrl);
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    console.log(`Fetching API: ${endpoint}`);
    
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    let apiUrl: string;
    
    if (isLocalhost && process.env.NODE_ENV === 'development') {
      // In development, use direct connection to the API server to avoid proxy issues
      apiUrl = `http://localhost:3003${endpoint}`;
      console.log(`Development: Using direct API URL: ${apiUrl}`);
    } else {
      // In production, this.baseUrl already includes /api from getApiBaseUrl()
      // So we need to prevent duplicate /api in the URL
      if (this.baseUrl.endsWith('/api')) {
        // If baseUrl ends with /api, construct the URL correctly
        apiUrl = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
      } else {
        // If baseUrl doesn't end with /api (fallback case)
        apiUrl = `/api${endpoint}`;
      }
      console.log(`Production/Proxy: Using API URL: ${apiUrl}`);
    }
    
    // Debugging helper for Vercel deployment
    console.log('[DEBUG] Environment:', process.env.NODE_ENV);
    console.log('[DEBUG] API Base URL:', this.baseUrl);
    console.log('[DEBUG] Full API URL:', apiUrl);
    
    try {
      console.log(`[DEBUG] Sending ${options.method || 'GET'} request to ${apiUrl}`);
      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      });
      
      console.log(`[DEBUG] Response status: ${response.status} ${response.statusText}`);
      
      // Handle non-successful responses
      if (!response.ok) {
        console.error(`API Error: ${response.status} - ${response.statusText}`);
        let errorDetails = null;
        
        try {
          errorDetails = await response.json();
          console.error('API Error Details:', errorDetails);
        } catch (e) {
          console.error('Could not parse error response as JSON');
        }
        
        throw new Error(`API Error ${response.status}: ${errorDetails?.error || response.statusText}`);
      }
      
      // Parse response
      try {
        const data = await response.json() as T;
        console.log(`[DEBUG] API Response data type:`, typeof data);
        console.log(`[DEBUG] API Response has data:`, !!data);
        
        // Log the properties of the response without the full payload
        if (data && typeof data === 'object') {
          console.log('[DEBUG] Response properties:', Object.keys(data as Record<string, unknown>));
          
          // Log meta information if it exists
          if ('_meta' in data) {
            console.log('[DEBUG] Response meta:', (data as Record<string, unknown>)['_meta']);
          }
          
          // Log counts for arrays in the response
          for (const key of Object.keys(data as Record<string, unknown>)) {
            if (Array.isArray((data as Record<string, unknown>)[key])) {
              console.log(`[DEBUG] Response ${key} count:`, ((data as Record<string, unknown>)[key] as unknown[]).length);
            }
          }
        }
        
        await this.logResponseData(data);
        
        return data;
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('API Request Failed:', error);
      throw error;
    }
  }

  private async logResponseData(data: unknown): Promise<void> {
    try {
      if (typeof data === 'object' && data !== null) {
        // Log the entire response with limited depth
        const dataObj = data as Record<string, unknown>;
        console.log('[DatabaseService] Response data:', JSON.stringify(dataObj, null, 2).substring(0, 500) + '...');
        
        // Log counts for arrays in the response
        for (const key of Object.keys(dataObj)) {
          if (Array.isArray(dataObj[key])) {
            console.log(`[DEBUG] Response ${key} count:`, (dataObj[key] as unknown[]).length);
          }
        }
      }
    } catch (error) {
      console.error('[DatabaseService] Error logging response data:', error);
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
      console.log(`Getting releases for label: ${labelId}`);
      
      // Special case for buildit-records label
      const isBuilditLabel = labelId === 'buildit-records' || labelId === '1';
      
      if (isBuilditLabel) {
        console.log(`[DEBUG] Detected buildit-records label request`);
        console.log(`[DEBUG] Current environment: ${process.env.NODE_ENV || 'development'}`);
      }

      // Calculate offset for pagination (page 1 starts at offset 1, not 0)
      const offset = Math.max(1, (page - 1) * limit);
      
      let apiUrl = `/releases?`;
      
      // Add label filter
      if (isBuilditLabel) {
        // Try both label formats for better compatibility
        apiUrl += `label=buildit-records`;
      } else {
        apiUrl += `label=${labelId}`;
      }
      
      // Add pagination parameters
      apiUrl += `&offset=${offset}&limit=${limit}`;
      
      console.log(`[DEBUG] Making request to: ${this.baseUrl}${apiUrl}`);
      
      // Try to get diagnostic data to help with debugging
      try {
        console.log(`[DEBUG] Fetching diagnostic data to check database state`);
        const diagnostic = await this.fetchApi<ApiResponse>(`/diagnostic`);
        console.log(`[DEBUG] Diagnostic data received: ${!!diagnostic}`);
      } catch (e) {
        console.log(`[DEBUG] Diagnostic check failed: ${e}`);
      }
      
      // Fetch the releases
      const response = await this.fetchApi<ApiResponse>(apiUrl);
      
      // Check for data property first (Render API format)
      if (response.data && Array.isArray(response.data)) {
        console.log(`[DEBUG] Found releases in response.data: ${response.data.length} items`);
        
        // Process releases to ensure they have all required fields
        const processedReleases = await this.processReleases({ releases: response.data });
        
        return {
          releases: processedReleases,
          totalReleases: response.total || processedReleases.length,
          totalTracks: response.count || 0,
          hasMore: (offset + processedReleases.length) < (response.total || processedReleases.length)
        };
      } 
      // Check for releases property (legacy format)
      else if (response.releases && Array.isArray(response.releases)) {
        console.log(`[DEBUG] Found releases in response.releases: ${response.releases.length} items`);
        const processedReleases = await this.processReleases(response as { releases: any[] });
        
        return {
          releases: processedReleases,
          totalReleases: response.total || processedReleases.length,
          totalTracks: response.count || 0,
          hasMore: (offset + processedReleases.length) < (response.total || processedReleases.length)
        };
      }
      
      // If we're requesting buildit-records but didn't get results, try numeric ID fallback
      if (labelId === 'buildit-records') {
        console.log(`[DEBUG] Trying fallback with numeric ID for buildit-records label`);
        return this.getReleasesByLabel('1', page, limit);
      }
      
      // No releases found in the response
      console.warn(`No valid releases data found in response for label ${labelId}`);
      return {
        releases: [],
        totalReleases: 0,
        totalTracks: 0,
        hasMore: false
      };
    } catch (error) {
      console.error(`Error fetching releases for label ${labelId}:`, error);
      // Return empty array instead of throwing to make UI more resilient
      return {
        releases: [],
        totalReleases: 0,
        totalTracks: 0,
        hasMore: false
      };
    }
  }
  
  /**
   * Process a response containing releases and ensure all required fields are present
   * @param response The response object containing releases array
   * @returns Array of processed releases with standardized fields
   */
  public async processReleases(response: { releases: any[] }): Promise<Release[]> {
    if (!response || !response.releases) {
      console.warn('[DEBUG] No releases to process, or invalid response format');
      return [];
    }

    console.log(`Processing ${response.releases.length} releases`);
    console.log(`[DEBUG] Release types present:`, JSON.stringify(
      [...new Set(response.releases.map((r: any) => r.type || 'unknown'))]
    ));

    // Map the releases
    return Promise.all(response.releases.map(async (release: any) => {
      // Log details about the release for debugging
      console.log(`[DEBUG] Processing release: ${release.id} ${release.title || release.name} (${release.type || 'unknown type'})`);
      console.log(`[DEBUG] Release has artwork_url: ${!!release.artwork_url}, has images: ${!!(release.images && release.images.length)}`);
      
      // Ensure release has an artwork_url
      if (!release.artwork_url) {
        if (release.images && release.images.length > 0) {
          release.artwork_url = release.images[0].url;
          console.log(`[DEBUG] Set release artwork from images array: ${release.artwork_url}`);
        } else if (release.cover_url) {
          release.artwork_url = release.cover_url;
          console.log(`[DEBUG] Set release artwork from cover_url: ${release.artwork_url}`);
        } else if (release.cover && release.cover.url) {
          release.artwork_url = release.cover.url;
          console.log(`[DEBUG] Set release artwork from cover object: ${release.artwork_url}`);
        } else if (release.id) {
          // Correctly format Spotify image URL - need to use AB67616500001 format for album artwork
          release.artwork_url = `https://i.scdn.co/image/ab67616d0000b273${release.id.substring(0, 22)}`;
          console.log(`[DEBUG] Set release artwork from Spotify ID with correct format: ${release.artwork_url}`);
        } else {
          // Set a direct placeholder image URL instead of a relative path
          release.artwork_url = 'https://via.placeholder.com/300?text=No+Artwork';
          console.log(`[DEBUG] Set placeholder artwork for release ${release.id}`);
        }
      }
      
      // Check if artwork URL is relative and convert to absolute
      if (release.artwork_url && release.artwork_url.startsWith('/')) {
        // Use a full URL for the placeholder
        release.artwork_url = 'https://via.placeholder.com/300?text=No+Artwork';
        console.log(`[DEBUG] Converted relative path to absolute URL: ${release.artwork_url}`);
      }

      // Make sure the release title is populated
      if (!release.title && release.name) {
        release.title = release.name;
      } else if (!release.title) {
        release.title = 'Untitled Release';
      }

      // Check if we need to add the official website tag for Render-formatted releases
      if (release.spotify_url && !release.spotify_url.startsWith('http')) {
        release.spotify_url = `https://open.spotify.com/album/${release.spotify_url}`;
      }

      // Ensure type field is correctly populated
      if (!release.type) {
        // Try to determine type from metadata
        if (release.release_type) {
          release.type = release.release_type.toLowerCase();
        } else if (release.num_tracks && release.num_tracks <= 4) {
          release.type = 'single';
        } else if (release.num_tracks && release.num_tracks <= 8) {
          release.type = 'ep';
        } else {
          release.type = 'album';
        }
      }

      // Standardize label_id format - could be either a string ID or an object with an id property
      if (release.label && typeof release.label === 'object' && release.label.id) {
        release.label_id = release.label.id;
      } else if (!release.label_id && release.label) {
        release.label_id = typeof release.label === 'string' ? release.label : String(release.label);
      }
      
      // Ensure artists is always an array
      if (!release.artists || !Array.isArray(release.artists)) {
        console.log(`[DEBUG] No artists array for release ${release.title}, creating default`);
        
        // If there's a primary_artist_id, try to use that
        if (release.primary_artist_id) {
          try {
            // Get the artist directly
            const artistResponse = await this.fetchApi<ApiResponse>(`/artists/${release.primary_artist_id}`);
            if (artistResponse.data) {
              release.artists = [this.formatArtist(artistResponse.data)];
              console.log(`[DEBUG] Added primary artist for release ${release.title}`);
            }
          } catch (error) {
            console.error(`[DEBUG] Error fetching primary artist ${release.primary_artist_id}:`, error);
          }
        }
        
        // If we still don't have artists, create a default
        if (!release.artists || !Array.isArray(release.artists) || release.artists.length === 0) {
          // For compilations, use "Various Artists"
          if (release.title?.toLowerCase().includes('compilation') || 
              release.title?.toLowerCase().includes('various') ||
              release.title?.toLowerCase().includes('collection')) {
            release.artists = [{
              id: '0LyfQWJT6nXafLPZqxe9Of',
              name: 'Various Artists',
              type: 'artist',
              image_url: 'https://i.scdn.co/image/ab6761610000e5eb6b134287e3095d2c84b7932a',
              spotify_url: 'https://open.spotify.com/artist/0LyfQWJT6nXafLPZqxe9Of',
              external_urls: { spotify: 'https://open.spotify.com/artist/0LyfQWJT6nXafLPZqxe9Of' },
              uri: 'spotify:artist:0LyfQWJT6nXafLPZqxe9Of'
            }];
          } else {
            // For other releases, create a default artist with the label name
            const labelName = (release.label && typeof release.label === 'object' && release.label.name) 
              ? release.label.name 
              : 'Build It Records';
              
            release.artists = [{
              id: `default-${release.id || Math.random().toString(36).substring(7)}`,
              name: labelName,
              type: 'artist',
              image_url: 'https://via.placeholder.com/300?text=Artist+Image',
              spotify_url: '',
              external_urls: { spotify: '' },
              uri: ''
            }];
          }
          console.log(`[DEBUG] Created ${release.artists[0].name} as default artist for release ${release.title}`);
        }
      } else {
        // Make sure all artists in the array are properly formatted
        release.artists = release.artists.map((artist: any) => {
          if (typeof artist === 'string') {
            // If artist is just an ID string, create a minimal object
            return {
              id: artist,
              name: 'Unknown Artist',
              type: 'artist',
              image_url: 'https://via.placeholder.com/300?text=Artist+Image',
              spotify_url: `https://open.spotify.com/artist/${artist}`,
              external_urls: { spotify: `https://open.spotify.com/artist/${artist}` },
              uri: `spotify:artist:${artist}`
            };
          } else {
            // Otherwise format properly
            return this.formatArtist(artist);
          }
        });
      }

      return release as Release;
    }));
  }

  public async processTracks(response: { tracks: any[] }): Promise<Track[]> {
    if (!response.tracks || !Array.isArray(response.tracks)) {
      console.warn('Invalid tracks data in response');
      return [];
    }
    
    // Use the createTrack method to ensure proper typing
    const tracks: Track[] = response.tracks.map((track: any) => this.createTrack(track));
    
    return tracks;
  }

  private createTrack(trackData: any): Track {
    // Create a properly typed Track object
    const track: Track = {
      id: trackData.id || '',
      title: trackData.title || trackData.name || '',
      name: trackData.name || trackData.title || '',
      duration: trackData.duration || Number(trackData.duration_ms || 0),
      track_number: trackData.track_number || 1,
      disc_number: trackData.disc_number || 1,
      preview_url: trackData.preview_url || null,
      spotify_url: trackData.spotify_url || '',
      spotify_uri: trackData.spotify_uri || trackData.uri || '',
      artists: Array.isArray(trackData.artists) ? trackData.artists.map((a: any) => this.formatArtist(a)) : [],
      isrc: trackData.isrc || '',
      external_urls: { spotify: trackData.external_urls?.spotify || trackData.spotify_url || '' },
      type: 'track',
      remixer: trackData.remixer,
    };
    
    // Add release data if available
    if (trackData.release) {
      const albumData = trackData.release as any; // Type assertion to avoid unknown type errors
      track.release = {
        id: albumData.id || '',
        name: albumData.name || '',
        title: albumData.title || albumData.name || '',
        type: 'album',
        release_date: albumData.release_date || '',
        images: albumData.images || [{ url: albumData.artwork_url || '', height: 0, width: 0 }],
        spotify_url: albumData.spotify_url || albumData.external_urls?.spotify || '',
        spotify_uri: albumData.spotify_uri || albumData.uri || '',
        label_id: albumData.label_id || '',
        total_tracks: albumData.total_tracks || 0,
        artists: Array.isArray(albumData.artists) ? albumData.artists : []
      };
    }
    
    return track;
  }

  private createTrackFromSnapshot(trackSnapshot: any): Track {
    if (!trackSnapshot) {
      return {
        id: '',
        title: '',
        name: '',
        duration: 0,
        track_number: 0,
        disc_number: 0,
        preview_url: null,
        spotify_url: '',
        spotify_uri: '',
        artists: [],
        isrc: '',
        external_urls: { spotify: '' },
        type: 'track'
      };
    }
    
    // Use the standard createTrack method for consistent handling
    return this.createTrack(trackSnapshot);
  }

  /**
   * Maps a Spotify artist to our internal Artist interface
   * @param artist The Spotify artist object
   * @returns An Artist object
   */
  private mapSpotifyArtistToArtist(artist: Record<string, any>): Artist {
    return {
      id: artist.id || '',
      name: artist.name || 'Unknown Artist',
      uri: artist.uri || artist.spotify_uri || '',
      external_urls: artist.external_urls || { spotify: artist.spotify_url || '' },
      spotify_url: artist.spotify_url || artist.external_urls?.spotify || '',
      image_url: artist.images?.[0]?.url || '',
      type: 'artist'
    };
  }

  public async getTracksByLabel(
    labelId: string,
    offset = 0,
    limit = 50
  ): Promise<{
    tracks: Track[];
    totalTracks: number;
    hasMore: boolean;
  }> {
    try {
      console.log(`Getting tracks for label: ${labelId}`);
      
      const response = await this.fetchApi<ApiResponse>(
        `/tracks?label=${labelId}&offset=${offset}&limit=${limit}`
      );

      if (response.tracks && Array.isArray(response.tracks)) {
        console.log(`Received ${response.tracks.length} tracks for label ${labelId}`);
        const processedTracks = await this.processTracks({ tracks: response.tracks });
        const total = response.total || 0;

        return {
          tracks: processedTracks,
          totalTracks: total,
          hasMore: offset + processedTracks.length < total
        };
      }

      return {
        tracks: [],
        totalTracks: 0,
        hasMore: false
      };
    } catch (error) {
      console.error(`Error fetching tracks for label ${labelId}:`, error);
      return {
        tracks: [],
        totalTracks: 0,
        hasMore: false
      };
    }
  }

  public async searchTracks(query: string, offset = 0, limit = 50): Promise<{
    tracks: Track[];
    totalTracks: number;
    hasMore: boolean;
  }> {
    try {
      console.log(`Searching tracks with query: "${query}"`);
      const response = await this.fetchApi<ApiResponse>(
        `/tracks/search?query=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}`
      );

      if (response.tracks && Array.isArray(response.tracks)) {
        console.log(`Received ${response.tracks.length} tracks for search "${query}"`);
        const processedTracks = await this.processTracks({ tracks: response.tracks });
        const total = response.total || 0;

        return {
          tracks: processedTracks,
          totalTracks: total,
          hasMore: offset + processedTracks.length < total
        };
      }

      return {
        tracks: [],
        totalTracks: 0,
        hasMore: false
      };
    } catch (error) {
      console.error(`Error searching tracks with query "${query}":`, error);
      return {
        tracks: [],
        totalTracks: 0,
        hasMore: false
      };
    }
  }
  
  public async importTracksFromSpotify(labelId: string): Promise<ImportResponse> {
    try {
      console.log(`Importing tracks from Spotify for label: ${labelId}`);
      const response = await this.fetchApi<ApiResponse>(`/import?labelId=${labelId}`);
      
      return {
        success: true,
        message: `Imported ${response.count || 0} tracks successfully`,
        count: response.count || 0
      };
    } catch (error) {
      console.error('Error importing tracks:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        count: 0
      };
    }
  }

  public async getArtistsForLabel(labelId: string | { id: string }): Promise<Artist[]> {
    try {
      const id = typeof labelId === 'string' ? labelId : labelId.id;
      console.log('[DEBUG] Fetching artists for label:', id);
      const response = await this.fetchApi<ApiResponse<Artist>>(`/artists?label=${id}`);
      
      // Check for data property first (Render API format)
      if (response.data && Array.isArray(response.data)) {
        console.log(`[DEBUG] Response data count: ${response.data.length}`);
        return response.data.map((artist: any) => this.formatArtist(artist));
      } 
      // Check for legacy format
      else if (response.artists && Array.isArray(response.artists)) {
        console.log(`Retrieved ${response.artists.length} artists for label ${id}`);
        return response.artists.map((artist: any) => this.formatArtist(artist));
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching artists for label ${labelId}:`, error);
      return [];
    }
  }

  /**
   * Get all releases associated with a specific artist across all labels
   * @param artistId The ID of the artist
   */
  public async getReleasesByArtist(artistId: string): Promise<Release[]> {
    try {
      console.log(`Fetching releases for artist ${artistId}`);
      
      // Try the dedicated artist-releases endpoint first (primary approach)
      const endpoint = `/artist-releases/${artistId}`;
      
      const response = await this.fetchApi<ApiResponse>(endpoint);
      
      if (response?.data && Array.isArray(response.data)) {
        console.log(`Successfully found ${response.data.length} releases for artist ${artistId}`);
        
        // Transform the data and use type assertion to bypass TypeScript checking
        return response.data.map((release: any) => {
          // Create a release object with the properties we have
          const releaseObj = {
            id: release.id || '',
            title: release.title || release.name || 'Unknown Release',
            type: release.type || 'release',
            release_date: release.release_date || '',
            artwork_url: release.artwork_url || '',
            spotify_url: release.spotify_url || '',
            artists: release.artists || [],
            label_id: release.label_id || '',
            total_tracks: release.total_tracks || 0,
            tracks: (release.tracks || []).map((track: any) => this.createTrack(track)),
            label: release.label || { name: release.label_name ? String(release.label_name) : '' }
          };
          
          // Use type assertion to tell TypeScript this matches the Release interface
          return releaseObj as unknown as Release;
        });
      }
      
      // Fallback to the plural endpoint format based on our API route mappings
      console.log(`[DEBUG] Trying fallback to plural endpoint format for artist ${artistId}`);
      const fallbackResponse = await this.fetchApi<ApiResponse>(`/artists/${artistId}/releases`);
      
      if (fallbackResponse?.data && Array.isArray(fallbackResponse.data)) {
        console.log(`[DEBUG] Successfully found ${fallbackResponse.data.length} releases using fallback endpoint`);
        return this.processReleases({ releases: fallbackResponse.data });
      } else if (fallbackResponse?.releases && Array.isArray(fallbackResponse.releases)) {
        console.log(`[DEBUG] Successfully found ${fallbackResponse.releases.length} releases using fallback endpoint (legacy format)`);
        return this.processReleases({ releases: fallbackResponse.releases });
      }
      
      console.warn(`Received empty or invalid releases array for artist ${artistId}`);
      return [];
    } catch (error) {
      console.error(`Error fetching releases for artist ${artistId}:`, error);
      return [];
    }
  }

  public async getArtistsByLabel(labelId: string): Promise<Artist[]> {
    try {
      console.log(`[DatabaseService] Fetching artists by label with ID: ${labelId}`);
      
      // First try the plural endpoint format
      let response = await this.fetchApi<ApiResponse<Artist>>(`/labels/${labelId}/artists`);
      
      // Check for data property first (Render API format)
      if (response.data && Array.isArray(response.data)) {
        console.log(`[DatabaseService] Got ${response.data.length} artists from data property`);
        return response.data.map((artist: any) => this.formatArtist(artist));
      } 
      // Check for artists property (legacy format)
      else if (response.artists && Array.isArray(response.artists)) {
        console.log(`[DatabaseService] Got ${response.artists.length} artists from artists property`);
        return response.artists.map((artist: any) => this.formatArtist(artist));
      }
      
      // Fallback to the direct artist query endpoint if label-specific endpoint fails
      console.log(`[DEBUG] Trying fallback endpoint for label ${labelId}`);
      response = await this.fetchApi<ApiResponse<Artist>>(`/artists?label=${labelId}`);
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`[DEBUG] Got ${response.data.length} artists from fallback endpoint`);
        return response.data.map((artist: any) => this.formatArtist(artist));
      } else if (response.artists && Array.isArray(response.artists)) {
        console.log(`[DEBUG] Got ${response.artists.length} artists from fallback endpoint (legacy format)`);
        return response.artists.map((artist: any) => this.formatArtist(artist));
      }
      
      console.warn('[DatabaseService] No artists found for label:', labelId);
      return [];
    } catch (error) {
      console.error('[DatabaseService] Error fetching artists by label:', error);
      // Return empty array instead of throwing to make UI more resilient
      return [];
    }
  }

  /**
   * Get top performing releases for a specific label
   * @param labelId The ID of the label (can be string 'buildit-records' or numeric id)
   * @returns Promise resolving to an array of top releases
   */
  public async getTopReleases(labelId: string): Promise<Release[]> {
    try {
      console.log(`Getting top releases for label: ${labelId}`);
      
      // Special handling for buildit-records label
      const isBuilditLabel = labelId === 'buildit-records' || labelId === '1';
      
      let apiUrl = `/releases/top?`;
      
      // Add label parameter in the format the backend expects
      if (isBuilditLabel) {
        apiUrl += `label=buildit-records`;
      } else {
        apiUrl += `label=${labelId}`;
      }
      
      console.log(`[DEBUG] Requesting top releases: ${this.baseUrl}${apiUrl}`);
      
      const response = await this.fetchApi<ApiResponse>(apiUrl);
      
      // Check for data property first (Render API format)
      if (response.data && Array.isArray(response.data)) {
        console.log(`[DEBUG] Found ${response.data.length} top releases in response.data`);
        return this.processReleases({ releases: response.data });
      }
      // Fall back to checking for releases property (legacy format)
      else if (response.releases && Array.isArray(response.releases)) {
        console.log(`[DEBUG] Found ${response.releases.length} top releases in response.releases`);
        return this.processReleases(response as { releases: any[] });
      }
      
      // Special handling for error message about JSON object
      if (response.message && response.message.includes("JSON object")) {
        console.log(`[DEBUG] Backend returned JSON object error: ${response.message}`);
        
        // Try alternative approach with numeric label ID if we're using string ID
        if (labelId === 'buildit-records') {
          console.log(`[DEBUG] Trying fallback with numeric ID for top releases`);
          return this.getTopReleases('1');
        }
        
        // Create some default top releases based on regular releases
        console.log(`[DEBUG] Creating default top releases from standard releases`);
        const regularReleases = await this.getReleasesByLabel(labelId, 1, 6);
        return regularReleases.releases.slice(0, 3); // Return top 3 as "featured"
      }
      
      console.warn(`No releases found in top releases response for label ${labelId}`);
      return [];
    } catch (error) {
      console.error(`Error fetching top releases for label ${labelId}:`, error);
      return [];
    }
  }

  /**
   * Get all releases for a specific artist
   * @param artistId The ID of the artist
   * @returns Promise resolving to an object with releases array
   */
  public async getArtistReleases(artistId: string): Promise<{releases: Release[]}> {
    try {
      console.log(`Fetching releases for artist: ${artistId}`);
      
      // Use the dedicated artist-releases endpoint format
      const apiUrl = `/artist-releases/${artistId}`;
      console.log(`[DEBUG] Using artist releases endpoint: ${apiUrl}`);
      
      const response = await this.fetchApi<ApiResponse>(apiUrl);
      
      let processedReleases: Release[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`[DEBUG] Found ${response.data.length} releases in artist-releases response.data`);
        processedReleases = await this.processReleases({ releases: response.data });
      } else if (response.releases && Array.isArray(response.releases)) {
        console.log(`[DEBUG] Found ${response.releases.length} releases in artist-releases response.releases`);
        processedReleases = await this.processReleases(response as { releases: any[] });
      } else {
        console.warn(`No releases found for artist ${artistId}`);
      }
      
      return { releases: processedReleases };
    } catch (error) {
      console.error(`Error fetching releases for artist ${artistId}:`, error);
      return { releases: [] };
    }
  }

  private formatArtist(artist: any): Artist {
    if (!artist) {
      console.warn('[DEBUG] Attempt to format null or undefined artist');
      return {
        id: '',
        name: 'Unknown Artist',
        image_url: 'https://via.placeholder.com/300?text=Artist+Image',
        spotify_url: '',
        type: 'artist',
        external_urls: { spotify: '' },
        uri: ''
      };
    }
    
    // Log the artist object to help with debugging
    console.log(`[DEBUG] Formatting artist:`, JSON.stringify({
      id: artist.id,
      name: artist.name,
      hasImageUrl: !!artist.image_url,
      hasImages: !!(artist.images && artist.images.length),
      hasPhotoUrl: !!artist.photo_url
    }));
    
    // Fix missing image URLs - check all possible image locations
    if (!artist.image_url) {
      // Try the images array first
      if (artist.images && artist.images.length > 0) {
        artist.image_url = artist.images[0].url;
        console.log(`[DEBUG] Set artist image from images array: ${artist.image_url}`);
      } 
      // Try image property if present
      else if (artist.image && artist.image.url) {
        artist.image_url = artist.image.url;
        console.log(`[DEBUG] Set artist image from image object: ${artist.image_url}`);
      }
      // Try photo_url if present 
      else if (artist.photo_url) {
        artist.image_url = artist.photo_url;
        console.log(`[DEBUG] Set artist image from photo_url: ${artist.image_url}`);
      }
      // Try avatar_url if present (from GitHub API format)
      else if (artist.avatar_url) {
        artist.image_url = artist.avatar_url;
        console.log(`[DEBUG] Set artist image from avatar_url: ${artist.image_url}`);
      }
      // Try profile_image if present (from some API formats)
      else if (artist.profile_image) {
        artist.image_url = typeof artist.profile_image === 'string' 
          ? artist.profile_image 
          : artist.profile_image.url || '';
        console.log(`[DEBUG] Set artist image from profile_image: ${artist.image_url}`);
      }
      // Set a default if nothing is found
      else {
        artist.image_url = 'https://via.placeholder.com/300?text=Artist+Image';
        console.log(`[DEBUG] Set default artist image`);
      }
    }
    
    // Ensure spotify_url has the full URL if it's just an ID
    if (artist.spotify_url && !artist.spotify_url.startsWith('http')) {
      artist.spotify_url = `https://open.spotify.com/artist/${artist.spotify_url}`;
    }
    
    // Ensure other required properties have values to display
    artist.name = artist.name || 'Unknown Artist';
    artist.type = artist.type || 'artist';
    
    // Create a standardized artist object to ensure all required fields are present
    const standardizedArtist: Artist = {
      id: artist.id || '',
      name: artist.name || 'Unknown Artist',
      uri: artist.uri || artist.spotify_uri || '',
      type: artist.type || 'artist',
      external_urls: artist.external_urls || { spotify: artist.spotify_url || '' },
      spotify_url: artist.spotify_url || artist.external_urls?.spotify || '',
      image_url: artist.image_url || ''
    };
    
    return standardizedArtist;
  }

  public async adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
    try {
      return await this.fetchApi<AdminLoginResponse>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  public async verifyAdminToken(): Promise<TokenVerificationResponse> {
    try {
      return await this.fetchApi<TokenVerificationResponse>('/admin/verify');
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }

  public async getTracksByArtist(artistId: string): Promise<Track[]> {
    console.log(`DatabaseService.getTracksByArtist - Fetching tracks for artist ID: ${artistId}`);
    try {
      const response = await this.fetchApi<{
        tracks: any[];
      }>(`/artists/${artistId}/tracks`);
      
      if (response.tracks && Array.isArray(response.tracks)) {
        console.log(`Received ${response.tracks.length} tracks for artist ${artistId}`);
        const processedTracks = await this.processTracks({ tracks: response.tracks });
        return processedTracks;
      }
      
      console.warn(`Received empty or invalid tracks array for artist ${artistId}`);
      return [];
    } catch (error) {
      console.error('Error fetching tracks by artist:', error);
      throw error;
    }
  }

  // Get releases by artist without using the /releases endpoint
  private async getReleasesForArtist(artistId: string): Promise<Release[]> {
    try {
      console.log(`Getting releases for artist via standalone request: ${artistId}`);
      const response = await this.fetchApi<ApiResponse<Release>>(`/artists/${artistId}/releases`);
      
      if (response?.data && Array.isArray(response.data)) {
        return this.processReleases({ releases: response.data });
      } else if (response.releases && Array.isArray(response.releases)) {
        return this.processReleases({ releases: response.releases });
      }
      
      return [];
    } catch (error) {
      console.error(`Error getting releases for artist ${artistId}:`, error);
      return [];
    }
  }
}

export const databaseService = DatabaseService.getInstance();
