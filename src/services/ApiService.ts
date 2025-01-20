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

  // Labels
  public async getLabels(): Promise<RecordLabel[]> {
    return this.request<RecordLabel[]>('labels');
  }

  // Artists
  public async getArtists(params: { label?: string; search?: string } = {}): Promise<Artist[]> {
    const queryParams = new URLSearchParams();
    if (params.label) queryParams.set('label', params.label);
    if (params.search) queryParams.set('search', params.search);
    
    const queryString = queryParams.toString();
    return this.request<Artist[]>(`artists${queryString ? `?${queryString}` : ''}`);
  }

  public async getArtistById(id: string): Promise<Artist> {
    return this.request<Artist>(`artists/${id}`);
  }

  // Releases
  public async getReleases(params: { artistId?: string; labelId?: string } = {}): Promise<Release[]> {
    const queryParams = new URLSearchParams();
    if (params.artistId) queryParams.set('artistId', params.artistId);
    if (params.labelId) queryParams.set('labelId', params.labelId);
    
    const queryString = queryParams.toString();
    return this.request<Release[]>(`releases${queryString ? `?${queryString}` : ''}`);
  }

  public async getReleaseById(id: string): Promise<Release> {
    return this.request<Release>(`releases/${id}`);
  }

  public async getReleasesByArtistId(artistId: string): Promise<Release[]> {
    return this.getReleases({ artistId });
  }

  public async getReleasesByLabelId(labelId: string): Promise<{
    releases: Release[];
    totalReleases: number;
    totalTracks: number;
  }> {
    try {
      const response = await this.request<{
        releases: Release[];
        totalReleases: number;
        totalTracks: number;
      }>(`/releases/label/${labelId}`);
      return response;
    } catch (error) {
      console.error('Error in getReleasesByLabelId:', error);
      throw error;
    }
  }

  public async getReleasesByLabel(label: RecordLabel): Promise<Release[]> {
    const queryParams = new URLSearchParams();
    queryParams.set('label', this.getLabelPath(label));
    return this.request<Release[]>(`releases?${queryParams.toString()}`);
  }

  // Search
  public async searchArtists(query: string): Promise<Artist[]> {
    return this.request<Artist[]>(`search/artists?q=${encodeURIComponent(query)}`);
  }

  public async searchReleases(query: string): Promise<Release[]> {
    return this.request<Release[]>(`search/releases?q=${encodeURIComponent(query)}`);
  }

  // Tracks
  public async getTracks(): Promise<Track[]> {
    return this.request<Track[]>('tracks');
  }

  public async getTracksByLabel(label: RecordLabel): Promise<Track[]> {
    const labelPath = this.getLabelPath(label);
    return this.request<Track[]>(`${labelPath}/tracks`);
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
}

export const apiService = ApiService.getInstance();
