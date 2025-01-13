import { SpotifyApi } from '@spotify/web-api-ts-sdk';

class SpotifyClient {
  private clientId: string;
  private sdk: SpotifyApi;

  constructor() {
    this.clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
    this.sdk = SpotifyApi.withClientCredentials(
      this.clientId,
      process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || ''
    );
  }

  async searchTracks(query: string, limit: number = 20) {
    try {
      const response = await this.sdk.search(query, ['track'], undefined, limit);
      return response.tracks.items;
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  async getTrackById(trackId: string) {
    try {
      return await this.sdk.tracks.get(trackId);
    } catch (error) {
      console.error('Error getting track:', error);
      throw error;
    }
  }

  async getArtistById(artistId: string) {
    try {
      return await this.sdk.artists.get(artistId);
    } catch (error) {
      console.error('Error getting artist:', error);
      throw error;
    }
  }
}

export default new SpotifyClient();
