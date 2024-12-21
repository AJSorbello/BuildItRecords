import { SpotifyApi } from '@spotify/web-api-ts-sdk';

class SpotifyClient {
  constructor() {
    this.clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    this.sdk = SpotifyApi.withClientCredentials(
      this.clientId,
      process.env.REACT_APP_SPOTIFY_CLIENT_SECRET
    );
  }

  async searchTracks(query, limit = 20) {
    try {
      const response = await this.sdk.search(query, ['track'], undefined, limit);
      return response.tracks.items;
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  async getTrackById(trackId) {
    try {
      return await this.sdk.tracks.get(trackId);
    } catch (error) {
      console.error('Error getting track:', error);
      throw error;
    }
  }

  async getArtistById(artistId) {
    try {
      return await this.sdk.artists.get(artistId);
    } catch (error) {
      console.error('Error getting artist:', error);
      throw error;
    }
  }

  async getArtistTopTracks(artistId) {
    try {
      return await this.sdk.artists.topTracks(artistId, 'US');
    } catch (error) {
      console.error('Error getting artist top tracks:', error);
      throw error;
    }
  }
}

export default new SpotifyClient();
