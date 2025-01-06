import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Track } from '../types/track';
import { Artist } from '../types/artist';
import { Album } from '../types/release';
import { transformSpotifyTrack, transformSpotifyArtist, transformSpotifyAlbum } from '../utils/spotifyUtils';
import { API_URL } from '../config';

class SpotifyService {
  private api: SpotifyApi;
  private clientId: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
    this.redirectUri = process.env.REACT_APP_SPOTIFY_REDIRECT_URI || '';
    this.api = SpotifyApi.withUserAuthorization(
      this.clientId,
      this.redirectUri,
      ['user-read-private', 'user-read-email', 'playlist-read-private']
    );
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
        tracks: playlist.tracks.items.map(item => transformSpotifyTrack(item.track))
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
        return transformSpotifyTrack(searchResults.tracks.items[0]);
      }
      return null;
    } catch (error) {
      console.error('Error searching track by ISRC:', error);
      return null;
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    try {
      const results = await this.api.search.search(query, ['track']);
      return results.tracks.items.map(track => transformSpotifyTrack(track));
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
        return transformSpotifyArtist(artist);
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
      return transformSpotifyArtist(artist);
    } catch (error) {
      console.error('Error fetching artist by ID:', error);
      return null;
    }
  }

  async getArtistTopTracks(artistId: string): Promise<Track[]> {
    try {
      const response = await this.api.artists.topTracks(artistId, 'US');
      return response.tracks.map(track => transformSpotifyTrack(track));
    } catch (error) {
      console.error('Error fetching artist top tracks:', error);
      return [];
    }
  }

  async getArtistAlbums(artistId: string): Promise<Album[]> {
    try {
      const response = await this.api.artists.albums(artistId);
      return response.items.map(album => transformSpotifyAlbum(album));
    } catch (error) {
      console.error('Error fetching artist albums:', error);
      return [];
    }
  }

  async getAlbumTracks(albumId: string): Promise<Track[]> {
    try {
      const response = await this.api.albums.tracks(albumId);
      return response.items.map(track => transformSpotifyTrack(track));
    } catch (error) {
      console.error('Error fetching album tracks:', error);
      return [];
    }
  }

  async getTrack(trackId: string): Promise<Track | null> {
    try {
      const track = await this.api.tracks.get(trackId);
      return transformSpotifyTrack(track);
    } catch (error) {
      console.error('Error fetching track:', error);
      return null;
    }
  }

  async getTracksByLabel(labelId: string): Promise<Track[]> {
    try {
      const response = await fetch(`${API_URL}/tracks?label=${labelId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tracks');
      }
      const data = await response.json();
      return data.tracks.map((track: any) => transformSpotifyTrack(track));
    } catch (error) {
      console.error('Error fetching tracks by label:', error);
      return [];
    }
  }

  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    try {
      const response = await this.api.playlists.getPlaylistTracks(playlistId);
      return response.items.map(item => transformSpotifyTrack(item.track));
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      return [];
    }
  }
}

export const spotifyService = new SpotifyService();
