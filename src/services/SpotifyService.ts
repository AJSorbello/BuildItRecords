import SpotifyWebApi from 'spotify-web-api-node';
import { SpotifyTrack, SpotifyImage, SpotifyApiTrack, SpotifyPlaylist, SimplifiedTrackOutput } from '../types/spotify';

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
    if (!this.accessToken || Date.now() >= this.tokenExpirationTime) {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.accessToken = data.body.access_token;
      this.spotifyApi.setAccessToken(this.accessToken);
      this.tokenExpirationTime = Date.now() + (data.body.expires_in * 1000);
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
      const albumResponse = await this.spotifyApi.getAlbum(track.album.id);
      const album = albumResponse.body;
      if (album) {
        track.album.label = album.label || 'Unknown Label';
      }
    } catch (error) {
      console.error('Error fetching album details:', error);
    }
    
    const artistNames = track.artists.map(artist => artist.name).join(', ');
    
    return {
      id: track.id,
      trackTitle: track.name,
      artist: artistNames,
      albumCover: track.album.images[0]?.url || '',
      recordLabel: track.album.label || 'Unknown Label',
      spotifyUrl: track.external_urls.spotify,
      previewUrl: track.preview_url,
      album: {
        id: track.album.id,
        name: track.album.name,
        images: this.convertImages(track.album.images),
        artists: track.album.artists.map(artist => artist.name).join(', '),
        releaseDate: track.album.release_date,
        spotifyUrl: track.album.external_urls.spotify
      }
    };
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
    const match = trackUrl.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
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
