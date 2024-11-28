import SpotifyWebApi from 'spotify-web-api-node';
import { SpotifyTrack, SpotifyPlaylist, SpotifyPlaylistTrack, SpotifyApiError, SpotifyImage } from '../types/spotify';

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;

class SpotifyService {
  private static instance: SpotifyService;
  private spotifyApi: SpotifyWebApi;
  private accessToken: string | null = null;
  private tokenExpirationTime = 0;

  private constructor() {
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      throw new Error('Spotify client credentials not configured');
    }

    this.spotifyApi = new SpotifyWebApi({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      redirectUri: SPOTIFY_REDIRECT_URI
    });

    // Try to restore token from storage
    const storedToken = localStorage.getItem('spotify_access_token');
    const storedExpiration = localStorage.getItem('spotify_token_expiration');
    
    if (storedToken && storedExpiration) {
      const expirationTime = parseInt(storedExpiration);
      if (expirationTime > Date.now()) {
        this.accessToken = storedToken;
        this.tokenExpirationTime = expirationTime;
        this.spotifyApi.setAccessToken(storedToken);
      }
    }
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpirationTime) {
      await this.ensureAccessToken();
    }
  }

  public async ensureAccessToken(): Promise<void> {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const token = data.access_token;
      if (!token) {
        throw new Error('No access token received');
      }
      
      this.accessToken = token;
      this.tokenExpirationTime = Date.now() + (data.expires_in * 1000);
      
      this.spotifyApi.setAccessToken(token);
      
      localStorage.setItem('spotify_access_token', token);
      localStorage.setItem('spotify_token_expiration', this.tokenExpirationTime.toString());
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      throw new Error('Failed to obtain Spotify access token');
    }
  }

  public async authenticate(): Promise<void> {
    await this.ensureAccessToken();
  }

  private convertSpotifyImageToLocal(images: any[]): SpotifyImage[] {
    return images.map(img => ({
      url: img.url,
      height: img.height || null,
      width: img.width || null
    }));
  }

  public async getTrackDetails(trackId: string): Promise<SpotifyTrack> {
    await this.refreshTokenIfNeeded();
    
    try {
      const response = await this.spotifyApi.getTrack(trackId);
      const track = response.body;
      
      return {
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => ({ name: artist.name })),
        duration_ms: track.duration_ms,
        preview_url: track.preview_url,
        external_urls: track.external_urls,
        album: {
          id: track.album.id,
          name: track.album.name,
          artists: track.album.artists.map(artist => ({ name: artist.name })),
          images: this.convertSpotifyImageToLocal(track.album.images),
          release_date: track.album.release_date,
          external_urls: track.album.external_urls
        }
      };
    } catch (error) {
      console.error('Error fetching track details:', error);
      throw error;
    }
  }

  public async getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
    await this.refreshTokenIfNeeded();
    
    try {
      const response = await this.spotifyApi.getPlaylist(playlistId);
      const playlist = response.body;
      
      return {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description || '',
        images: this.convertSpotifyImageToLocal(playlist.images),
        tracks: {
          items: playlist.tracks.items.map(item => ({
            track: this.convertTrackToLocal(item.track),
            added_at: item.added_at
          }))
        },
        external_urls: playlist.external_urls
      };
    } catch (error) {
      console.error('Error fetching playlist:', error);
      throw error;
    }
  }

  private convertTrackToLocal(track: any): SpotifyTrack {
    return {
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist: any) => ({ name: artist.name })),
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      external_urls: track.external_urls,
      album: {
        id: track.album.id,
        name: track.album.name,
        artists: track.album.artists.map((artist: any) => ({ name: artist.name })),
        images: this.convertSpotifyImageToLocal(track.album.images),
        release_date: track.album.release_date,
        external_urls: track.album.external_urls
      }
    };
  }

  public async searchTracks(query: string): Promise<SpotifyTrack[]> {
    await this.refreshTokenIfNeeded();
    
    try {
      const response = await this.spotifyApi.searchTracks(query);
      const tracks = response.body.tracks?.items || [];
      return tracks.map(track => this.convertTrackToLocal(track));
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  public async getLabelReleases(playlistId: string): Promise<SpotifyPlaylistTrack[]> {
    await this.refreshTokenIfNeeded();
    
    try {
      const response = await this.spotifyApi.getPlaylistTracks(playlistId);
      return response.body.items.map(item => ({
        track: this.convertTrackToLocal(item.track),
        added_at: item.added_at
      }));
    } catch (error) {
      console.error('Error fetching label releases:', error);
      throw error;
    }
  }

  public handleRedirect(hash: string): boolean {
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    if (accessToken) {
      this.accessToken = accessToken;
      this.tokenExpirationTime = Date.now() + 3600 * 1000; // 1 hour
      this.spotifyApi.setAccessToken(accessToken);
      localStorage.setItem('spotify_access_token', accessToken);
      localStorage.setItem('spotify_token_expiration', this.tokenExpirationTime.toString());
      return true;
    }
    return false;
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.tokenExpirationTime;
  }

  public getLoginUrl(): string {
    const scopes = ['user-read-private', 'user-read-email', 'playlist-read-private'];
    return this.spotifyApi.createAuthorizeURL(scopes, '');
  }

  public logout(): void {
    this.accessToken = null;
    this.tokenExpirationTime = 0;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiration');
    this.spotifyApi.resetAccessToken();
  }
}

export default SpotifyService;
