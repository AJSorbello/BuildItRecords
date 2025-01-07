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
  public async getArtists(params: { 
    search?: string;
    label?: 'records' | 'tech' | 'deep';
  } = {}): Promise<Artist[]> {
    console.log('Getting artists with params:', params);
    const endpoint = '/artists/search';
    console.log('Making request to endpoint:', endpoint);
    try {
      const queryParams = new URLSearchParams();
      
      // Add search param if it exists
      if (params.search?.trim()) {
        queryParams.append('search', params.search.trim());
      }

      // Add label param if it exists
      if (params.label) {
        queryParams.append('label', params.label);
      }

      const url = `${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Making request to endpoint:', url);
      
      const response = await this.request<Artist[]>(url);
      console.log('Raw artist response:', response);
      console.log('Sample artist data:', response[0]);
      return response;
    } catch (error) {
      console.error('Error getting artists:', error);
      throw error;
    }
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

  public async getArtistsByLabel(label: RecordLabel): Promise<Artist[]> {
    try {
      // Get all tracks for the label
      const response = await this.request<{ tracks: Track[], total: number }>(`/tracks?label=${this.getLabelPath(label)}`);
      
      // Extract unique artists from tracks
      const artistsMap = new Map<string, Artist>();
      
      response.tracks?.forEach(track => {
        track.artists?.forEach(artist => {
          if (artist.id && !artistsMap.has(artist.id)) {
            artistsMap.set(artist.id, {
              id: artist.id,
              name: artist.name,
              profile_image: artist.profile_image,
              spotify_url: artist.spotify_url,
              bio: artist.bio,
              genres: artist.genres
            });
          }
        });
      });
      
      return Array.from(artistsMap.values());
    } catch (error) {
      console.error('Error getting artists by label:', error);
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
      console.log('DatabaseService: Fetching releases for label:', labelId);
      const endpoint = `/releases/${labelId}`;
      console.log('DatabaseService: Using endpoint:', endpoint);
      
      const response = await this.request<PaginatedResponse<Release>>(endpoint);
      console.log('DatabaseService: Raw server response:', response);
      console.log('DatabaseService: Response type:', typeof response);
      console.log('DatabaseService: Has releases?', Boolean(response?.releases));
      console.log('DatabaseService: Number of releases:', response?.releases?.length);

      if (!response?.releases) {
        console.log('DatabaseService: No releases found');
        return {
          releases: [],
          totalReleases: 0,
          currentPage: 1,
          totalPages: 1
        };
      }

      // Transform releases to ensure they have the correct image URLs and track data
      const transformedReleases = response.releases.map(release => {
        console.log('DatabaseService: Processing release:', release.name);
        console.log('DatabaseService: Release images:', release.album?.images);
        console.log('DatabaseService: Release artwork:', release.artwork_url);
        
        return {
          ...release,
          images: release.album?.images || [],
          tracks: release.tracks?.map(track => {
            console.log('DatabaseService: Processing track:', track.name);
            return {
              ...track,
              album: {
                ...release,
                images: release.album?.images || []
              },
              artists: track.artists || release.artists || []
            };
          })
        };
      });

      console.log('DatabaseService: First transformed release:', transformedReleases[0]);
      console.log('DatabaseService: Number of transformed releases:', transformedReleases.length);

      return {
        ...response,
        releases: transformedReleases
      };
    } catch (error) {
      console.error('DatabaseService: Error fetching releases:', error);
      throw error;
    }
  }

  async getLabelStats(): Promise<any> {
    try {
      const response = await this.request('/api/labels/stats');
      return response;
    } catch (error) {
      console.error('Error fetching label stats:', error);
      throw error;
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

  public async getTracksByLabel(label: RecordLabel, sort: 'created_at' | 'popularity' = 'created_at'): Promise<Track[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('label', this.getLabelPath(label));
      queryParams.set('sort', sort);
      const response = await this.request<{ tracks: Track[], total: number, limit: number, offset: number }>(`/tracks?${queryParams.toString()}`);
      console.log('DatabaseService: Raw track data:', JSON.stringify(response.tracks?.[0], null, 2));
      
      // Transform tracks to ensure they have the correct data
      const transformedTracks = (response.tracks || []).map(track => {
        // Try to get the release date from various possible sources
        const releaseDate = track.release_date || 
                          track.releaseDate || 
                          track.album?.release_date ||
                          track.created_at ||
                          track.createdAt;
                          
        console.log('Track:', track.name);
        console.log('Release date sources:', {
          release_date: track.release_date,
          releaseDate: track.releaseDate,
          album_release_date: track.album?.release_date,
          created_at: track.created_at,
          createdAt: track.createdAt
        });
        
        return {
          ...track,
          name: track.name || track.title || 'Untitled',
          artists: track.artists?.map(artist => ({
            ...artist,
            name: artist.name || 'Unknown Artist'
          })) || [],
          duration_ms: track.duration_ms || track.duration || 0,
          release_date: releaseDate || new Date().toISOString(), // Fallback to current date if no date found
          artwork_url: track.artwork_url || track.album?.artwork_url || track.album?.images?.[0]?.url
        };
      });

      console.log('DatabaseService: First transformed track:', JSON.stringify(transformedTracks[0], null, 2));
      return transformedTracks;
    } catch (error) {
      console.error('Error getting tracks by label:', error);
      return [];
    }
  }

  public async getTracksByArtist(artistId: string): Promise<Track[]> {
    try {
      // Get tracks from all labels
      const labels = ['buildit-records', 'buildit-tech', 'buildit-deep'];
      const trackPromises = labels.map(label => 
        this.request<{ tracks: Track[], total: number }>(`/tracks?label=${this.getLabelPath(label)}`).then(response => ({
          ...response,
          tracks: response.tracks?.map(track => ({
            ...track,
            label // Add label to each track
          }))
        }))
      );

      const responses = await Promise.all(trackPromises);
      const allTracks = responses.flatMap(response => response.tracks || []);
      
      // Filter tracks by artist ID
      const artistTracks = allTracks.filter(track => 
        track.artists?.some(artist => artist.id === artistId)
      );

      // Transform tracks to ensure they have the correct data
      const transformedTracks = artistTracks.map(track => {
        // Get artwork URL from track, release, or album
        const artworkUrl = track.artwork_url 
          || track.release?.artwork_url
          || track.album?.artwork_url 
          || track.album?.images?.[0]?.url;

        return {
          ...track,
          name: track.name || track.title || 'Untitled',
          artists: track.artists?.map(artist => ({
            ...artist,
            name: artist.name || 'Unknown Artist'
          })) || [],
          duration_ms: track.duration_ms || track.duration || 0,
          release_date: track.release_date || track.releaseDate || track.album?.release_date || track.created_at || new Date().toISOString(),
          artwork_url: artworkUrl,
          label: track.label
        };
      });

      // Sort tracks by release date, newest first
      return transformedTracks.sort((a, b) => 
        new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      );
    } catch (error) {
      console.error('Error getting tracks by artist:', error);
      return [];
    }
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

  async verifyAdminToken(): Promise<{ verified: boolean }> {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await this.request('/api/admin/verify-admin-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return { verified: true };
    } catch (error) {
      console.error('Error verifying admin token:', error);
      throw error;
    }
  }

  // Helper methods
  private getLabelPath(label: RecordLabel | string): string {
    return typeof label === 'string' ? label : label.id;
  }
}

export const databaseService = DatabaseService.getInstance();
