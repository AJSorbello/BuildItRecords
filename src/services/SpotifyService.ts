import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Track, SpotifyImage, SpotifyApiTrack, SpotifyPlaylist } from '../types/track';
import { RecordLabel, RECORD_LABELS, LABEL_URLS } from '../constants/labels';
import { Artist } from '../types/Artist';

export interface ISpotifyService {
  getArtist(artistId: string): Promise<Artist>;
  getArtistByName(artistName: string): Promise<Artist | null>;
  getPlaylistTracks(playlistId: string): Promise<Track[]>;
  searchTracks(query: string): Promise<Track[]>;
  searchTracksByLabel(labelName: string): Promise<Track[]>;
  getTrackDetails(trackId: string): Promise<Track | null>;
  getTrackDetailsByUrl(trackUrl: string): Promise<Track | null>;
  getPlaylist(playlistId: string): Promise<SpotifyPlaylist | null>;
  getTracksByLabel(label: RecordLabel): Promise<Track[]>;
  getLabelReleases(labelName: string): Promise<Track[]>;
  getArtistDetailsByName(artistName: string): Promise<Artist | null>;
  searchArtist(query: string): Promise<Artist | null>;
  getArtistById(artistId: string): Promise<Artist | null>;
  importLabelTracks(label: RecordLabel, batchSize?: number, onProgress?: (imported: number, total: number) => void): Promise<Track[]>;
  isAuthenticated(): boolean;
  getLoginUrl(): string;
  handleRedirect(hash: string): boolean;
  logout(): void;
}

interface SpotifyApiArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  genres: string[];
  external_urls: {
    spotify: string;
  };
  followers?: {
    total: number;
  };
}

class SpotifyService implements ISpotifyService {
  private static instance: SpotifyService;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private spotifyApi: SpotifyApi | null = null;
  private accessToken: string | null = null;
  private tokenExpirationTime: number = 0;
  private labelPlaylists: Map<RecordLabel, string> = new Map();

  private constructor() {
    this.clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || '';
    this.redirectUri = process.env.REACT_APP_SPOTIFY_REDIRECT_URI || '';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      console.error('Missing Spotify credentials:', {
        clientId: !!this.clientId,
        clientSecret: !!this.clientSecret,
        redirectUri: !!this.redirectUri
      });
      throw new Error('Spotify credentials not found in environment variables');
    }

    const labelPlaylistMap: Record<RecordLabel, string> = {
      'Build It Records': process.env.SPOTIFY_RECORDS_PLAYLIST_ID || '',
      'Build It Tech': process.env.SPOTIFY_TECH_PLAYLIST_ID || '',
      'Build It Deep': process.env.SPOTIFY_DEEP_PLAYLIST_ID || '',
    };

    this.labelPlaylists = new Map(
      Object.entries(labelPlaylistMap) as [RecordLabel, string][]
    );
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  private async initializeApi(): Promise<void> {
    if (!this.spotifyApi) {
      try {
        this.spotifyApi = SpotifyApi.withClientCredentials(
          this.clientId,
          this.clientSecret
        );
        console.log('Spotify API initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Spotify API:', error);
        throw error;
      }
    }
  }

  private async ensureApiInitialized(): Promise<void> {
    if (!this.spotifyApi) {
      await this.initializeApi();
    }
  }

  private convertSpotifyArtistToArtist(spotifyArtist: SpotifyApiArtist): Artist {
    return {
      id: spotifyArtist.id,
      name: spotifyArtist.name,
      imageUrl: spotifyArtist.images[0]?.url || '',
      images: spotifyArtist.images,
      recordLabel: RECORD_LABELS['Build It Records'],
      labels: [RECORD_LABELS['Build It Records']],
      releases: [],
      spotifyUrl: spotifyArtist.external_urls.spotify,
      monthlyListeners: spotifyArtist.followers?.total,
      genres: spotifyArtist.genres || []
    };
  }

