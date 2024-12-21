import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Track } from '../types/track';
import { Artist } from '../types/artist';
import { RecordLabel } from '../types/release';
import { convertSpotifyArtistToArtist, convertSpotifyTrackToTrack } from '../utils/spotifyUtils';

class SpotifyService {
  private sdk: SpotifyApi | null = null;
  private static instance: SpotifyService;

  private constructor() {
    this.initializeSDK();
  }

  private async initializeSDK() {
    try {
      const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Spotify credentials are not configured');
      }

      this.sdk = SpotifyApi.withClientCredentials(clientId, clientSecret);
      console.log('Spotify SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Spotify SDK:', error);
      this.sdk = null;
    }
  }

  private async ensureSDK(): Promise<SpotifyApi> {
    if (!this.sdk) {
      await this.initializeSDK();
      if (!this.sdk) {
        throw new Error('Failed to initialize Spotify SDK');
      }
    }
    return this.sdk;
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  async getLabelReleases(label: RecordLabel): Promise<Track[]> {
    try {
      const sdk = await this.ensureSDK();
      const response = await sdk.search.search(`label:${label}`, ['track'], undefined, 50);
      return response.tracks.items.map(track => convertSpotifyTrackToTrack(track, label));
    } catch (error) {
      console.error('Error fetching label releases:', error);
      return [];
    }
  }

  async getArtistsByLabel(label: RecordLabel): Promise<Artist[]> {
    try {
      const releases = await this.getLabelReleases(label);
      const artistIds = new Set(releases.map(release => release.artist.id).filter(Boolean));
      const sdk = await this.ensureSDK();
      const artists = await Promise.all(
        Array.from(artistIds).map(async id => {
          const artist = await sdk.artists.get(id);
          return convertSpotifyArtistToArtist(artist, label);
        })
      );
      return artists;
    } catch (error) {
      console.error('Error fetching artists by label:', error);
      return [];
    }
  }

  async getArtist(id: string): Promise<Artist | null> {
    try {
      const sdk = await this.ensureSDK();
      const artist = await sdk.artists.get(id);
      return convertSpotifyArtistToArtist(artist);
    } catch (error) {
      console.error('Error fetching artist:', error);
      return null;
    }
  }

  async getArtistDetailsByName(name: string): Promise<any | null> {
    try {
      const sdk = await this.ensureSDK();
      const searchResults = await sdk.search(name, ['artist']);
      const artists = searchResults.artists.items;
      
      if (artists.length > 0) {
        // Get full artist details
        const artistId = artists[0].id;
        return await sdk.artists.get(artistId);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting artist details:', error);
      return null;
    }
  }

  async getArtistTracks(artistId: string): Promise<Track[]> {
    try {
      const sdk = await this.ensureSDK();
      const response = await sdk.artists.topTracks(artistId, 'US');
      return response.tracks.map(track => convertSpotifyTrackToTrack(track, 'records'));
    } catch (error) {
      console.error('Error fetching artist tracks:', error);
      return [];
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    try {
      const sdk = await this.ensureSDK();
      const response = await sdk.search.search(query, ['track'], undefined, 20);
      return response.tracks.items.map(track => convertSpotifyTrackToTrack(track, 'records'));
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  }

  async getTrackDetailsByUrl(url: string): Promise<Track | null> {
    try {
      const id = url.split('/').pop()?.split('?')[0];
      if (!id) return null;
      
      const sdk = await this.ensureSDK();
      const track = await sdk.tracks.get(id);
      return convertSpotifyTrackToTrack(track, 'records');
    } catch (error) {
      console.error('Error fetching track details:', error);
      return null;
    }
  }
}

export const spotifyService = SpotifyService.getInstance();
