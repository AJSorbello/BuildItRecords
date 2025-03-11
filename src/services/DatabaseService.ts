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
      }
      
      // Use the specific label ID in the request
      const response = await this.fetchApi<ApiResponse>(
        `/releases?label=${encodeURIComponent(labelId)}&offset=${offset}&limit=${limit}`
      );
      
      // Check for the data property first (Render API format)
      if (response.data && Array.isArray(response.data)) {
        console.log(`[DEBUG] Found releases in response.data: ${response.data.length} items`);
        
        // Ensure the releases are actually for this label
        const filteredReleases = response.data.filter((release: any) => {
          const releaseLabel = release.label_id || 
                             (release.label && typeof release.label === 'object' ? release.label.id : release.label);
          
          // Convert both to strings for comparison to handle numeric vs string IDs
          const releaseLabelStr = String(releaseLabel).toLowerCase();
          const requestedLabelStr = String(labelId).toLowerCase();
          
          // Check if the release belongs to the requested label
          const matches = releaseLabelStr === requestedLabelStr;
          
          if (!matches) {
            console.log(`[DEBUG] Filtering out release ${release.id} (${release.title || 'Untitled'}) - label ${releaseLabelStr} doesn't match ${requestedLabelStr}`);
          }
          
          return matches;
        });
        
        console.log(`[DEBUG] After filtering by label ID, found ${filteredReleases.length} out of ${response.data.length} releases`);
        
        // Process the filtered releases
        const processedReleases = await this.processReleases({ releases: filteredReleases });
        const total = response.total || filteredReleases.length || 0;

        return {
          releases: processedReleases,
          totalReleases: total,
          totalTracks: response.count || processedReleases.length || 0,
          hasMore: offset + processedReleases.length < total
        };
      }
      // Fall back to checking for releases property (legacy format)
      else if (response.releases && Array.isArray(response.releases)) {
        console.log(`Received ${response.releases.length} releases for label ${labelId}`);
        
        // Ensure the releases are actually for this label
        const filteredReleases = response.releases.filter((release: any) => {
          const releaseLabel = release.label_id || 
                             (release.label && typeof release.label === 'object' ? release.label.id : release.label);
          
          // Convert both to strings for comparison to handle numeric vs string IDs
          return String(releaseLabel).toLowerCase() === String(labelId).toLowerCase();
        });
        
        console.log(`[DEBUG] After filtering by label ID, found ${filteredReleases.length} out of ${response.releases.length} releases`);
        
        const processedReleases = await this.processReleases({ releases: filteredReleases });
        const total = response.total || filteredReleases.length || 0;

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
          console.log('[DEBUG] Trying alternative query for buildit-records with numeric ID');
          // Try with label ID "1" instead of string "buildit-records"
          const alternativeResponse = await this.fetchApi<ApiResponse>(
            `/releases?label=1&offset=${offset}&limit=${limit}`
          );
          
          if (alternativeResponse.data && Array.isArray(alternativeResponse.data)) {
            console.log(`[DEBUG] Alternative query succeeded with ${alternativeResponse.data.length} releases`);
            const processedReleases = await this.processReleases({ releases: alternativeResponse.data });
            return {
              releases: processedReleases,
              totalReleases: alternativeResponse.data.length,
              totalTracks: alternativeResponse.count || 0,
              hasMore: offset + processedReleases.length < alternativeResponse.data.length
            };
          } else if (alternativeResponse.releases && Array.isArray(alternativeResponse.releases)) {
            console.log(`[DEBUG] Alternative query succeeded with ${alternativeResponse.releases.length} releases (legacy format)`);
            const processedReleases = await this.processReleases({ releases: alternativeResponse.releases });
            return {
              releases: processedReleases,
              totalReleases: alternativeResponse.releases.length,
              totalTracks: alternativeResponse.count || 0,
              hasMore: offset + processedReleases.length < alternativeResponse.releases.length
            };
          }
        } catch (altError) {
          console.error('[DEBUG] Alternative query failed:', altError);
        }
      }

      return { releases: [], totalReleases: 0, totalTracks: 0, hasMore: false };
    } catch (error) {
      console.error(`Error getting releases for label ${labelId}:`, error);
      return { releases: [], totalReleases: 0, totalTracks: 0, hasMore: false };
    }
  }

  public async getTopReleases(labelId: string): Promise<Release[]> {
    try {
      console.log(`Getting top releases for label: ${labelId}`);
      const response = await this.fetchApi<ApiResponse>(`/releases/top?label=${labelId}`);
      
      // Check for data property first (Render API format)
      if (response.data && Array.isArray(response.data)) {
        console.log(`Received ${response.data.length} top releases in data for label ${labelId}`);
        return this.processReleases({ releases: response.data });
      }
      // Fall back to checking for releases property (legacy format)
      else if (response.releases && Array.isArray(response.releases)) {
        console.log(`Received ${response.releases.length} top releases for label ${labelId}`);
        return this.processReleases({ releases: response.releases });
      }
      
      console.warn(`No releases found in top releases response for label ${labelId}`);
      return [];
    } catch (error) {
      console.error(`Error fetching top releases for label ${labelId}:`, error);
      return [];
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
    if (!response.releases) {
      console.warn('No releases found in response');
      return [];
    }

    console.log(`Processing ${response.releases.length} releases`);
    console.log(`[DEBUG] Release types present:`, JSON.stringify(
      [...new Set(response.releases.map((r: any) => r.type || 'unknown'))]
    ));

    // Map the releases
    return response.releases.map((release: any) => {
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
        } else {
          // Set a placeholder image
          release.artwork_url = 'https://via.placeholder.com/300?text=No+Artwork';
          console.log(`[DEBUG] Set placeholder artwork for release ${release.id}`);
        }
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

      return release as Release;
    });
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
      
      // Updated to use the new dedicated endpoint that fixes the JSON error
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
      const response = await this.fetchApi<{
        artists: any[];
      }>(`/labels/${labelId}/artists`);
      
      if (response.artists && Array.isArray(response.artists)) {
        console.log(`[DatabaseService] Got ${response.artists.length} artists`);
        
        // Process the artists to match the exact Artist interface from index.ts
        const processedArtists = response.artists.map((artist: any) => {
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
    // Log the artist object to help with debugging
    console.log(`[DEBUG] Formatting artist:`, JSON.stringify({
      id: artist.id,
      name: artist.name,
      hasImageUrl: !!artist.image_url,
      hasImages: !!(artist.images && artist.images.length),
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
    
    return artist as Artist;
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
