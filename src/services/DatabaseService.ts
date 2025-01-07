import axios, { AxiosRequestConfig } from 'axios';
import { Track } from '../types/track';
import type { Release } from '../types/release';
import { Artist } from '../types/artist';
import { RecordLabel } from '../constants/labels';
import { createRelease } from '../types/release';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface Label {
  id: string;
  name: string;
  description?: string;
  website?: string;
}

interface PaginatedResponse<T> {
  releases: T[];
  totalReleases: number;
  currentPage: number;
  totalPages: number;
}

class DatabaseService {
  private static instance: DatabaseService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = `${API_BASE_URL}`;
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async request<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
    try {
      const url = `${this.baseUrl}/api${endpoint}`;
      console.log('Making request to:', url);
      
      const response = await axios({
        url,
        ...options,
      });
      console.log('Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  // Labels
  public async getLabels(): Promise<Label[]> {
    return this.request<Label[]>('/labels');
  }

  // Artists
  public async getArtists(params: { label?: string; search?: string } = {}): Promise<Artist[]> {
    const queryParams = new URLSearchParams();
    if (params.label) queryParams.set('labelId', params.label);
    if (params.search) queryParams.set('search', params.search);

    const queryString = queryParams.toString();
    return this.request<Artist[]>(`/artists${queryString ? `?${queryString}` : ''}`);
  }

  public async getArtistById(id: string): Promise<Artist & { releases: Release[] }> {
    const artist = await this.request<Artist>(`/artists/${id}`);
    const releases = await this.getReleasesByArtistId(id);
    return { ...artist, releases };
  }

  public async getArtistsForLabel(labelId: string): Promise<Artist[]> {
    try {
      const response = await this.request<{ artists: Artist[] }>(`/labels/${labelId}/artists`);
      return response.artists;
    } catch (error) {
      console.error(`Error fetching artists for label ${labelId}:`, error);
      return [];
    }
  }

  // Releases
  public async getReleases(params: { artistId?: string; labelId?: string } = {}): Promise<Release[]> {
    try {
      if (params.labelId) {
        return this.getReleasesByLabelId(params.labelId);
      }
      if (params.artistId) {
        return this.getReleasesByArtistId(params.artistId);
      }
      return this.request<Release[]>('/releases');
    } catch (error) {
      console.error('Error fetching releases:', error);
      return [];
    }
  }

  public async getReleasesByArtistId(artistId: string): Promise<Release[]> {
    return this.request<Release[]>(`/artists/${artistId}/releases`);
  }

  async getReleasesByLabelId(labelId: string): Promise<PaginatedResponse<Release>> {
    try {
      console.log('Fetching releases for label:', labelId);
      const endpoint = `/releases/${labelId}`;
      console.log('Using endpoint:', endpoint);
      
      const response = await this.request<Release[] | PaginatedResponse<Release>>(endpoint);
      console.log('Raw server response:', response);

      // Handle both paginated and non-paginated responses
      const releases = Array.isArray(response) ? response : response.releases || [];
      console.log('Extracted releases:', releases);

      if (!releases || releases.length === 0) {
        console.log('No releases found');
        return {
          releases: [],
          totalReleases: 0,
          currentPage: 1,
          totalPages: 1
        };
      }

      // Transform the server response to match our Release type
      const transformedReleases = releases.map((release: Partial<Release>): Release => {
        console.log('Processing release:', release);
        
        // Get the best quality image URL from the album images array
        const artworkUrl = release.album?.images?.[0]?.url || 
                          release.artwork_url || 
                          release.albumCover;
        console.log('Artwork URL:', artworkUrl);

        // Transform tracks if they exist
        const tracks = (release.tracks || []).map((track: Partial<Track>) => {
          console.log('Processing track:', track);
          return {
            id: track.id || '',
            name: track.name || '',
            artists: track.artists || [],
            album: {
              name: release.name || '',
              artwork_url: artworkUrl
            },
            artwork_url: artworkUrl,
            albumCover: artworkUrl,
            release_date: track.release_date || release.release_date || '',
            preview_url: track.preview_url,
            spotifyUrl: track.spotifyUrl || track.external_urls?.spotify,
            label_id: labelId
          };
        });

        console.log('Transformed tracks:', tracks);

        return createRelease({
          id: release.id || '',
          name: release.name || '',
          type: release.type || 'single',
          artists: release.artists || [],
          artwork_url: artworkUrl,
          albumCover: artworkUrl,
          album: {
            name: release.name || '',
            artwork_url: artworkUrl,
            images: release.images
          },
          release_date: release.release_date || '',
          total_tracks: release.total_tracks || 1,
          tracks: tracks,
          label: { id: labelId, name: labelId }
        });
      });

      console.log('All transformed releases:', transformedReleases);
      
      // Return paginated response
      const paginatedResponse: PaginatedResponse<Release> = {
        releases: transformedReleases,
        totalReleases: transformedReleases.length,
        currentPage: 1,
        totalPages: 1
      };

      console.log('Final paginated response:', paginatedResponse);
      return paginatedResponse;
    } catch (error) {
      console.error('Error fetching releases:', error);
      return {
        releases: [],
        totalReleases: 0,
        currentPage: 1,
        totalPages: 1
      };
    }
  }

  async saveTrack(track: Track): Promise<Track> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/tracks`, {
        id: track.id,
        name: track.name,
        artists: track.artists,
        album: track.album,
        albumCover: track.albumCover,
        releaseDate: track.releaseDate,
        spotifyUrl: track.spotifyUrl,
        preview_url: track.preview_url,
        recordLabel: track.recordLabel,
        beatportUrl: track.beatportUrl,
        soundcloudUrl: track.soundcloudUrl
      });
      return response.data;
    } catch (error) {
      console.error('Error saving track:', error);
      throw error;
    }
  }

  public async saveTracks(tracks: Track[]): Promise<Track[]> {
    try {
      console.log('Saving tracks:', tracks);
      const response = await this.request<Track[]>('/tracks/batch', {
        method: 'POST',
        data: { tracks }
      });
      console.log('Saved tracks response:', response);
      return response;
    } catch (error) {
      console.error('Error saving tracks:', error);
      throw error;
    }
  }

  // Tracks
  public async getTracksFromApi(): Promise<Track[]> {
    return this.request<Track[]>('/tracks');
  }

  public async getTrackById(id: string): Promise<Track> {
    return this.request<Track>(`/tracks/${id}`);
  }

  public async getTracksByLabel(label: RecordLabel): Promise<Track[]> {
    const queryParams = new URLSearchParams();
    queryParams.set('label', this.getLabelPath(label));
    return this.request<Track[]>(`/tracks?${queryParams.toString()}`);
  }

  public async importTracks(tracks: Track[]): Promise<Track[]> {
    try {
      console.log('Importing tracks:', tracks);
      const response = await this.request<Track[]>('/tracks/import', {
        method: 'POST',
        data: { tracks }
      });
      console.log('Import response:', response);
      return response;
    } catch (error) {
      console.error('Error importing tracks:', error);
      throw error;
    }
  }

  public async updateTrack(trackId: string, updates: Partial<Track>): Promise<Track> {
    try {
      const response = await axios.put(`${this.baseUrl}/api/tracks/${trackId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating track:', error);
      throw error;
    }
  }

  // Helper methods
  private getLabelPath(label: RecordLabel | string): string {
    return typeof label === 'string' ? label : label.id;
  }
}

export const databaseService = DatabaseService.getInstance();
export default DatabaseService;
