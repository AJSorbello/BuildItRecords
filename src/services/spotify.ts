import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import type { SpotifyApiTrack } from '../types/track';
import type { Track } from '../types/track';
import type { Artist } from '../types/artist';
import type { Album } from '../types/release';
import { getSpotifyApi } from '../utils/spotifyAuth';
import { transformSpotifyTrack } from '../utils/trackUtils';

class SpotifyService {
  private api: SpotifyApi | null = null;

  private async getApi(): Promise<SpotifyApi> {
    if (!this.api) {
      this.api = await getSpotifyApi();
    }
    return this.api;
  }

  async search(
    query: string,
    types: ('album' | 'artist' | 'track')[],
    options: {
      market?: string;
      limit?: number;
      offset?: number;
      includeExternal?: 'audio';
    } = {}
  ) {
    try {
      const api = await this.getApi();
      const response = await api.search(
        query,
        types,
        options.market,
        options.limit,
        options.offset,
        options.includeExternal
      );
      return response;
    } catch (error) {
      console.error('Error searching Spotify:', error);
      throw error;
    }
  }

  async getArtist(id: string): Promise<Artist> {
    try {
      const api = await this.getApi();
      const artist = await api.artists.get(id);
      
      return {
        id: artist.id,
        name: artist.name,
        uri: artist.uri,
        type: 'artist',
        external_urls: artist.external_urls,
        spotifyUrl: artist.external_urls.spotify,
        images: artist.images,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers
      };
    } catch (error) {
      console.error(`Error fetching artist with ID ${id}:`, error);
      throw error;
    }
  }

  async getArtists(ids: string[]): Promise<Artist[]> {
    try {
      const api = await this.getApi();
      const chunks = [];
      for (let i = 0; i < ids.length; i += 50) {
        chunks.push(ids.slice(i, i + 50));
      }

      const artistPromises = chunks.map(chunk => 
        api.artists.get(chunk)
      );

      const responses = await Promise.all(artistPromises);
      return responses.flatMap(response => response.artists)
        .filter(artist => artist !== null)
        .map(artist => ({
          id: artist.id,
          name: artist.name,
          uri: artist.uri,
          type: 'artist',
          external_urls: artist.external_urls,
          spotifyUrl: artist.external_urls.spotify,
          images: artist.images,
          genres: artist.genres,
          popularity: artist.popularity,
          followers: artist.followers
        }));
    } catch (error) {
      console.error('Error fetching multiple artists:', error);
      throw error;
    }
  }

  async getTrack(id: string): Promise<Track> {
    try {
      const api = await this.getApi();
      const track = await api.tracks.get(id);
      return transformSpotifyTrack(track);
    } catch (error) {
      console.error(`Error fetching track with ID ${id}:`, error);
      throw error;
    }
  }

  async getTracks(ids: string[], market?: string): Promise<Track[]> {
    try {
      const api = await this.getApi();
      const chunks = [];
      for (let i = 0; i < ids.length; i += 50) {
        chunks.push(ids.slice(i, i + 50));
      }

      const trackPromises = chunks.map(chunk => 
        api.tracks.get(chunk, market)
      );

      const responses = await Promise.all(trackPromises);
      return responses.flatMap(response => response.tracks)
        .filter((track): track is SpotifyApiTrack => track !== null)
        .map(transformSpotifyTrack);
    } catch (error) {
      console.error('Error fetching multiple tracks:', error);
      throw error;
    }
  }

  async getArtistTopTracks(artistId: string, market: string = 'US'): Promise<Track[]> {
    try {
      const api = await this.getApi();
      const response = await api.artists.getTopTracks(artistId, market);
      return response.tracks.map(transformSpotifyTrack);
    } catch (error) {
      console.error(`Error fetching top tracks for artist ${artistId}:`, error);
      throw error;
    }
  }

  async getArtistAlbums(
    artistId: string,
    options: {
      include_groups?: ('album' | 'single' | 'appears_on' | 'compilation')[];
      market?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Album[]> {
    try {
      const api = await this.getApi();
      const response = await api.artists.getAlbums(
        artistId,
        options.include_groups,
        options.market,
        options.limit,
        options.offset
      );

      return response.items.map(album => ({
        id: album.id,
        name: album.name,
        type: album.album_type,
        artists: album.artists.map(artist => ({
          id: artist.id,
          name: artist.name,
          uri: artist.uri,
          type: 'artist',
          external_urls: artist.external_urls,
          spotifyUrl: artist.external_urls.spotify
        })),
        release_date: album.release_date,
        release_date_precision: album.release_date_precision,
        total_tracks: album.total_tracks,
        uri: album.uri,
        external_urls: album.external_urls,
        images: album.images,
        spotifyUrl: album.external_urls.spotify
      }));
    } catch (error) {
      console.error(`Error fetching albums for artist ${artistId}:`, error);
      throw error;
    }
  }

  async getRelatedArtists(artistId: string): Promise<Artist[]> {
    try {
      const api = await this.getApi();
      const response = await api.artists.getRelatedArtists(artistId);
      
      return response.artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        uri: artist.uri,
        type: 'artist',
        external_urls: artist.external_urls,
        spotifyUrl: artist.external_urls.spotify,
        images: artist.images,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers
      }));
    } catch (error) {
      console.error(`Error fetching related artists for ${artistId}:`, error);
      throw error;
    }
  }

  async getTracksByLabel(labelId: string): Promise<SpotifyApiTrack[]> {
    try {
      const api = await this.getApi();
      const response = await api.search(
        `label:${labelId}`,
        ['track'],
        'US',
        50
      );
      return response.tracks.items;
    } catch (error) {
      console.error(`Error fetching tracks for label ${labelId}:`, error);
      return [];
    }
  }
}

export const spotifyService = new SpotifyService();
