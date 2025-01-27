import { 
  SpotifyTrack, 
  SpotifyArtist, 
  SpotifyAlbum,
  SpotifyPaging,
  SpotifySearchResponse
} from '../types/spotify';
import { spotifyConfig } from '../utils/spotifyAuth';
import { logger } from '../utils/logger';

interface SpotifySearchParams {
  market?: string;
  limit?: number;
  offset?: number;
  include_external?: 'audio';
}

export class SpotifyApiClient {
  private static instance: SpotifyApiClient;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  // Private constructor to enforce singleton pattern
  private constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  public static getInstance(): SpotifyApiClient {
    if (!SpotifyApiClient.instance) {
      SpotifyApiClient.instance = new SpotifyApiClient();
    }
    return SpotifyApiClient.instance;
  }

  // Public method to authorize with a token or get a new one
  public async authorize(token?: string): Promise<void> {
    try {
      if (token) {
        this.accessToken = token;
        // Set expiry to 1 hour from now when using provided token
        this.tokenExpiry = Date.now() + 3600 * 1000;
      } else {
        await this.refreshAccessToken();
      }
    } catch (error) {
      logger.error('Failed to authorize Spotify client:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const credentials = btoa(`${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`);
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw error;
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || Date.now() >= this.tokenExpiry) {
      await this.refreshAccessToken();
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    await this.ensureValidToken();

    const queryString = new URLSearchParams(params).toString();
    const url = `https://api.spotify.com/v1${endpoint}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new SpotifyError(`Spotify API error: ${response.statusText}`);
    }

    return response.json();
  }

  async search(query: string, types: string[]): Promise<SpotifySearchResponse> {
    try {
      const params = {
        q: query,
        type: types.join(','),
        market: 'US',
        limit: 50
      };
      return await this.makeRequest<SpotifySearchResponse>('/search', params);
    } catch (error) {
      logger.error('Error searching Spotify:', error);
      throw error;
    }
  }

  async getTrack(id: string): Promise<SpotifyTrack | null> {
    try {
      return await this.makeRequest<SpotifyTrack>(`/tracks/${id}`);
    } catch (error) {
      logger.error('Error fetching track:', error);
      return null;
    }
  }

  async getAlbum(id: string): Promise<SpotifyAlbum | null> {
    try {
      return await this.makeRequest<SpotifyAlbum>(`/albums/${id}`);
    } catch (error) {
      logger.error('Error fetching album:', error);
      return null;
    }
  }

  async getArtist(id: string): Promise<SpotifyArtist | null> {
    try {
      return await this.makeRequest<SpotifyArtist>(`/artists/${id}`);
    } catch (error) {
      logger.error('Error fetching artist:', error);
      return null;
    }
  }

  async getArtistTopTracks(artistId: string, market = 'US'): Promise<SpotifyTrack[]> {
    try {
      const response = await this.makeRequest<{ tracks: SpotifyTrack[] }>(
        `/artists/${artistId}/top-tracks`,
        { market }
      );
      return response.tracks;
    } catch (error) {
      logger.error('Error fetching artist top tracks:', error);
      return [];
    }
  }

  async searchTracks(query: string, params: SpotifySearchParams = {}): Promise<SpotifyTrack[]> {
    try {
      const response = await this.makeRequest<SpotifySearchResponse>('/search', {
        q: query,
        type: 'track',
        ...params,
      });
      return response.tracks?.items || [];
    } catch (error) {
      logger.error('Error searching tracks:', error);
      return [];
    }
  }

  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    try {
      const response = await this.makeRequest<SpotifyPaging<{ track: SpotifyTrack }>>(
        `/playlists/${playlistId}/tracks`
      );
      return response.items.map(item => item.track);
    } catch (error) {
      logger.error('Error fetching playlist tracks:', error);
      return [];
    }
  }
}

export class SpotifyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpotifyError';
  }
}

// Export singleton instance
export const spotifyApi = SpotifyApiClient.getInstance();
