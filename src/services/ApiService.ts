import axios, { AxiosRequestConfig } from 'axios';
import { Track } from '../types/track';
import { Release } from '../types/release';
import { Artist } from '../types/artist';
import { RecordLabel } from '../constants/labels';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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

  private async request<T>(endpoint: string, config: Partial<AxiosRequestConfig> = {}): Promise<T> {
    try {
      const response = await axios({
        ...config,
        url: `${this.baseUrl}${endpoint}`,
      });
      return response.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Tracks
  public async getTracks(): Promise<Track[]> {
    return this.request<Track[]>('/api/tracks');
  }

  // Releases
  public async getReleases(): Promise<Release[]> {
    return this.request<Release[]>('/api/releases');
  }

  public async getReleasesByLabel(label: RecordLabel): Promise<Release[]> {
    // Convert the label enum value directly to a slug
    const labelSlug = label.toLowerCase();
    return this.request<Release[]>(`/api/releases/${labelSlug}`);
  }

  // Artists
  public async getArtists(): Promise<Artist[]> {
    return this.request<Artist[]>('/api/artists');
  }

  public async getArtist(id: string): Promise<Artist> {
    return this.request<Artist>(`/api/artists/${id}`);
  }
}

export const apiService = ApiService.getInstance();
export default ApiService;
