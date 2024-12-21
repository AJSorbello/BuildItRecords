import axios, { AxiosRequestConfig } from 'axios';
import { Track } from '../types/track';
import { Release } from '../types/release';
import { Artist } from '../types/artist';
import { RecordLabel } from '../constants/labels';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  private static instance: ApiService;
  private baseUrl: string;

  private constructor() {
    // Remove trailing slash if present
    this.baseUrl = API_BASE_URL.replace(/\/$/, '');
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async request<T>(endpoint: string, config: Partial<AxiosRequestConfig> = {}): Promise<T> {
    try {
      // Remove any leading slashes and ensure no double slashes
      const cleanEndpoint = endpoint.replace(/^\/+/, '');
      const url = `${this.baseUrl}/${cleanEndpoint}`;
      
      console.log('Making API request to:', url);
      
      const response = await axios({
        ...config,
        url,
      });
      return response.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private getLabelPath(label: RecordLabel | string): string {
    // Map full label names to their API path segments
    const labelMap: { [key: string]: string } = {
      'Build It Records': 'records',
      'Build It Tech': 'tech',
      'Build It Deep': 'deep'
    };
    
    // First try to get the direct mapping
    if (labelMap[label]) {
      return labelMap[label];
    }
    
    // If it's already in the correct format (records, tech, deep), return as is
    if (['records', 'tech', 'deep'].includes(label.toLowerCase())) {
      return label.toLowerCase();
    }
    
    // Otherwise, try to normalize the input
    const normalized = label.toLowerCase()
      .replace(/build ?it ?/g, '')
      .replace(/-/g, '');
      
    // Map normalized names to correct paths
    const normalizedMap: { [key: string]: string } = {
      'records': 'records',
      'tech': 'tech',
      'deep': 'deep'
    };
    
    return normalizedMap[normalized] || normalized;
  }

  // Tracks
  public async getTracks(): Promise<Track[]> {
    return this.request<Track[]>('tracks');
  }

  public async getTracksByLabel(label: RecordLabel): Promise<Track[]> {
    const labelPath = this.getLabelPath(label);
    return this.request<Track[]>(`${labelPath}/tracks`);
  }

  // Releases
  public async getReleases(): Promise<Release[]> {
    return this.request<Release[]>('releases');
  }

  public async getReleasesByLabel(label: RecordLabel): Promise<Release[]> {
    const labelPath = this.getLabelPath(label);
    return this.request<Release[]>(`${labelPath}/releases`);
  }

  // Artists
  public async getArtists(): Promise<Artist[]> {
    return this.request<Artist[]>('artists');
  }

  public async getArtistsByLabel(label: RecordLabel): Promise<Artist[]> {
    const labelPath = this.getLabelPath(label);
    return this.request<Artist[]>(`${labelPath}/artists`);
  }

  public async getArtistById(artistId: string): Promise<Artist> {
    return this.request<Artist>(`artists/${artistId}`);
  }

  // Search
  public async searchTracks(query: string): Promise<Track[]> {
    return this.request<Track[]>(`search/tracks?q=${encodeURIComponent(query)}`);
  }

  public async searchArtists(query: string): Promise<Artist[]> {
    return this.request<Artist[]>(`search/artists?q=${encodeURIComponent(query)}`);
  }

  public async searchReleases(query: string): Promise<Release[]> {
    return this.request<Release[]>(`search/releases?q=${encodeURIComponent(query)}`);
  }
}

export const apiService = ApiService.getInstance();
