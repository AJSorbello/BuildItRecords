/**
 * @fileoverview Service for handling database operations and API calls
 * @module services/DatabaseService
 */

import { Track } from '../types/track';
import { Release } from '../types/release';
import { Artist } from '../types/artist';
import { SpotifyImage } from '../types/spotify';
import { DatabaseError } from '../utils/errors';
import { Album } from '../types/track';
import { getApiBaseUrl } from '../utils/apiConfig';

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
      // In production or if using the Vite dev server proxy
      apiUrl = `/api${endpoint}`;
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
          console.log('[DEBUG] Response properties:', Object.keys(data));
          
          // Log meta information if it exists
          if ('_meta' in data) {
            console.log('[DEBUG] Response meta:', data._meta);
          }
          
          // Log counts for arrays in the response
          for (const key of Object.keys(data)) {
            if (Array.isArray(data[key])) {
              console.log(`[DEBUG] Response ${key} count:`, data[key].length);
            }
          }
        }
        
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

  public async getReleasesByLabelId(
    labelId: string,
    offset: number = 0,
    limit: number = 50
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
        console.log('[DEBUG] Making request to:', `${this.baseUrl}/api/releases?label=${labelId}`);
        
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

  public async processReleases(response: { releases: Release[] }): Promise<Release[]> {
    try {
      const releases = response.releases.map((release) => {
        // Process images
        const processedImages = (release.images || []).map((img: SpotifyImage) => ({
          url: img.url,
          height: img.height !== null ? img.height : 0,
          width: img.width !== null ? img.width : 0
        }));
        
        // Ensure we have an artwork_url by using the first image if available
        const artwork_url = release.artwork_url || 
                           (release.images && release.images.length > 0 && release.images[0].url) || 
                           '';
        
        // Log artists information for debugging
        console.log('Processing release:', release.title);
        console.log('  Release artwork_url:', artwork_url);
        console.log('  Release artists:', release.artists?.length || 0);
        if (release.artists && release.artists.length > 0) {
          console.log('  Release artists details:');
          release.artists.forEach((artist, i) => {
            console.log(`    Artist ${i+1}: ${artist.name} (${artist.id})`);
            console.log(`      Image URLs: ${artist.profile_image_url ? 'Yes' : 'No'}, ${artist.profile_image_small_url ? 'Yes' : 'No'}, ${artist.profile_image_large_url ? 'Yes' : 'No'}`);
          });
        }
        console.log('  Release tracks:', release.tracks?.length || 0);
        
        if (release.tracks && release.tracks.length > 0) {
          console.log('  Track artists:');
          release.tracks.forEach((track, i) => {
            console.log(`    Track ${i+1}: ${track.title} has ${track.artists?.length || 0} artists`);
            if (track.artists && track.artists.length > 0) {
              track.artists.forEach((artist, j) => {
                console.log(`      Artist ${j+1}: ${artist.name} (${artist.id})`);
                console.log(`        Image URLs: ${artist.profile_image_url ? 'Yes' : 'No'}, ${artist.profile_image_small_url ? 'Yes' : 'No'}, ${artist.profile_image_large_url ? 'Yes' : 'No'}`);
              });
            }
          });
        }

        return {
          id: release.id,
          title: release.title || 'Unknown Album',
          type: 'album' as const,
          artists: release.artists || [],
          tracks: release.tracks || [],
          images: processedImages,
          artwork_url: artwork_url,
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
        const processedRelease: Album | undefined = release ? {
          id: release.id,
          name: release.title || 'Unknown Album',
          title: release.title || 'Unknown Album',
          type: 'album',
          artists: release.artists || [],
          tracks: [],
          images: (release.images || []).map((img: SpotifyImage) => ({
            url: img.url,
            height: img.height !== null ? img.height : 0,
            width: img.width !== null ? img.width : 0
          })),
          artwork_url: release.artwork_url,
          release_date: release.release_date,
          spotify_url: release.spotify_url || '',
          spotify_uri: release.spotify_uri || '',
          label_id: '',
          total_tracks: release.total_tracks || 0
        } : undefined;

        return {
          id: track.id,
          title: track.title || 'Unknown Track',
          name: track.title || 'Unknown Track',
          duration: track.duration_ms || 0,
          track_number: 1,
          disc_number: 1,
          preview_url: track.preview_url,
          spotify_url: '',
          spotify_uri: '',
          release: processedRelease,
          artists: track.artists || [],
          remixer: track.remixer,
          isrc: '',
          external_urls: { spotify: '' },
          type: 'track'
        } satisfies Track;
      });

      return tracks;
    } catch (error) {
      console.error('Error processing tracks:', error);
      throw error;
    }
  }

  public async getTracksByLabel(labelId: string, sortBy = 'created_at'): Promise<{
    tracks: Track[];
    total: number;
  }> {
    try {
      const response = await this.fetchApi<ApiResponse>(`/tracks/all/${labelId}?sort=${sortBy}`);
      
      if (response.tracks && Array.isArray(response.tracks)) {
        console.log(`Received ${response.tracks.length} tracks for label ${labelId}`);
        const processedTracks = await this.processTracks({ tracks: response.tracks });

        return {
          tracks: processedTracks,
          total: response.total || 0,
        };
      }
      
      console.warn(`Received empty or invalid tracks array for label ${labelId}`);
      return {
        tracks: [],
        total: 0,
      };
    } catch (error) {
      console.error('Error fetching tracks:', error);
      throw error;
    }
  }

  public async importTracksFromSpotify(labelId: string): Promise<ImportResponse> {
    try {
      const response = await this.fetchApi<ImportResponse>(
        `/tracks/import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ labelId })
        }
      );
      return response;
    } catch (error) {
      console.error('Error importing tracks:', error);
      throw error;
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
          artists: Artist[];
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

      return response.data.artists;
    } catch (error) {
      console.error('Error fetching artists for label:', error);
      throw new DatabaseError('Failed to fetch artists');
    }
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
    try {
      console.log(`Fetching tracks for artist: ${artistId}`);
      const response = await this.fetchApi<{
        artist: Artist,
        tracks: Track[]
      }>(`/artists/${artistId}/tracks`);
      
      if (response.tracks && Array.isArray(response.tracks)) {
        console.log(`Found ${response.tracks.length} tracks for artist: ${response.artist.name}`);
        
        // Process the tracks to ensure they match the Track interface format
        const processedTracks = response.tracks.map(track => {
          return {
            id: track.id,
            title: track.title || 'Unknown Track',
            name: track.title || 'Unknown Track',
            duration: track.duration_ms || 0,
            track_number: 1,
            disc_number: 1,
            preview_url: track.preview_url,
            spotify_url: track.spotify_url || '',
            spotify_uri: '',
            release: track.release ? {
              id: track.release.id,
              name: track.release.title || 'Unknown Album',
              title: track.release.title || 'Unknown Album',
              type: 'album',
              artists: [],
              tracks: [],
              images: [],
              artwork_url: track.release.artwork_url,
              release_date: track.release.release_date,
              spotify_url: '',
              spotify_uri: '',
              label_id: track.release.label?.id || '',
              total_tracks: 0,
              label: track.release.label ? {
                id: track.release.label.id,
                name: track.release.label.name,
                display_name: track.release.label.display_name
              } : undefined
            } : undefined,
            artists: track.artists || [],
            remixer: track.remixer,
            isrc: track.isrc || '',
            external_urls: { spotify: track.spotify_url || '' },
            type: 'track',
            is_remixer: track.is_remixer
          } satisfies Track;
        });

        return processedTracks;
      }
      
      console.warn(`Received empty or invalid tracks array for artist ${artistId}`);
      return [];
    } catch (error) {
      console.error('Error fetching tracks by artist:', error);
      throw error;
    }
  }

  /**
   * Get all releases associated with a specific artist across all labels
   * @param artistId The ID of the artist
   */
  public async getReleasesByArtist(artistId: string): Promise<Release[]> {
    console.log(`DatabaseService.getReleasesByArtist - Fetching releases for artist ID: ${artistId}`);
    try {
      const response = await this.fetchApi<{
        releases: Release[];
      }>(`/artists/${artistId}/all-releases`);
      
      if (response.releases && Array.isArray(response.releases)) {
        console.log(`DatabaseService.getReleasesByArtist - Found ${response.releases.length} releases`);
        
        const processedReleases = response.releases.map(release => {
          return {
            id: release.id,
            title: release.title,
            artwork_url: release.artwork_url,
            release_date: release.release_date,
            catalog_number: release.catalog_number,
            label_id: release.label_id,
            spotify_url: release.spotify_url,
            spotify_id: release.spotify_id,
            spotify_uri: release.spotify_uri,
            label: release.label,
            tracks: release.tracks || [],
            tracks_count: release.tracks_count
          } as Release;
        });
        
        console.log('DatabaseService.getReleasesByArtist - Processed releases:', processedReleases);
        return processedReleases;
      }
      
      console.warn('DatabaseService.getReleasesByArtist - Received empty or invalid releases array');
      return [];
    } catch (error) {
      console.error('DatabaseService.getReleasesByArtist - Error:', error);
      return [];
    }
  }
}

export const databaseService = DatabaseService.getInstance();
