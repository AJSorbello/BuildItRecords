import type { Artist } from '../types/artist';
import type { Track } from '../types/track';
import type { Album } from '../types/album';
import { spotifyConfig } from '../utils/spotifyAuth';
import { formatSpotifyTrack, formatSpotifyArtist, formatSpotifyAlbum } from '../utils/trackUtils';

interface SpotifySearchParams {
  market?: string;
  limit?: number;
  offset?: number;
  includeExternal?: 'audio';
}

class SpotifyService {
  private static instance: SpotifyService;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  // Private constructor for singleton pattern
  private constructor() {
    // Initialization logic
    console.log('Spotify Service initialized');
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);
    return this.accessToken;
  }

  private async fetchFromSpotify<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
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

  async search(
    query: string,
    types: ('album' | 'artist' | 'track')[],
    options: SpotifySearchParams = {}
  ) {
    const params = new URLSearchParams({
      q: query,
      type: types.join(','),
      ...(options.market && { market: options.market }),
      ...(options.limit && { limit: options.limit.toString() }),
      ...(options.offset && { offset: options.offset.toString() }),
      ...(options.includeExternal && { include_external: options.includeExternal }),
    });

    return this.fetchFromSpotify(`/search?${params.toString()}`);
  }

  async getArtist(id: string): Promise<Artist> {
    const data = await this.fetchFromSpotify(`/artists/${id}`);
    return formatSpotifyArtist(data);
  }

  async getArtistAlbums(id: string, options: SpotifySearchParams = {}): Promise<Album[]> {
    const params = new URLSearchParams({
      ...(options.market && { market: options.market }),
      ...(options.limit && { limit: options.limit.toString() }),
      ...(options.offset && { offset: options.offset.toString() }),
    });

    const data = await this.fetchFromSpotify(`/artists/${id}/albums?${params.toString()}`);
    return data.items.map(formatSpotifyAlbum);
  }

  async getArtistTopTracks(id: string, market = 'US'): Promise<Track[]> {
    const data = await this.fetchFromSpotify(`/artists/${id}/top-tracks?market=${market}`);
    return data.tracks.map(formatSpotifyTrack);
  }

  async getAlbum(id: string): Promise<Album> {
    const data = await this.fetchFromSpotify(`/albums/${id}`);
    return formatSpotifyAlbum(data);
  }

  async getAlbumTracks(id: string, options: SpotifySearchParams = {}): Promise<Track[]> {
    const params = new URLSearchParams({
      ...(options.market && { market: options.market }),
      ...(options.limit && { limit: options.limit.toString() }),
      ...(options.offset && { offset: options.offset.toString() }),
    });

    const data = await this.fetchFromSpotify(`/albums/${id}/tracks?${params.toString()}`);
    return data.items.map(formatSpotifyTrack);
  }

  async getTrack(id: string): Promise<Track> {
    const data = await this.fetchFromSpotify(`/tracks/${id}`);
    return formatSpotifyTrack(data);
  }
}

export const spotifyService = SpotifyService.getInstance();
