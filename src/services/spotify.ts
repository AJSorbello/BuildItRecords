import { SpotifyApi, type Track as SpotifyTrack } from '@spotify/web-api-ts-sdk';
import { Track } from '../types/track';
import { transformSpotifyTrack } from '../utils/spotifyUtils';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';

class SpotifyService {
  private static instance: SpotifyService;
  private api: SpotifyApi;

  private constructor() {
    this.api = SpotifyApi.withClientCredentials(
      process.env.REACT_APP_SPOTIFY_CLIENT_ID || '',
      process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || '',
      []
    );
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  async getTracksByLabel(label: RecordLabel): Promise<Track[]> {
    try {
      const playlistId = RECORD_LABELS[label].playlistId;
      if (!playlistId) {
        throw new Error(`No playlist ID configured for label ${label}`);
      }

      const response = await this.api.playlists.getPlaylistItems(playlistId);
      return response.items
        .filter(item => item.track)
        .map(item => transformSpotifyTrack(item.track as SpotifyTrack));
    } catch (error) {
      console.error(`Error fetching tracks for label ${label}:`, error);
      return [];
    }
  }

  async searchTrackByISRC(isrc: string): Promise<Track | null> {
    try {
      const searchResults = await this.api.search(`isrc:${isrc}`, ['track']);
      if (searchResults.tracks.items.length > 0) {
        return transformSpotifyTrack(searchResults.tracks.items[0]);
      }
      return null;
    } catch (error) {
      console.error('Error searching track by ISRC:', error);
      return null;
    }
  }
}

export const spotifyService = SpotifyService.getInstance();
