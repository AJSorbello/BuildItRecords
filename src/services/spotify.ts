import { SpotifyApi } from '@spotify/web-api-ts-sdk';

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID ?? '';
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET ?? '';
const SPOTIFY_REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI ?? '';

class SpotifyService {
  private spotifyApi: SpotifyApi;
  private static instance: SpotifyService;

  private constructor() {
    this.spotifyApi = SpotifyApi.withClientCredentials(
      SPOTIFY_CLIENT_ID,
      SPOTIFY_CLIENT_SECRET
    );
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  public async getTrackByISRC(isrc: string) {
    try {
      const searchResults = await this.spotifyApi.search(`isrc:${isrc}`, ['track']);
      const tracks = searchResults.tracks.items;
      
      if (tracks.length > 0) {
        const track = tracks[0];
        return {
          title: track.name,
          artist: track.artists[0].name,
          imageUrl: track.album.images[0]?.url,
          releaseDate: track.album.release_date,
          spotifyUrl: track.external_urls.spotify,
        };
      }
      throw new Error('Track not found on Spotify');
    } catch (error) {
      console.error('Error searching track on Spotify:', error);
      throw error;
    }
  }
}

export const spotifyService = SpotifyService.getInstance();
