import SpotifyWebApi from 'spotify-web-api-node';
import { SpotifyTrack, SpotifyImage, SpotifyApiTrack, SpotifyPlaylist, SimplifiedTrackOutput, SpotifyAlbum } from '../types/spotify';

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID ?? '';
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET ?? '';
const SPOTIFY_REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI ?? '';

export class SpotifyService {
  private static instance: SpotifyService;
  private spotifyApi: SpotifyWebApi;
  private tokenExpirationTime = 0;
  private accessToken: string | null = null;

  private constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      redirectUri: SPOTIFY_REDIRECT_URI
    });
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  public async ensureAccessToken(): Promise<void> {
    try {
      if (!this.accessToken || Date.now() >= this.tokenExpirationTime) {
        // Use btoa for base64 encoding in the browser
        const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
        
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Failed to get Spotify access token: ${errorData}`);
        }

        const data = await response.json();
        if (!data.access_token) {
          throw new Error('No access token received from Spotify');
        }

        const accessToken: string = data.access_token;
        this.accessToken = accessToken;
        this.spotifyApi.setAccessToken(accessToken);
        this.tokenExpirationTime = Date.now() + (data.expires_in * 1000);
        
        console.log('Successfully obtained Spotify access token');
      }
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      throw error;
    }
  }

  private async ensureValidToken(): Promise<void> {
    await this.ensureAccessToken();
  }

  private convertImages(images: { url: string; height?: number | null; width?: number | null; }[]): SpotifyImage[] {
    return images.map(image => ({
      url: image.url,
      height: image.height ?? 0,
      width: image.width ?? 0
    }));
  }

  private convertToSpotifyApiTrack(track: SpotifyApi.TrackObjectFull): SpotifyApiTrack {
    return {
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        external_urls: artist.external_urls
      })),
      album: {
        id: track.album.id,
        name: track.album.name,
        images: track.album.images.map(image => ({
          url: image.url,
          height: image.height ?? null,
          width: image.width ?? null
        })),
        artists: track.album.artists.map(artist => ({
          id: artist.id,
          name: artist.name,
          external_urls: artist.external_urls
        })),
        release_date: track.album.release_date,
        external_urls: track.album.external_urls,
        label: 'Unknown Label' // We'll update this when we fetch album details
      },
      preview_url: track.preview_url,
      external_urls: track.external_urls
    };
  }

  private convertToSpotifyApiPlaylist(playlist: SpotifyApi.SinglePlaylistResponse): SpotifyPlaylist {
    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      images: playlist.images.map(image => ({
        url: image.url,
        height: image.height ?? null,
        width: image.width ?? null
      })),
      tracks: {
        items: playlist.tracks.items.map(item => ({
          track: this.convertToSpotifyApiTrack(item.track as SpotifyApi.TrackObjectFull),
          added_at: item.added_at
        }))
      },
      external_urls: playlist.external_urls
    };
  }

  public async getTrackDetails(trackId: string): Promise<SpotifyTrack | null> {
    try {
      await this.ensureValidToken();
      const response = await this.spotifyApi.getTrack(trackId);
      const track = response.body;

      const apiTrack = this.convertToSpotifyApiTrack(track);
      return this.convertTrackToSpotifyTrack(apiTrack);
    } catch (error) {
      console.error('Error fetching track details:', error);
      return null;
    }
  }

  private async convertTrackToSpotifyTrack(track: SpotifyApiTrack): Promise<SpotifyTrack> {
    await this.ensureValidToken();
    
    try {
      // Get album details to get the label
      const albumResponse = await this.spotifyApi.getAlbum(track.album.id);
      const album = albumResponse.body;
      
      // Convert album
      const spotifyAlbum: SpotifyAlbum = {
        id: track.album.id,
        name: track.album.name,
        images: track.album.images.map(img => ({
          url: img.url,
          height: img.height || 0,
          width: img.width || 0
        })),
        artists: track.album.artists.map(a => a.name).join(', '),
        releaseDate: track.album.release_date,
        label: album.label || 'Unknown Label',
        spotifyUrl: track.album.external_urls.spotify
      };

      // Convert track
      return {
        id: track.id,
        trackTitle: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        albumCover: track.album.images[0]?.url || '',
        recordLabel: album.label || 'Unknown Label',
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls.spotify,
        album: spotifyAlbum
      };
    } catch (error) {
      console.error('Error converting track:', error);
      throw error;
    }
  }

  async getTrackDetailsByUrl(trackUrl: string): Promise<SpotifyTrack | null> {
    try {
      await this.ensureValidToken();
      const trackId = this.extractTrackId(trackUrl);
      
      if (!trackId) {
        throw new Error('Invalid Spotify track URL');
      }

      return this.getTrackDetails(trackId);
    } catch (error) {
      console.error('Error fetching track details:', error);
      return null;
    }
  }

  private extractTrackId(trackUrl: string): string | null {
    if (!trackUrl) return null;
    
    try {
      // Extract the ID between track/ and ? or end of string
      const match = trackUrl.match(/track\/([a-zA-Z0-9]+)(?:\?|$)/);
      if (match) return match[1];
      
      // Handle Spotify URIs
      const uriMatch = trackUrl.match(/^spotify:track:([a-zA-Z0-9]+)$/);
      if (uriMatch) return uriMatch[1];
      
      // Handle direct IDs (22 characters)
      if (/^[a-zA-Z0-9]{22}$/.test(trackUrl)) {
        return trackUrl;
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting track ID:', error);
      return null;
    }
  }

  async getSimplifiedTrackDetails(trackUrl: string): Promise<SimplifiedTrackOutput> {
    try {
      const track = await this.getTrackDetailsByUrl(trackUrl);
      if (!track) {
        throw new Error('Track not found');
      }

      return {
        trackTitle: track.trackTitle,
        artistName: track.artist,
        recordLabel: track.recordLabel || 'Unknown Label',
        artwork: track.albumCover
      };
    } catch (error) {
      console.error('Error getting simplified track details:', error);
      throw error;
    }
  }

  public async searchTracks(query: string): Promise<SpotifyTrack[]> {
    try {
      await this.ensureValidToken();
      const response = await this.spotifyApi.searchTracks(query);
      const tracks = response.body.tracks?.items || [];
      
      const apiTracks = tracks.map(track => this.convertToSpotifyApiTrack(track));
      return Promise.all(apiTracks.map(track => this.convertTrackToSpotifyTrack(track)));
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  public async getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
    try {
      await this.ensureValidToken();
      const response = await this.spotifyApi.getPlaylist(playlistId);
      return this.convertToSpotifyApiPlaylist(response.body);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      throw error;
    }
  }

  public async getLabelReleases(playlistId: string): Promise<SpotifyTrack[]> {
    try {
      await this.ensureValidToken();
      const playlist = await this.getPlaylist(playlistId);
      
      return Promise.all(
        playlist.tracks.items
          .map(item => this.convertTrackToSpotifyTrack(item.track))
      );
    } catch (error) {
      console.error('Error fetching label releases:', error);
      throw error;
    }
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.tokenExpirationTime;
  }

  public getLoginUrl(): string {
    const scopes = ['user-read-private', 'playlist-read-private'];
    return this.spotifyApi.createAuthorizeURL(scopes, 'state');
  }

  public handleRedirect(hash: string): boolean {
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    if (accessToken) {
      this.accessToken = accessToken;
      this.spotifyApi.setAccessToken(accessToken);
      this.tokenExpirationTime = Date.now() + 3600 * 1000; // 1 hour
      return true;
    }
    return false;
  }

  public logout(): void {
    this.accessToken = null;
    this.tokenExpirationTime = 0;
    this.spotifyApi.setAccessToken('');
  }
}

export const spotifyService = SpotifyService.getInstance();
