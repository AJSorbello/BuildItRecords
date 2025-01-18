import type { Track } from '../types/track';
import type { Artist } from '../types/artist';
import type { Album } from '../types/album';
import type { RecordLabelId } from '../types/labels';
import type { SpotifyTrack, SpotifyArtist, SpotifyAlbum, SpotifyAuthResponse, SpotifyPaging } from '../types/spotify';
import { formatSpotifyTrack, formatSpotifyArtist, formatSpotifyAlbum } from '../utils/trackUtils';

class SpotifyService {
  private static instance: SpotifyService;
  private accessToken: string | null = null;
  private clientId: string;
  private clientSecret: string;
  private baseUrl = 'https://api.spotify.com/v1';
  private apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  private constructor() {
    this.clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || '';
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('Failed to get Spotify access token');
    }

    const data = await response.json() as SpotifyAuthResponse;
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  private async fetchFromSpotify<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.statusText}`);
    }

    return response.json();
  }

  public async searchTracks(query: string, limit: number = 20): Promise<Track[]> {
    try {
      interface SearchResponse {
        tracks: SpotifyPaging<SpotifyTrack>;
      }

      const data = await this.fetchFromSpotify<SearchResponse>(`/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`);
      return data.tracks.items.map(track => ({
        ...formatSpotifyTrack(track),
        explicit: track.explicit,
        popularity: track.popularity,
        available_markets: track.available_markets || [],
        is_local: track.is_local || false
      }));
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  }

  public async getTracksByArtist(artistId: string): Promise<Track[]> {
    try {
      interface TopTracksResponse {
        tracks: SpotifyTrack[];
      }

      const data = await this.fetchFromSpotify<TopTracksResponse>(`/artists/${artistId}/top-tracks?market=US`);
      return data.tracks.map(formatSpotifyTrack);
    } catch (error) {
      console.error('Error getting tracks by artist:', error);
      return [];
    }
  }

  public async getArtist(artistId: string): Promise<Artist | null> {
    try {
      const artist = await this.fetchFromSpotify<SpotifyArtist>(`/artists/${artistId}`);
      return formatSpotifyArtist(artist);
    } catch (error) {
      console.error('Error getting artist:', error);
      return null;
    }
  }

  public async getAlbum(albumId: string): Promise<Album | null> {
    try {
      const album = await this.fetchFromSpotify<SpotifyAlbum>(`/albums/${albumId}`);
      return formatSpotifyAlbum(album);
    } catch (error) {
      console.error('Error getting album:', error);
      return null;
    }
  }

  public async getTracksByLabel(labelId: RecordLabelId): Promise<Track[]> {
    try {
      interface SearchResponse {
        tracks: SpotifyPaging<SpotifyTrack>;
      }

      const data = await this.fetchFromSpotify<SearchResponse>(`/search?q=label:${encodeURIComponent(labelId)}&type=track&limit=50`);
      return data.tracks.items.map(formatSpotifyTrack);
    } catch (error) {
      console.error('Error getting tracks by label:', error);
      return [];
    }
  }

  public async getRecommendations(seedTracks: string[], limit: number = 20): Promise<Track[]> {
    try {
      interface RecommendationsResponse {
        tracks: SpotifyTrack[];
      }

      const params = new URLSearchParams({
        seed_tracks: seedTracks.join(','),
        limit: limit.toString(),
      });
      
      const data = await this.fetchFromSpotify<RecommendationsResponse>(`/recommendations?${params}`);
      return data.tracks.map(formatSpotifyTrack);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  public async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    try {
      const allTracks: SpotifyTrack[] = [];
      let offset = 0;
      const limit = 100; // Maximum allowed by Spotify API
      
      while (true) {
        const response = await this.fetchFromSpotify<SpotifyPaging<{ track: SpotifyTrack }>>(
          `/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`
        );

        const tracks = response.items
          .filter(item => item.track) // Filter out null tracks
          .map(item => item.track);
        
        // Get full artist details for each track
        const tracksWithArtistDetails = await Promise.all(
          tracks.map(async (track) => {
            const artistPromises = track.artists.map(artist => 
              this.fetchFromSpotify<SpotifyArtist>(`/artists/${artist.id}`)
            );
            const fullArtists = await Promise.all(artistPromises);
            return {
              ...track,
              artists: fullArtists
            };
          })
        );
        
        allTracks.push(...tracksWithArtistDetails);

        if (!response.next) break; // No more tracks to fetch
        offset += limit;
      }

      return allTracks;
    } catch (error) {
      console.error('Error getting playlist tracks:', error);
      return [];
    }
  }

  public async getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
    try {
      const allTracks: SpotifyTrack[] = [];
      let offset = 0;
      const limit = 50;

      // First get the full album details to get artist images
      const albumDetails = await this.fetchFromSpotify<SpotifyAlbum>(`/albums/${albumId}`);
      
      while (true) {
        const response = await this.fetchFromSpotify<SpotifyPaging<SpotifyTrack>>(
          `/albums/${albumId}/tracks?offset=${offset}&limit=${limit}`
        );

        // Get full artist details for each track
        const tracksWithArtistDetails = await Promise.all(
          response.items.map(async (track) => {
            const artistPromises = track.artists.map(artist => 
              this.fetchFromSpotify<SpotifyArtist>(`/artists/${artist.id}`)
            );
            const fullArtists = await Promise.all(artistPromises);
            return {
              ...track,
              album: albumDetails, // Include full album details with each track
              artists: fullArtists
            };
          })
        );
        
        allTracks.push(...tracksWithArtistDetails);

        if (!response.next) break;
        offset += limit;
      }

      return allTracks;
    } catch (error) {
      console.error('Error getting album tracks:', error);
      return [];
    }
  }

  public async importTracksFromSpotify(labelId: RecordLabelId, authToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/labels/${labelId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import tracks');
      }

      const data = await response.json();
      return {
        success: true,
        message: `Successfully imported ${data.importedCount || 0} tracks`
      };
    } catch (error) {
      console.error('Error importing tracks:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import tracks'
      };
    }
  }

  public async checkImportStatus(labelId: RecordLabelId, authToken: string): Promise<{ status: string; progress: number }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/labels/${labelId}/import/status`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check import status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking import status:', error);
      throw error;
    }
  }
}

export const spotifyService = SpotifyService.getInstance();
