import axios, { AxiosError } from 'axios';
import { Track } from '../types/track';
import { Release } from '../types/release';
import { Artist } from '../types/artist';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class DatabaseService {
  private static instance: DatabaseService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async request<T>(url: string, options: any = {}): Promise<T> {
    try {
      const response = await axios({
        url: `${this.baseUrl}${url}`,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('API request failed:', { url, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  private getLabelPath(label: RecordLabel | string): string {
    const normalizedLabel = label.toLowerCase().replace(/\s+/g, '-');
    return `buildit-${normalizedLabel}`;
  }

  // Tracks
  public async getTracks(label?: RecordLabel): Promise<Track[]> {
    const url = label ? `/tracks?label=${encodeURIComponent(label)}` : '/tracks';
    return this.request<Track[]>(url);
  }

  public async getTracksByLabel(label: RecordLabel): Promise<Track[]> {
    return this.request<Track[]>(`/tracks?label=${encodeURIComponent(label)}`);
  }

  public async getTracksForLabel(label: string): Promise<Track[]> {
    return this.request<Track[]>(`/tracks?label=${encodeURIComponent(label)}`);
  }

  public async getArtistsForLabel(label: RecordLabel): Promise<Artist[]> {
    try {
      // Convert the label to the format expected by the backend
      const labelValue = label.toLowerCase().replace('build-it-', '');
      const response = await this.request<Artist[]>(`/artists?label=${encodeURIComponent(labelValue)}`);
      return response.map(artist => ({
        ...artist,
        recordLabel: label
      }));
    } catch (error) {
      console.error('Error fetching artists for label:', error);
      throw error;
    }
  }

  public async addTrack(track: Track): Promise<string> {
    const response = await this.request<{ id: string }>('/tracks', {
      method: 'POST',
      data: track
    });
    return response.id;
  }

  public async updateTrack(id: string, track: Partial<Track>): Promise<void> {
    await axios.put(`${this.baseUrl}/tracks/${id}`, track);
  }

  public async deleteTrack(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/tracks/${id}`);
  }

  // Releases
  public async getReleases(): Promise<Release[]> {
    return this.request<Release[]>('/releases');
  }

  public async getReleasesByLabel(label: RecordLabel): Promise<Release[]> {
    return this.request<Release[]>(`/releases?label=${encodeURIComponent(label)}`);
  }

  // Artists
  public async getArtists(): Promise<Artist[]> {
    return this.request<Artist[]>('/artists');
  }

  public async getArtistsByLabel(label: RecordLabel): Promise<Artist[]> {
    return this.request<Artist[]>(`/artists?label=${encodeURIComponent(label)}`);
  }

  public async getArtistById(id: string): Promise<Artist> {
    return this.request<Artist>(`/artists/${id}`);
  }
}

export const databaseService = DatabaseService.getInstance();
export default DatabaseService;
