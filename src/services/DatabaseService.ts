import axios, { AxiosRequestConfig } from 'axios';
import { Track } from '../types/track';
import { Album, Release } from '../types/release';
import { Artist } from '../types/artist';
import { RecordLabel } from '../constants/labels';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface Label {
  id: string;
  name: string;
  description?: string;
  website?: string;
}

class DatabaseService {
  private static instance: DatabaseService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = API_BASE_URL;
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async request<T>(url: string, options: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await axios({
        url: `${this.baseUrl}${url}`,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('API request failed:', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
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
    if (params.label) queryParams.set('label', params.label);
    if (params.search) queryParams.set('search', params.search);

    const queryString = queryParams.toString();
    return this.request<Artist[]>(`/artists${queryString ? `?${queryString}` : ''}`);
  }

  public async getArtistById(id: string): Promise<Artist & { releases: Release[] }> {
    const artist = await this.request<Artist>(`/artists/${id}`);
    const releases = await this.getReleasesByArtistId(id);
    return { ...artist, releases };
  }

  public async getArtistsForLabel(label: RecordLabel): Promise<(Artist & { releases: Release[] })[]> {
    const artists = await this.getArtists({ label });

    const artistsWithReleases = await Promise.all(
      artists.map(async (artist) => {
        const releases = await this.getReleasesByArtistId(artist.id);
        return { ...artist, releases };
      })
    );

    return artistsWithReleases;
  }

  // Releases
  public async getReleases(params: { artistId?: string; labelId?: string; label?: RecordLabel } = {}): Promise<Release[]> {
    const queryParams = new URLSearchParams();
    if (params.artistId) queryParams.set('artistId', params.artistId);
    if (params.labelId) queryParams.set('labelId', params.labelId);
    if (params.label) queryParams.set('label', params.label.toLowerCase());

    try {
      const queryString = queryParams.toString();
      const albums = await this.request<Album[]>(`/tracks${queryString ? `?${queryString}` : ''}`);
      return albums.map((album) => ({
        ...album,
        artist: album.artists[0]?.name || '',
      }));
    } catch (error) {
      console.error('Error fetching releases:', error);
      return [];
    }
  }

  public async getReleasesByArtistId(artistId: string): Promise<Release[]> {
    return this.getReleases({ artistId });
  }

  public async getReleasesByLabel(label: RecordLabel): Promise<Release[]> {
    try {
      const releases = await this.getReleases({ label });
      return releases;
    } catch (error) {
      console.error(`Error fetching releases for label ${label}:`, error);
      return [];
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
      // Get existing tracks to check for duplicates
      const existingTracks = await this.getTracksFromApi();
      
      // Filter out duplicates based on Spotify ID
      const newTracks = tracks.filter(track => 
        !existingTracks.some(existing => existing.id === track.id)
      );

      if (newTracks.length === 0) {
        console.log('No new tracks to import - all tracks already exist');
        return [];
      }

      // Import only new tracks
      const response = await axios.post(`${this.baseUrl}/tracks/import`, {
        tracks: newTracks
      });

      console.log(`Imported ${newTracks.length} new tracks`);
      return response.data;
    } catch (error) {
      console.error('Error importing tracks:', error);
      throw error;
    }
  }

  public async updateTrack(trackId: string, updates: Partial<Track>): Promise<Track> {
    try {
      const response = await axios.put(`${this.baseUrl}/tracks/${trackId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating track:', error);
      throw error;
    }
  }

  // Search methods
  public async searchTracks(query: string): Promise<Track[]> {
    return this.request<Track[]>(`/search/tracks?q=${encodeURIComponent(query)}`);
  }

  public async searchArtists(query: string): Promise<Artist[]> {
    return this.request<Artist[]>(`/search/artists?q=${encodeURIComponent(query)}`);
  }

  public async searchReleases(query: string): Promise<Release[]> {
    const albums = await this.request<Album[]>(`/search/releases?q=${encodeURIComponent(query)}`);
    return albums.map((album) => ({
      ...album,
      artist: album.artists[0]?.name || '',
    }));
  }

  // Helper methods
  private getLabelPath(label: RecordLabel | string): string {
    return label.toLowerCase().replace('_', '-');
  }
}

export const databaseService = DatabaseService.getInstance();
export default DatabaseService;
