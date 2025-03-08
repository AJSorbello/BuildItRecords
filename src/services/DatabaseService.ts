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

  public async getReleasesByLabel(
    labelId: string,
    offset = 0,
    limit = 50
  ): Promise<{
    releases: Release[];
    totalReleases: number;
    totalTracks: number;
    hasMore: boolean;
  }> {
    try {
      console.log(`Getting releases for label: ${labelId}`);
      
      // Special logging for buildit-records to help debug production issues
      if (labelId === 'buildit-records') {
        console.log('[DEBUG] Detected buildit-records label request');
        console.log('[DEBUG] Current environment:', process.env.NODE_ENV);
        console.log('[DEBUG] Making request to:', `${this.baseUrl}/releases?label=${labelId}`);
        
        // Try fetching the diagnostic data first to understand the database state
        try {
          console.log('[DEBUG] Fetching diagnostic data to check database state');
          const diagnosticData = await this.fetchApi<any>(`/diagnostic`);
          console.log('[DEBUG] Diagnostic data received:', !!diagnosticData);
          
          if (diagnosticData && diagnosticData.diagnosticResults) {
            console.log('[DEBUG] Database has tables:', diagnosticData.diagnosticResults.tables);
            
            // Check if we can find the correct label value from diagnostic info
            if (diagnosticData.diagnosticResults.labelInfo && 
                diagnosticData.diagnosticResults.labelInfo.possibleBuilditLabels) {
              console.log('[DEBUG] Possible BuildIt label values:', 
                diagnosticData.diagnosticResults.labelInfo.possibleBuilditLabels);
            }
          }
        } catch (diagError) {
          console.error('[DEBUG] Error fetching diagnostic data:', diagError);
        }
      }
      
      const response = await this.fetchApi<ApiResponse>(
        `/releases?label=${labelId}&offset=${offset}&limit=${limit}`
      );
      
      if (response.releases && Array.isArray(response.releases)) {
        console.log(`Received ${response.releases.length} releases for label ${labelId}`);
        const processedReleases = await this.processReleases({ releases: response.releases });
        const total = response.total || 0;

        return {
          releases: processedReleases,
          totalReleases: total,
          totalTracks: response.count || 0,
          hasMore: offset + processedReleases.length < total
        };
      }
      
      // Enhanced logging for empty results
      if (labelId === 'buildit-records') {
        console.warn(`[DEBUG] Received empty or invalid releases array for buildit-records`);
        console.warn(`[DEBUG] Response structure:`, JSON.stringify(response, null, 2));
        
        // Try an alternative approach for the production environment
        try {
          console.log('[DEBUG] Trying alternative query for buildit-records with ILIKE search');
          // Try fetching with the /api/diagnostic endpoint which has our special ILIKE search
          const alternativeResponse = await this.fetchApi<any>(`/diagnostic`);
          console.log('[DEBUG] Alternative query response received');
          
          if (alternativeResponse && alternativeResponse.diagnosticResults && 
              alternativeResponse.diagnosticResults.releasesInfo && 
              alternativeResponse.diagnosticResults.releasesInfo.likeBuilditCount) {
            console.log('[DEBUG] Found potential releases with LIKE %buildit%:', 
              alternativeResponse.diagnosticResults.releasesInfo.likeBuilditCount);
          }
        } catch (altError) {
          console.error('[DEBUG] Error in alternative query:', altError);
        }
      } else {
        console.warn(`Received empty or invalid releases array for label ${labelId}`);
      }
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

  public async getTopReleases(labelId: string): Promise<Release[]> {
    try {
      console.log(`Getting top releases for label: ${labelId}`);
      const response = await this.fetchApi<ApiResponse>(`/releases/top?label=${labelId}`);
      
      if (response.releases && Array.isArray(response.releases)) {
        console.log(`Received ${response.releases.length} top releases for label ${labelId}`);
        return this.processReleases({ releases: response.releases });
      }
      
      console.warn(`Received empty or invalid top releases array for label ${labelId}`);
      return [];
    } catch (error) {
      if (error instanceof DatabaseError && error.message.includes('404')) {
        console.warn(`Label not found: ${labelId}`);
        return [];
      }
      console.error('Error fetching top releases:', error);
      throw error;
    }
  }

  /**
   * Get releases for a specific label
   * This method exists for backward compatibility with components that call getReleasesByLabelId
   * @param labelId The ID of the label
   * @param page The page number for pagination
   * @param limit The number of releases per page
   * @returns Promise resolving to releases, count, and pagination info
   */
  public async getReleasesByLabelId(
    labelId: string,
    page = 1,
    limit = 50
  ): Promise<{
    releases: Release[];
    totalReleases: number;
    totalTracks: number;
    hasMore: boolean;
  }> {
    // Convert page to offset for getReleasesByLabel
    const offset = (page - 1) * limit;
    
    // Call the existing method
    return this.getReleasesByLabel(labelId, offset, limit);
  }

  public async processReleases(response: { releases: any[] }): Promise<Release[]> {
    try {
      const releases = response.releases.map((release) => {
        // Create a properly typed Release object
        const typedRelease: Release = {
          id: release.id || '',
          name: release.name || '',
          title: release.name || '',
          type: 'album',
          release_date: release.release_date || '',
          images: Array.isArray(release.images) ? release.images : 
                 (release.artwork_url ? [{ url: release.artwork_url, height: 300, width: 300 }] : []),
          artists: Array.isArray(release.artists) ? 
                  release.artists.map((artist: any) => this.mapSpotifyArtistToArtist(artist)) : [],
          label_id: release.label_id || '',
          label_name: release.label_name || null,
          total_tracks: release.total_tracks || 0,
          external_urls: { 
            spotify: release.external_urls?.spotify || release.spotify_url || '' 
          },
          spotify_url: release.spotify_url || release.external_urls?.spotify || '',
          spotify_uri: release.spotify_uri || release.uri || '',
          uri: release.uri || release.spotify_uri || '',
          tracks: Array.isArray(release.tracks) ? 
                 release.tracks.map((track: any) => this.createTrack(track)) : [],
          status: release.status || 'active'
        };

        return typedRelease;
      });

      return releases;
    } catch (error) {
      console.error('Error processing releases:', error);
      return [];
    }
  }

  public async processTracks(response: { tracks: any[] }): Promise<Track[]> {
    try {
      if (!response.tracks || !Array.isArray(response.tracks)) {
        console.error('Invalid tracks data:', response);
        return [];
      }
      
      // Use the createTrack method to ensure proper typing
      const tracks: Track[] = response.tracks.map(track => this.createTrack(track));
      
      return tracks;
    } catch (error) {
      console.error('Error processing tracks:', error);
      return [];
    }
  }

  // Helper function to create a properly typed Track object from API response
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
      artists: Array.isArray(trackData.artists) ? trackData.artists.map((a: any) => this.mapSpotifyArtistToArtist(a)) : [],
      isrc: trackData.isrc || '',
      external_urls: { spotify: trackData.external_urls?.spotify || trackData.spotify_url || '' },
      type: 'track',
      remixer: trackData.remixer,
    };
    
    // Add release data if available
    if (trackData.release) {
      const albumData = trackData.release;
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
      console.log(`[DEBUG] Fetching artists for label: ${id}`);
      
      // Special handling for buildit-records
      if (id === 'buildit-records') {
        console.log('[DEBUG] Fetching artists for buildit-records label');
        
        // Try using the diagnostic endpoint first to get information
        try {
          console.log('[DEBUG] Fetching diagnostic data to understand database state');
          const diagnosticData = await this.fetchApi<any>(`/diagnostic`);
          
          if (diagnosticData && diagnosticData.diagnosticResults) {
            const artists = diagnosticData.diagnosticResults.artistsInfo || {};
            console.log('[DEBUG] Artist diagnostic info:', {
              totalArtists: artists.totalCount,
              builditArtistsCount: artists.builditRecordsCount,
              caseInsensitiveCount: artists.caseInsensitiveCount
            });
          }
        } catch (diagError) {
          console.error('[DEBUG] Error fetching artists diagnostic:', diagError);
        }
      }
      
      const response = await this.fetchApi<{
        success: boolean;
        data: {
          artists: any[];
        };
      }>(`/artists?label=${id}`);
      
      if (!response?.success || !response?.data?.artists) {
        console.error('Invalid response format from server:', response);
        
        // For buildit-records, attempt alternative approaches
        if (id === 'buildit-records') {
          console.log('[DEBUG] Trying alternative approach for buildit-records artists');
          
          try {
            // Try fetching directly with the enhanced diagnostic endpoint
            const diagnosticData = await this.fetchApi<any>(`/diagnostic`);
            if (diagnosticData && diagnosticData.diagnosticResults && 
                diagnosticData.diagnosticResults.artistsInfo && 
                diagnosticData.diagnosticResults.artistsInfo.sampleArtists) {
              
              console.log('[DEBUG] Diagnostic endpoint returned sample artists');
              return diagnosticData.diagnosticResults.artistsInfo.sampleArtists;
            }
          } catch (altError) {
            console.error('[DEBUG] Alternative artist approach failed:', altError);
          }
        }
        
        return [];
      }

      // Extra logging for buildit-records
      if (id === 'buildit-records') {
        console.log(`[DEBUG] Found ${response.data.artists.length} artists for buildit-records`);
        if (response.data.artists.length > 0) {
          console.log('[DEBUG] Sample artist:', {
            id: response.data.artists[0].id,
            name: response.data.artists[0].name,
            labelId: response.data.artists[0].label_id
          });
        }
      }

      return response.data.artists.map(artist => this.mapSpotifyArtistToArtist(artist));
    } catch (error) {
      console.error('Error fetching artists for label:', error);
      throw new DatabaseError('Failed to fetch artists');
    }
  }

  /**
   * Get all releases associated with a specific artist across all labels
   * @param artistId The ID of the artist
   */
  public async getReleasesByArtist(artistId: string): Promise<Release[]> {
    try {
      console.log(`Fetching releases for artist ${artistId}`);
      
      const endpoint = `/artists/releases/${artistId}`;
      
      const response = await this.fetchApi<ApiResponse>(endpoint);
      
      if (!response.releases || !Array.isArray(response.releases)) {
        console.warn(`No releases found for artist ${artistId}`);
        return [];
      }
      
      // Transform the data and use type assertion to bypass TypeScript checking
      return response.releases.map(release => {
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
          tracks: (release.tracks || []).map(track => this.createTrack(track)),
          label: release.label || { name: release.label_name ? String(release.label_name) : '' }
        };
        
        // Use type assertion to tell TypeScript this matches the Release interface
        return releaseObj as unknown as Release;
      });
      
    } catch (error) {
      console.error(`Error fetching releases for artist ${artistId}:`, error);
      return [];
    }
  }

  public async getArtistsByLabel(labelId: string): Promise<Artist[]> {
    try {
      console.log(`[DatabaseService] Fetching artists by label with ID: ${labelId}`);
      const response = await this.fetchApi<{
        artists: any[];
      }>(`/labels/${labelId}/artists`);
      
      if (response.artists && Array.isArray(response.artists)) {
        console.log(`[DatabaseService] Got ${response.artists.length} artists`);
        
        // Process the artists to match the exact Artist interface from index.ts
        const processedArtists = response.artists.map(artist => {
          return {
            id: artist.id,
            name: artist.name,
            uri: artist.uri || artist.spotify_uri || '',
            type: 'artist',
            external_urls: artist.external_urls || { spotify: artist.spotify_url || '' },
            spotify_url: artist.spotify_url || artist.external_urls?.spotify || '',
            image_url: artist.image_url || artist.images?.[0]?.url || ''
          } as Artist;
        });
        
        return processedArtists;
      }
      
      console.warn('[DatabaseService] No artists found for label:', labelId);
      return [];
    } catch (error) {
      console.error('[DatabaseService] Error fetching artists by label:', error);
      throw error;
    }
  }

  private fixTrackFields(track: any): Track {
    // Use our standard createTrack method for consistent handling
    return this.createTrack(track);
  }

  private formatArtist(artist: any): Artist {
    // Use our standard artist mapping method for consistent handling
    return this.mapSpotifyArtistToArtist(artist);
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
      spotify_url: artist.external_urls?.spotify || artist.spotify_url || '',
      image_url: artist.images?.[0]?.url || '',
      type: 'artist'
    };
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
}

export const databaseService = DatabaseService.getInstance();
