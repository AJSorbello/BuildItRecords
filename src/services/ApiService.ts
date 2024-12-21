import axios from 'axios';
import { Track } from '../types/track';
import { Release } from '../types/release';
import { Artist } from '../types/artist';
import { RecordLabel } from '../constants/labels';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  private static instance: ApiService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = API_BASE_URL;
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

  // Tracks
  public async getTracks(): Promise<Track[]> {
    return this.request<Track[]>('/tracks');
  }

  public async getTracksByLabel(label: RecordLabel): Promise<Track[]> {
    return this.request<Track[]>(`/tracks/label/${label}`);
  }

  // Releases
  public async getReleases(): Promise<Release[]> {
    return this.request<Release[]>('/releases');
  }

  public async getReleasesByLabel(label: RecordLabel): Promise<Release[]> {
    // Convert label to the correct slug format
    const labelMap: { [key in RecordLabel]: string } = {
      [RecordLabel.RECORDS]: 'buildit-records',
      [RecordLabel.TECH]: 'buildit-tech',
      [RecordLabel.DEEP]: 'buildit-deep'
    };
    const labelSlug = labelMap[label];
    return this.request<Release[]>(`/releases/${labelSlug}`);
  }

  // Artists
  public async getArtists(): Promise<Artist[]> {
    return this.request<Artist[]>('/artists');
  }

  public async getArtistsByLabel(label: RecordLabel): Promise<Artist[]> {
    return this.request<Artist[]>(`/artists/label/${label}`);
  }

  public async getArtistById(id: string): Promise<Artist> {
    return this.request<Artist>(`/artists/${id}`);
  }
}

export const apiService = ApiService.getInstance();
export default ApiService;
