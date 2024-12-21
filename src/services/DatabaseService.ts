import axios from 'axios';
import { Track } from '../types/track';
import { Release } from '../types/release';
import { Artist } from '../types/artist';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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

  private async request<T>(endpoint: string, options: any = {}): Promise<T> {
    try {
      const response = await axios({
        url: `${this.baseUrl}${endpoint}`,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private getLabelPath(label: RecordLabel | string): string {
    const labelMap: { [key: string]: string } = {
      'Build It Records': 'records',
      'Build It Tech': 'tech',
      'Build It Deep': 'deep'
    };
    
    const path = labelMap[label] || label.toLowerCase().replace(/build it /, '').replace(/-/g, '');
    return path;
  }

  // Tracks
  public async getTracks(label?: RecordLabel): Promise<Track[]> {
    if (label) {
      const labelPath = this.getLabelPath(label);
      return this.request<Track[]>(`/${labelPath}/tracks`);
    }
    return this.request<Track[]>('/tracks');
  }

  public async getTracksByLabel(label: RecordLabel): Promise<Track[]> {
    const labelPath = this.getLabelPath(label);
    return this.request<Track[]>(`/${labelPath}/tracks`);
  }

  public async getArtistsForLabel(label: string): Promise<Artist[]> {
    const labelPath = this.getLabelPath(label);
    return this.request<Artist[]>(`/${labelPath}/artists`);
  }

  public async addTrack(track: Track): Promise<string> {
    return this.request<string>('/tracks', {
      method: 'POST',
      data: track,
    });
  }

  public async updateTrack(id: string, track: Partial<Track>): Promise<void> {
    return this.request<void>(`/tracks/${id}`, {
      method: 'PATCH',
      data: track,
    });
  }

  public async deleteTrack(id: string): Promise<void> {
    return this.request<void>(`/tracks/${id}`, {
      method: 'DELETE',
    });
  }

  // Releases
  public async getReleases(): Promise<Release[]> {
    return this.request<Release[]>('/releases');
  }

  public async getReleasesByLabel(label: RecordLabel): Promise<Release[]> {
    const labelPath = this.getLabelPath(label);
    return this.request<Release[]>(`/${labelPath}/releases`);
  }

  // Artists
  public async getArtists(): Promise<Artist[]> {
    return this.request<Artist[]>('/artists');
  }

  public async getArtistsByLabel(label: RecordLabel): Promise<Artist[]> {
    const labelPath = this.getLabelPath(label);
    return this.request<Artist[]>(`/${labelPath}/artists`);
  }

  public async getArtistById(id: string): Promise<Artist> {
    return this.request<Artist>(`/artists/${id}`);
  }
}

export const databaseService = DatabaseService.getInstance();
export default DatabaseService;
