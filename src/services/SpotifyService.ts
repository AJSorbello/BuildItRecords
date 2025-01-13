import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { Track } from '../types/track';
import type { Artist } from '../types/artist';
import type { SpotifyImage } from '../types/spotify';
import { transformSpotifyTrack } from '../utils/spotifyUtils';

interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  type: 'track';
  artists: Array<{
    id: string;
    name: string;
    uri?: string;
    external_urls?: { spotify: string };
  }>;
  album: {
    id: string;
    name: string;
    images: SpotifyImage[];
    release_date: string;
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  external_ids?: {
    [key: string]: string;
  };
  popularity?: number;
}

export class SpotifyService {
  private api: SpotifyApi;
  private clientId: string;
  private redirectUri: string;

  constructor(accessToken?: string) {
    this.clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
    this.redirectUri = process.env.REACT_APP_SPOTIFY_REDIRECT_URI || '';
    if (accessToken) {
      this.api = SpotifyApi.withAccessToken('', accessToken);
    } else {
      this.api = SpotifyApi.withUserAuthorization(
        this.clientId,
        this.redirectUri,
        ['user-read-private', 'user-read-email', 'playlist-read-private']
      );
    }
  }

  private transformTrack(track: SpotifyTrack): Track {
    return {
      id: track.id,
      name: track.name,
      uri: track.uri,
      type: track.type,
      artists: track.artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        spotifyUrl: artist.external_urls?.spotify
      })),
      album: {
        id: track.album.id,
        name: track.album.name,
        images: track.album.images,
        release_date: track.album.release_date
      },
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      external_urls: track.external_urls,
      external_ids: track.external_ids,
      popularity: track.popularity,
      spotifyUrl: track.external_urls.spotify,
      releaseDate: track.album.release_date
    };
  }

  async init() {
    try {
      await this.api.authenticate();
      return true;
    } catch (error) {
      console.error('Failed to initialize Spotify API:', error);
      return false;
    }
  }

  async authenticate() {
    try {
      await this.api.authenticate();
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  isAuthenticated() {
    return this.api.getAccessToken() !== null;
  }

  async getLoginUrl() {
    const scopes = ['user-read-private', 'user-read-email', 'playlist-read-private'];
    const state = Math.random().toString(36).substring(7);
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      state
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async getPlaylist(playlistId: string) {
    try {
      const playlist = await this.api.playlists.getPlaylist(playlistId);
      return {
        ...playlist,
        tracks: playlist.tracks.items.map(item => this.transformTrack(item.track as SpotifyTrack))
      };
    } catch (error) {
      console.error('Error fetching playlist:', error);
      return null;
    }
  }

  async searchTrackByISRC(isrc: string): Promise<Track | null> {
    try {
      const searchResults = await this.api.search.search(`isrc:${isrc}`, ['track']);
      if (searchResults.tracks.items.length > 0) {
        return this.transformTrack(searchResults.tracks.items[0] as SpotifyTrack);
      }
      return null;
    } catch (error) {
      console.error('Error searching track by ISRC:', error);
      return null;
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    try {
      const response = await this.api.search(query, ['track']);
      return response.tracks.items.map(track => transformSpotifyTrack(track));
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  }

  async getArtistDetailsByName(name: string): Promise<Artist | null> {
    try {
      const results = await this.api.search.search(name, ['artist']);
      if (results.artists.items.length > 0) {
        const artist = results.artists.items[0];
        return {
          id: artist.id,
          name: artist.name,
          spotifyUrl: artist.external_urls.spotify
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching artist details:', error);
      return null;
    }
  }

  async getArtistById(id: string): Promise<Artist | null> {
    try {
      const artist = await this.api.artists.get(id);
      return {
        id: artist.id,
        name: artist.name,
        spotifyUrl: artist.external_urls.spotify
      };
    } catch (error) {
      console.error('Error fetching artist by ID:', error);
      return null;
    }
  }

  async getArtistTopTracks(artistId: string): Promise<Track[]> {
    try {
      const response = await this.api.artists.topTracks(artistId, 'US');
      return response.tracks.map(track => this.transformTrack(track as SpotifyTrack));
    } catch (error) {
      console.error('Error fetching artist top tracks:', error);
      return [];
    }
  }

  async getArtistAlbums(artistId: string): Promise<any[]> {
    try {
      const response = await this.api.artists.albums(artistId);
      return response.items;
    } catch (error) {
      console.error('Error fetching artist albums:', error);
      return [];
    }
  }

  async getAlbumTracks(albumId: string): Promise<Track[]> {
    try {
      const response = await this.api.albums.tracks(albumId);
      return response.items.map(track => this.transformTrack(track as SpotifyTrack));
    } catch (error) {
      console.error('Error fetching album tracks:', error);
      return [];
    }
  }

  async getTrack(trackId: string): Promise<Track | null> {
    try {
      const track = await this.api.tracks.get(trackId);
      return this.transformTrack(track as SpotifyTrack);
    } catch (error) {
      console.error('Error fetching track:', error);
      return null;
    }
  }

  async getTracksByLabel(labelId: string): Promise<Track[]> {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/tracks?label=${labelId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tracks');
      }
      const data = await response.json();
      return data.tracks.map((track: any) => this.transformTrack(track));
    } catch (error) {
      console.error('Error fetching tracks by label:', error);
      return [];
    }
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    try {
      const response = await this.api.playlists.getTracks(playlistId);
      return response.items.map(item => this.transformTrack(item.track as SpotifyTrack));
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      return [];
    }
  }

  async getTrackDetailsByUrl(spotifyUrl: string): Promise<Track | null> {
    try {
      const trackId = this.extractTrackId(spotifyUrl);
      if (!trackId) return null;

      const response = await this.api.tracks.get(trackId);
      if (!response) return null;

      return this.transformTrack(response as SpotifyTrack);
    } catch (error) {
      console.error('Error fetching track details:', error);
      return null;
    }
  }

  async importLabelTracks(playlistUrl: string): Promise<Track[]> {
    try {
      const playlistId = this.extractPlaylistId(playlistUrl);
      const response = await this.api.playlists.getTracks(playlistId);
      
      return response.items
        .filter(item => item.track)
        .map(item => transformSpotifyTrack(item.track));
    } catch (error) {
      console.error('Error importing tracks from Spotify:', error);
      throw error;
    }
  }

  private extractPlaylistId(url: string): string {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (!match) {
      throw new Error('Invalid playlist URL');
    }
    return match[1];
  }

  private extractTrackId(url: string): string {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    if (!match) {
      throw new Error('Invalid track URL');
    }
    return match[1];
  }

  // Mapping of label IDs to their Spotify playlist IDs
  private readonly LABEL_PLAYLISTS = {
    'buildit-deep': '37i9dQZF1DX6VdMW310YC7',  // Deep House Playlist
    'buildit-tech': '37i9dQZF1DX6J5NfMJS675',  // Tech House Playlist
    'buildit-house': '37i9dQZF1DXa8NOEUWPn9W'   // House Music Playlist
  };

  async getPlaylistIdByLabel(labelId: string): Promise<string> {
    console.log('Getting playlist ID for label:', labelId);
    const playlistId = this.LABEL_PLAYLISTS[labelId as keyof typeof this.LABEL_PLAYLISTS];
    
    if (!playlistId) {
      console.error('No playlist found for label:', labelId);
      throw new Error(`No playlist found for label ${labelId}`);
    }
    
    console.log('Found playlist ID:', playlistId);
    return playlistId;
  }
}

export const spotifyService = new SpotifyService();
