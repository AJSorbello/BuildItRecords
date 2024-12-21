import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Track } from '../types/track';
import { Artist } from '../types/artist';
import { RECORD_LABELS } from '../constants/labels';
import { convertSpotifyArtistToArtist, convertSpotifyTrackToTrack } from '../utils/spotifyUtils';

type RecordLabel = typeof RECORD_LABELS[keyof typeof RECORD_LABELS];

class SpotifyService {
  private spotifyApi: SpotifyApi | null = null; // Fixed property name and initialization
  private static instance: SpotifyService;

  private constructor() {}

  private async initializeSDK() {
    try {
      const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Spotify credentials are not configured');
      }

      this.spotifyApi = SpotifyApi.withClientCredentials(clientId, clientSecret); // Fixed property name
      console.log('Spotify SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Spotify SDK:', error);
      this.spotifyApi = null; // Ensure null on failure
    }
  }

  private async ensureSDK(): Promise<SpotifyApi> {
    if (!this.spotifyApi) {
      await this.initializeSDK();
      if (!this.spotifyApi) {
        throw new Error('Failed to initialize Spotify SDK');
      }
    }
    return this.spotifyApi;
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  public async getTracksByLabel(label: RecordLabel): Promise<Track[]> {
    try {
      const sdk = await this.ensureSDK();
      const response = await sdk.search(`label:${label}`, ['track']);
      return response.tracks.items.map(track => convertSpotifyTrackToTrack(track, label));
    } catch (error) {
      console.error('Error fetching label releases:', error);
      return [];
    }
  }

  public async getArtistsByLabel(label: RecordLabel): Promise<Artist[]> {
    try {
      const sdk = await this.ensureSDK();
      const tracks = await this.getTracksByLabel(label);
      const artistIds = new Set(tracks.flatMap(track => track.artists.map(artist => artist.id)));

      const artists = await Promise.all(
        Array.from(artistIds).filter(id => id).map(async id => {
          const artist = await sdk.artists.get(id);
          return convertSpotifyArtistToArtist(artist, label);
        })
      );

      return artists;
    } catch (error) {
      console.error('Error fetching artists:', error);
      return [];
    }
  }

  public async getArtist(id: string): Promise<Artist | null> {
    try {
      const sdk = await this.ensureSDK();
      const artist = await sdk.artists.get(id);
      return convertSpotifyArtistToArtist(artist, RECORD_LABELS.RECORDS);
    } catch (error) {
      console.error('Error fetching artist:', error);
      return null;
    }
  }

  public async searchArtists(name: string): Promise<Artist[]> {
    try {
      const sdk = await this.ensureSDK();
      const response = await sdk.search(name, ['artist']);
      return response.artists.items.map(artist =>
        convertSpotifyArtistToArtist(artist, RECORD_LABELS.RECORDS)
      );
    } catch (error) {
      console.error('Error searching artists:', error);
      return [];
    }
  }

  public async getArtistTracks(artistId: string): Promise<Track[]> {
    try {
      const sdk = await this.ensureSDK();
      const response = await sdk.artists.topTracks(artistId, 'US');
      return response.tracks.map(track => convertSpotifyTrackToTrack(track, RECORD_LABELS.RECORDS));
    } catch (error) {
      console.error('Error fetching artist tracks:', error);
      return [];
    }
  }

  public async searchTracks(query: string): Promise<Track[]> {
    try {
      const sdk = await this.ensureSDK();
      const response = await sdk.search(query, ['track']);
      return response.tracks.items.map(track =>
        convertSpotifyTrackToTrack(track, RECORD_LABELS.RECORDS)
      );
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  }

  public async getTrack(id: string): Promise<Track | null> {
    try {
      const sdk = await this.ensureSDK();
      const track = await sdk.tracks.get(id);
      return convertSpotifyTrackToTrack(track, RECORD_LABELS.RECORDS);
    } catch (error) {
      console.error('Error fetching track details:', error);
      return null;
    }
  }

  public async getArtistDetailsByName(artistName: string) {
    try {
      const sdk = await this.ensureSDK(); // Fixed ensureSDK usage
      const searchResults = await sdk.search(artistName, ['artist']);
      if (searchResults.artists.items.length > 0) {
        const artist = searchResults.artists.items[0];
        const fullArtistDetails = await sdk.artists.get(artist.id);
        return fullArtistDetails;
      }
      return null;
    } catch (error) {
      console.error('Error fetching artist details:', error);
      throw error;
    }
  }
}

export const spotifyService = SpotifyService.getInstance();
