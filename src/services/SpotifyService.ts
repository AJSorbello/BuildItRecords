import axios from 'axios';
import { convertSpotifyToRelease } from '../utils/spotifyUtils';

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;

export interface SpotifyRelease {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  images: Array<{ url: string }>;
  release_date: string;
  tracks: {
    items: Array<{
      id: string;
      name: string;
      artists: Array<{ name: string }>;
      duration_ms: number;
      preview_url: string | null;
    }>;
  };
  external_urls: {
    spotify: string;
  };
}

export class SpotifyService {
  private static instance: SpotifyService;
  private accessToken: string | null = null;
  private tokenExpirationTime = 0;

  private constructor() {
    this.accessToken = localStorage.getItem('spotify_access_token');
    const expirationTime = localStorage.getItem('spotify_token_expiration');
    this.tokenExpirationTime = expirationTime ? parseInt(expirationTime) : 0;
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  private saveToken(token: string, expiresIn: number) {
    this.accessToken = token;
    this.tokenExpirationTime = Date.now() + expiresIn * 1000;
    localStorage.setItem('spotify_access_token', token);
    localStorage.setItem('spotify_token_expiration', this.tokenExpirationTime.toString());
  }

  private clearToken() {
    this.accessToken = null;
    this.tokenExpirationTime = 0;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiration');
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.tokenExpirationTime;
  }

  public getLoginUrl(): string {
    const scopes = [
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-read-private',
      'user-read-email',
    ];

    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID!,
      response_type: 'token',
      redirect_uri: SPOTIFY_REDIRECT_URI!,
      scope: scopes.join(' '),
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  public handleRedirect(hash: string): boolean {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');

    if (accessToken && expiresIn) {
      this.saveToken(accessToken, parseInt(expiresIn));
      return true;
    }
    return false;
  }

  public logout(): void {
    this.clearToken();
  }

  private async getHeaders() {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Spotify');
    }

    return {
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  public async getUserPlaylists() {
    const headers = await this.getHeaders();
    const response = await axios.get('https://api.spotify.com/v1/me/playlists', { headers });
    return response.data.items;
  }

  public async getPlaylist(playlistId: string) {
    const headers = await this.getHeaders();
    const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, { headers });
    return response.data;
  }

  public async getLabelReleases(labelId: string): Promise<SpotifyRelease[]> {
    const headers = await this.getHeaders();
    const response = await axios.get(`https://api.spotify.com/v1/users/${labelId}/playlists`, { headers });
    return response.data.items.map(convertSpotifyToRelease);
  }

  public async searchTracks(query: string) {
    const headers = await this.getHeaders();
    const response = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, { headers });
    return response.data.tracks.items;
  }

  public async getTrack(trackId: string) {
    const headers = await this.getHeaders();
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, { headers });
    return response.data;
  }
}

export default SpotifyService;
