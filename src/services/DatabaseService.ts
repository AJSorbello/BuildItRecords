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
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('adminToken');

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new DatabaseError(
        errorData.message || 'API request failed',
        response.status,
        errorData.details
      );
    }

    return response.json();
  }

  public async getReleasesByLabelId(
    labelId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    releases: Release[];
    totalReleases: number;
    totalTracks: number;
    hasMore: boolean;
  }> {
    try {
      const offset = (page - 1) * limit;
      const response = await this.fetchApi<ApiResponse>(
        `/releases?label=${labelId}&offset=${offset}&limit=${limit}`
      );
      
      if (!response.releases) {
        throw new DatabaseError('No releases found in response');
      }

      const processedReleases = await this.processReleases({ releases: response.releases });
      const total = response.total || 0;

      return {
        releases: processedReleases,
        totalReleases: total,
        totalTracks: response.count || 0,
        hasMore: offset + processedReleases.length < total
      };
    } catch (error) {
      console.error('Error fetching releases:', error);
      throw error;
    }
  }

  public async getTopReleases(labelId: string): Promise<Release[]> {
    try {
      const response = await this.fetchApi<ApiResponse>(`/releases/top?label=${labelId}`);
      
      if (!response.releases) {
        throw new DatabaseError('No releases found in response');
      }

      return this.processReleases({ releases: response.releases });
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
      
      if (!response.tracks) {
        throw new DatabaseError('No tracks found in response');
      }

      const processedTracks = await this.processTracks({ tracks: response.tracks });

      return {
        tracks: processedTracks,
        total: response.total || 0,
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
      const response = await this.fetchApi<{
        success: boolean;
        data: {
          artists: Artist[];
        };
      }>(`/artists/label/${id}`);
      
      if (!response?.success || !response?.data?.artists) {
        console.error('Invalid response format from server:', response);
        return [];
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
      
      if (!response.tracks) {
        throw new DatabaseError('No tracks found in response');
      }

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
      
      if (!response || !response.releases) {
        console.log('DatabaseService.getReleasesByArtist - No releases found in response:', response);
        return [];
      }
      
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
    } catch (error) {
      console.error('DatabaseService.getReleasesByArtist - Error:', error);
      return [];
    }
  }
}

export const databaseService = DatabaseService.getInstance();