  private convertSpotifyTrackToTrack(spotifyTrack: SpotifyApiTrack): Track {
    return {
      id: spotifyTrack.id,
      name: spotifyTrack.name,
      trackTitle: spotifyTrack.name,
      artist: spotifyTrack.artists[0]?.name || '',
      artists: spotifyTrack.artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        imageUrl: '',
        recordLabel: RECORD_LABELS['Build It Records'],
        labels: [RECORD_LABELS['Build It Records']],
        releases: [],
        spotifyUrl: artist.external_urls.spotify,
        external_urls: { spotify: artist.external_urls.spotify }
      })),
      album: {
        id: spotifyTrack.album.id,
        name: spotifyTrack.album.name,
        images: spotifyTrack.album.images || [],
        releaseDate: spotifyTrack.album.release_date || '',
        totalTracks: 0  
      },
      recordLabel: RECORD_LABELS['Build It Records'],
      label: RECORD_LABELS['Build It Records'],
      albumCover: spotifyTrack.album.images[0]?.url || '',
      spotifyUrl: spotifyTrack.external_urls.spotify,
      previewUrl: spotifyTrack.preview_url || '',
      releaseDate: spotifyTrack.album.release_date || '',
      beatportUrl: '',
      soundcloudUrl: ''
    };
  }

  async getArtist(artistId: string): Promise<Artist> {
    await this.ensureApiInitialized();
    try {
      const artist = await this.spotifyApi!.artists.get(artistId);
      return this.convertSpotifyArtistToArtist(artist);
    } catch (error) {
      console.error('Error fetching artist:', error);
      throw error;
    }
  }

  async getArtistByName(artistName: string): Promise<Artist | null> {
    await this.ensureApiInitialized();
    try {
      const results = await this.spotifyApi!.search(artistName, ['artist'], undefined, 1);
      return results.artists.items.length > 0
        ? this.convertSpotifyArtistToArtist(results.artists.items[0])
        : null;
    } catch (error) {
      console.error('Error searching for artist:', error);
      return null;
    }
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    await this.ensureApiInitialized();
    const tracks: Track[] = [];
    let offset = 0;
    const limit = 50; 

    try {
      while (true) {
        const response = await this.spotifyApi!.playlists.getPlaylistItems(playlistId, undefined, undefined, limit, offset);
        const items = response.items
          .filter(item => item.track) 
          .map(item => this.convertSpotifyTrackToTrack(item.track as SpotifyApiTrack));
        
        tracks.push(...items);

        if (response.items.length < limit) break;
        offset += limit;
      }

      return tracks;
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      return [];
    }
  }

  async getTracksByLabel(label: RecordLabel): Promise<Track[]> {
    await this.ensureApiInitialized();
    try {
      const results = await this.spotifyApi!.search(
        `label:"${label}"`,
        ['track'],
        undefined,
        50
      );

      return results.tracks.items.map(track => this.convertSpotifyTrackToTrack(track));
    } catch (error) {
      console.error('Error fetching tracks by label:', error);
      return [];
    }
  }

  async importLabelTracks(
    label: RecordLabel,
    batchSize: number = 50,
    onProgress?: (imported: number, total: number) => void
  ): Promise<Track[]> {
    await this.ensureApiInitialized();
    const tracks: Track[] = [];
    const searchQueries = LABEL_URLS[label] || [];
    let totalImported = 0;

    const searchPromises = (Array.isArray(searchQueries) ? searchQueries : [searchQueries]).map(async (query: string) => {
      let offset = 0;
      while (true) {
        const results = await this.spotifyApi!.search(
          query,
          ['track'],
          undefined,
          50,
          offset
        );

        const newTracks = results.tracks.items.map(track => this.convertSpotifyTrackToTrack(track));
        tracks.push(...newTracks);
        
        totalImported += newTracks.length;
        onProgress?.(totalImported, totalImported);

        if (results.tracks.items.length < 50) break;
        offset += 50;
      }
    });

    await Promise.all(searchPromises);

    const uniqueTracks = Array.from(
      new Map(tracks.map(track => [track.id, track])).values()
    );

    return uniqueTracks;
  }

  async searchTracks(queryOrLabel: string): Promise<Track[]> {
    await this.ensureApiInitialized();
    
    const validLabel = Object.values(RECORD_LABELS).find(
      label => label.toLowerCase() === queryOrLabel.toLowerCase()
    );
    
    if (validLabel) {
      const searchQueries = LABEL_URLS[validLabel] || [];
      const allTracks: Track[] = [];
      
      for (const query of searchQueries) {
        let offset = 0;
        
        while (true) {
          try {
            const results = await this.spotifyApi!.search(
              query,
              ['track'],
              undefined,
              50,
              offset
            );
            
            if (!results.tracks.items.length) {
              break;
            }

            const tracks = results.tracks.items.map(track => this.convertSpotifyTrackToTrack(track));
            allTracks.push(...tracks);
            offset += results.tracks.items.length;
          } catch (error) {
            console.error('Error searching tracks:', error);
            break;
          }
        }
      }
      return allTracks;
    } else {
      const results = await this.spotifyApi!.search(queryOrLabel, ['track']);
      return results.tracks.items.map(track => this.convertSpotifyTrackToTrack(track));
    }
  }

  async searchTracksByLabel(labelName: string): Promise<Track[]> {
    await this.ensureApiInitialized();
    const results = await this.spotifyApi!.search(`label:${labelName}`, ['track'], undefined, 50);
    return results.tracks.items.map(track => this.convertSpotifyTrackToTrack(track));
  }

  async getTrackDetails(trackId: string): Promise<Track | null> {
    await this.ensureApiInitialized();
    const track = await this.spotifyApi!.tracks.get(trackId);
    return this.convertSpotifyTrackToTrack(track);
  }

  async getTrackDetailsByUrl(trackUrl: string): Promise<Track | null> {
    await this.ensureApiInitialized();
    const trackId = trackUrl.split('/').pop();
    if (!trackId) {
      console.error('Could not extract track ID from URL:', trackUrl);
      return null;
    }
    return this.getTrackDetails(trackId);
  }

  async getPlaylist(playlistId: string): Promise<SpotifyPlaylist | null> {
    try {
      const playlist = await this.spotifyApi!.playlists.getPlaylist(playlistId);
      return {
        ...playlist,
        tracks: {
          ...playlist.tracks,
          items: playlist.tracks.items.map(item => ({
            track: item.track as SpotifyApiTrack,
            added_at: item.added_at
          }))
        }
      };
    } catch (error) {
      console.error('Error getting playlist:', error);
      return null;
    }
  }

  async getLabelReleases(labelName: string): Promise<Track[]> {
    await this.ensureApiInitialized();
    const playlistUrl = LABEL_URLS[labelName as keyof typeof LABEL_URLS];
    if (!playlistUrl) {
      console.error('No playlist URL found for label:', labelName);
      return [];
    }

    const playlistId = playlistUrl.split('/').pop();
    if (!playlistId) {
      console.error('Could not extract playlist ID from URL:', playlistUrl);
      return [];
    }

    return this.getPlaylistTracks(playlistId);
  }

  async getArtistDetailsByName(artistName: string): Promise<Artist | null> {
    await this.ensureApiInitialized();
    try {
      const results = await this.spotifyApi!.search(artistName, ['artist'], undefined, 1);
      if (results.artists.items.length > 0) {
        const artist = this.convertSpotifyArtistToArtist(results.artists.items[0]);
        const topTracks = await this.spotifyApi!.artists.topTracks(artist.id, 'US');
        artist.tracks = topTracks.tracks.map((track: any) => this.convertSpotifyTrackToTrack(track));
        return artist;
      }
      return null;
    } catch (error) {
      console.error('Error searching for artist:', error);
      return null;
    }
  }

  async searchArtist(query: string): Promise<Artist | null> {
    await this.ensureApiInitialized();
    return this.getArtistByName(query);
  }

  async getArtistById(artistId: string): Promise<Artist | null> {
    await this.ensureApiInitialized();
    return this.getArtist(artistId);
  }

  async searchArtists(query: string, offset = 0): Promise<SpotifyApiArtist[]> {
    try {
      const results = await this.spotifyApi!.search(
        query,
        ['artist'],
        undefined,
        50,
        offset
      );
      return results.artists.items;
    } catch (error) {
      console.error('Error searching artists:', error);
      return [];
    }
  }

  private retryCount = 0;
  private maxRetries = 3;

  private async retryWithBackoff(
    operation: () => Promise<any>,
    maxRetries = this.maxRetries,
    delay = 1000
  ): Promise<any> {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        retries++;
        if (retries === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, retries)));
      }
    }
  }

  private async fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
    return this.retryWithBackoff(async () => {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    });
  }

  private accessTokenExpired(): boolean {
    return !this.accessToken || Date.now() >= this.tokenExpirationTime;
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    const tokenExpired = this.accessTokenExpired();
    if (tokenExpired) {
      await this.refreshAccessToken();
    }
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpirationTime = Date.now() + (data.expires_in * 1000);
      
      if (this.spotifyApi) {
        this.spotifyApi.setAccessToken(this.accessToken);
      }
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  handleRedirect(hash: string): boolean {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    if (accessToken) {
      this.spotifyApi = SpotifyApi.withAccessToken(this.clientId, {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: '',
        expires: Date.now() + 3600 * 1000
      });
      return true;
    }
    return false;
  }

  isAuthenticated(): boolean {
    return this.spotifyApi !== null;
  }

  getLoginUrl(): string {
    const scopes = ['user-read-private', 'playlist-read-private'];
    const state = Math.random().toString(36).substring(7);
    return `https://accounts.spotify.com/authorize?client_id=${this.clientId}&response_type=token&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}&state=${state}`;
  }

  logout(): void {
    this.spotifyApi = null;
  }
}

export const spotifyService = SpotifyService.getInstance();
