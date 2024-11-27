import axios from 'axios';
import SpotifyWebApi from 'spotify-web-api-node';
import { convertSpotifyToRelease } from '../utils/spotifyUtils';

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
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

class SpotifyService {
  private static instance: SpotifyService;
  private accessToken: string | null = null;
  private tokenExpirationTime = 0;
  private spotifyApi: SpotifyWebApi;

  private constructor() {
    this.accessToken = localStorage.getItem('spotify_access_token');
    const expirationTime = localStorage.getItem('spotify_token_expiration');
    this.tokenExpirationTime = expirationTime ? parseInt(expirationTime) : 0;
    
    this.spotifyApi = new SpotifyWebApi({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
    });
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

  private async ensureAccessToken() {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body.access_token);
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      throw error;
    }
  }

  public async getTrackByISRC(isrc: string) {
    await this.ensureAccessToken();
    try {
      const response = await this.spotifyApi.searchTracks(`isrc:${isrc}`);
      if (response.body.tracks?.items.length) {
        const track = response.body.tracks.items[0];
        return {
          title: track.name,
          artist: track.artists[0].name,
          imageUrl: track.album.images[0].url,
          releaseDate: track.album.release_date,
          spotifyUrl: track.external_urls.spotify,
        };
      }
      throw new Error('Track not found on Spotify');
    } catch (error) {
      console.error('Error fetching track from Spotify:', error);
      throw error;
    }
  }

  public async getAccessToken(): Promise<string | null> {
    if (this.accessToken && Date.now() < this.tokenExpirationTime) {
      return this.accessToken;
    }
    return null;
  }

  public async login() {
    const scope = 'user-read-private user-read-email playlist-read-private';
    const state = Math.random().toString(36).substring(7);
    
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID!,
      response_type: 'token',
      redirect_uri: SPOTIFY_REDIRECT_URI!,
      state,
      scope,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  public handleRedirect(hash: string): boolean {
    if (!hash) return false;
    
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');

    if (accessToken && expiresIn) {
      this.saveToken(accessToken, parseInt(expiresIn));
      return true;
    }
    return false;
  }

  public logout() {
    this.accessToken = null;
    this.tokenExpirationTime = 0;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiration');
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.tokenExpirationTime;
  }

  public getLoginUrl(): string {
    const scope = 'user-read-private user-read-email playlist-read-private';
    const state = Math.random().toString(36).substring(7);
    
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID!,
      response_type: 'token',
      redirect_uri: SPOTIFY_REDIRECT_URI!,
      state,
      scope,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  public async getPlaylists() {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      return response.data.items;
    } catch (error) {
      console.error('Error fetching playlists:', error);
      throw error;
    }
  }

  public async getPlaylist(playlistId: string) {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching playlist:', error);
      throw error;
    }
  }

  public async getPlaylistTracks(playlistId: string) {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      return response.data.items.map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map((artist: any) => artist.name),
        duration: item.track.duration_ms,
        previewUrl: item.track.preview_url,
        spotifyUrl: item.track.external_urls.spotify,
        albumImage: item.track.album.images[0]?.url,
      }));
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      throw error;
    }
  }

  public async getLabelReleases(labelId: string) {
    await this.ensureAccessToken();
    try {
      const response = await this.spotifyApi.getArtistAlbums(labelId, { limit: 50 });
      return response.body.items;
    } catch (error) {
      console.error('Error fetching label releases:', error);
      throw error;
    }
  }
}

export default SpotifyService.getInstance();
