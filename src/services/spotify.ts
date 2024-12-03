import SpotifyWebApi from 'spotify-web-api-node';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '@env';

class SpotifyService {
  private spotifyApi: SpotifyWebApi;
  private static instance: SpotifyService;

  private constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
    });
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  private async ensureAccessToken() {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body.access_token);
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      throw error;
    }
  }

  public async getTrackByISRC(isrc: string) {
    await this.ensureAccessToken();
    try {
      const response = await this.spotifyApi.searchTracks(`isrc:${isrc}`);
      if (response.body.tracks?.items.length) {
        const track = response.body.tracks.items[0];
        return {
          title: track.name,
          artist: track.artists[0].name,
          imageUrl: track.album.images[0].url,
          releaseDate: track.album.release_date,
          spotifyUrl: track.external_urls.spotify,
        };
      }
      throw new Error('Track not found on Spotify');
    } catch (error) {
      console.error('Error fetching track from Spotify:', error);
      throw error;
    }
  }
}

export const spotifyService = SpotifyService.getInstance();
