import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Track } from '../types/track';
import { Artist } from '../types/artist';
import { Album } from '../types/release';
import { createArtistFromSpotify, createTrackFromSpotify } from '../utils/spotifyUtils';

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
      state,
      scope: scopes.join(' ')
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async getArtist(id: string): Promise<Artist | null> {
    try {
      const artist = await this.api.artists.get(id);
      return createArtistFromSpotify(artist);
    } catch (error) {
      console.error('Error fetching artist:', error);
      return null;
    }
  }

  async getTrack(id: string): Promise<Track | null> {
    try {
      const track = await this.api.tracks.get(id);
      return createTrackFromSpotify(track);
    } catch (error) {
      console.error('Error fetching track:', error);
      return null;
    }
  }

  async getPlaylist(id: string) {
    try {
      return await this.api.playlists.getPlaylist(id);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      return null;
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    try {
      const results = await this.api.search(query, ['track']);
      return results.tracks.items.map(track => createTrackFromSpotify(track));
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  }
}

export const spotifyService = new SpotifyService();
