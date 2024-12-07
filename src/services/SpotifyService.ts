import { SpotifyApi, Track as SpotifyTrackSDK, Artist as SpotifyArtist, SearchResults } from '@spotify/web-api-ts-sdk';
import { Track, SpotifyImage, SpotifyApiTrack, SpotifyPlaylist, Album } from '../types/track';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';

/**
 * Service for interacting with the Spotify Web API
 */
export class SpotifyService {
  private spotifyApi: SpotifyApi;
  private static instance: SpotifyService;
  private accessToken: string | null = null;
  private tokenExpiration = 0;

  private constructor() {
    this.spotifyApi = SpotifyApi.withClientCredentials(
      process.env.REACT_APP_SPOTIFY_CLIENT_ID || '',
      process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || ''
    );
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.spotifyApi.getAccessToken()) {
      await this.spotifyApi.authenticate();
    }
  }

  private convertSpotifyTrackToTrack(track: SpotifyTrackSDK, label: RecordLabel): Track {
    const album: Album = {
      name: track.album.name,
      releaseDate: track.album.release_date,
      images: track.album.images.map((img: SpotifyImage) => ({
        url: img.url,
        height: img.height ?? 0,
        width: img.width ?? 0
      }))
    };

    return {
      id: track.id,
      trackTitle: track.name,
      artist: track.artists.map((artist: { name: string }) => artist.name).join(', '),
      albumCover: track.album.images[0]?.url || '',
      album,
      recordLabel: label,
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls.spotify,
      releaseDate: track.album.release_date,
      beatportUrl: '',
      soundcloudUrl: ''
    };
  }

  private extractTrackId(trackUrl: string): string | null {
    const match = trackUrl.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  async getTrackDetailsByUrl(trackUrl: string): Promise<Track | null> {
    try {
      const trackId = this.extractTrackId(trackUrl);
      if (!trackId) {
        throw new Error('Invalid Spotify URL');
      }
      return await this.getTrackDetails(trackId);
    } catch (error) {
      console.error('Error getting track details by URL:', error);
      return null;
    }
  }

  async searchTracks(query: string): Promise<Track[]> {
    try {
      await this.ensureValidToken();
      const results = await this.spotifyApi.search(query, ['track']);
      return results.tracks.items.map((track: SpotifyTrackSDK) => 
        this.convertSpotifyTrackToTrack(track, RECORD_LABELS.RECORDS)
      );
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  }

  async searchTracksByLabel(labelName: string): Promise<Track[]> {
    try {
      await this.ensureValidToken();
      const searchResults = await this.spotifyApi.search(`label:${labelName}`, ['track']);
      return searchResults.tracks.items.map((track: SpotifyTrackSDK) => {
        const label = this.determineLabelFromUrl(track.external_urls.spotify);
        return this.convertSpotifyTrackToTrack(track, label);
      });
    } catch (error) {
      console.error('Error searching tracks by label:', error);
      return [];
    }
  }

  async getTrackDetails(trackId: string): Promise<Track | null> {
    try {
      await this.ensureValidToken();
      const track = await this.spotifyApi.tracks.get(trackId);
      return this.convertSpotifyTrackToTrack(track, RECORD_LABELS.RECORDS);
    } catch (error) {
      console.error('Error getting track details:', error);
      return null;
    }
  }

  async getPlaylist(playlistId: string): Promise<SpotifyPlaylist | null> {
    try {
      await this.ensureValidToken();
      const playlist = await this.spotifyApi.playlists.getPlaylist(playlistId);
      return {
        ...playlist,
        tracks: {
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

  async importLabelTracks(
    label: RecordLabel,
    batchSize = 50,
    onProgress?: (imported: number, total: number) => void
  ): Promise<Track[]> {
    try {
      await this.ensureValidToken();
      const tracks: Track[] = [];
      let offset = 0;
      let total = batchSize;

      while (offset < total) {
        const results = await this.searchTracks(`label:"${label}"`);
        total = results.length;
        tracks.push(...results);
        offset += batchSize;
        
        if (onProgress) {
          onProgress(Math.min(offset, total), total);
        }
      }

      return tracks;
    } catch (error) {
      console.error('Error importing label tracks:', error);
      return [];
    }
  }

  private determineLabelFromUrl(spotifyUrl: string): RecordLabel {
    if (spotifyUrl.includes('records')) return RECORD_LABELS.RECORDS;
    if (spotifyUrl.includes('tech')) return RECORD_LABELS.TECH;
    if (spotifyUrl.includes('deep')) return RECORD_LABELS.DEEP;
    return RECORD_LABELS.RECORDS;
  }

  async getSimplifiedTrackDetails(trackUrl: string) {
    try {
      const trackId = this.extractTrackId(trackUrl);
      if (!trackId) {
        throw new Error('Invalid Spotify track URL');
      }

      await this.ensureValidToken();
      const track = await this.spotifyApi.tracks.get(trackId);
      
      return {
        id: track.id,
        trackTitle: track.name,
        artist: track.artists.map((artist: { name: string }) => artist.name).join(', '),
        albumCover: track.album.images[0]?.url || '',
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls.spotify
      };
    } catch (error) {
      console.error('Error getting simplified track details:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.tokenExpiration;
  }

  getLoginUrl(): string {
    return `https://accounts.spotify.com/authorize?client_id=${process.env.REACT_APP_SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(process.env.REACT_APP_SPOTIFY_REDIRECT_URI || '')}&scope=user-read-private%20playlist-read-private`;
  }

  handleRedirect(hash: string): boolean {
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    if (accessToken) {
      this.accessToken = accessToken;
      this.tokenExpiration = Date.now() + 3600 * 1000; // 1 hour
      return true;
    }
    return false;
  }

  logout(): void {
    this.accessToken = null;
    this.tokenExpiration = 0;
  }

  async searchArtist(query: string): Promise<SpotifyArtist | null> {
    try {
      await this.ensureValidToken();
      const results = await this.spotifyApi.search(query, ['artist']);
      
      if (results.artists.items.length > 0) {
        return results.artists.items[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error searching for artist:', error);
      return null;
    }
  }

  async getArtistDetailsByName(artistName: string, trackTitle?: string): Promise<SpotifyArtist | null> {
    try {
      await this.ensureValidToken();
      
      // First try to find the specific track
      if (trackTitle) {
        console.log('Searching for specific track:', trackTitle, 'by', artistName);
        const trackResults = await this.spotifyApi.search(`track:${trackTitle} artist:${artistName}`, ['track']);
        
        if (trackResults.tracks.items.length > 0) {
          // Find the track that matches both title and artist
          const matchingTrack = trackResults.tracks.items.find(track => 
            track.artists.some(artist => 
              artist.name.toLowerCase() === artistName.toLowerCase()
            )
          );

          if (matchingTrack) {
            console.log('Found matching track:', {
              title: matchingTrack.name,
              artists: matchingTrack.artists.map(a => a.name)
            });

            // Get the matching artist from the track
            const matchingArtist = matchingTrack.artists.find(
              artist => artist.name.toLowerCase() === artistName.toLowerCase()
            );

            if (matchingArtist) {
              console.log('Found exact artist match from track:', matchingArtist.name);
              return await this.getArtistDetails(matchingArtist.id);
            }
          }
        }
      }

      // Fallback to previous search strategies if track search fails
      const searchStrategies = [
        `artist:${artistName} genre:electronic`,
        `${artistName} genre:electronic genre:techno`,
        artistName
      ];

      for (const searchQuery of searchStrategies) {
        console.log(`Trying fallback search query: ${searchQuery}`);
        const results = await this.spotifyApi.search(searchQuery, ['artist']);
        
        if (results.artists.items.length > 0) {
          const exactMatch = results.artists.items.find(
            a => a.name.toLowerCase() === artistName.toLowerCase()
          );

          if (exactMatch) {
            console.log('Found exact artist match from search:', exactMatch.name);
            return await this.getArtistDetails(exactMatch.id);
          }
        }
      }

      console.log(`No artist found for: ${artistName}`);
      return null;
    } catch (error) {
      console.error('Error getting artist details by name:', error);
      return null;
    }
  }

  async getArtistDetails(artistId: string): Promise<SpotifyArtist | null> {
    try {
      if (!artistId || artistId.length < 10) {
        throw new Error('Invalid artist ID');
      }
      
      await this.ensureValidToken();
      const artist = await this.spotifyApi.artists.get(artistId);
      
      // Log the raw artist data for debugging
      console.log('Raw artist data:', {
        name: artist.name,
        id: artist.id,
        genres: artist.genres,
        images: artist.images?.map(img => ({
          url: img.url,
          width: img.width,
          height: img.height
        }))
      });

      // Filter and sort images
      if (artist.images && artist.images.length > 0) {
        // Prefer square images for artist profiles
        const profileImages = artist.images
          .filter(img => {
            // Filter out known album art patterns
            if (img.url.includes('ab67616d')) return false;
            // Prefer square-ish images (likely profile photos)
            const ratio = img.width && img.height ? img.width / img.height : 1;
            return ratio > 0.9 && ratio < 1.1;
          })
          .sort((a, b) => (b.width || 0) - (a.width || 0));

        if (profileImages.length > 0) {
          artist.images = profileImages;
          console.log('Found suitable profile images:', profileImages);
        } else {
          console.log('No suitable profile images found, using original images');
        }
      }
      
      return artist;
    } catch (error) {
      console.error('Error getting artist details:', error);
      return null;
    }
  }

  async getLabelReleases(labelName: string): Promise<Track[]> {
    try {
      await this.ensureValidToken();
      const searchResults = await this.spotifyApi.search(`label:${labelName}`, ['track']);
      
      return searchResults.tracks.items.map((track: SpotifyTrackSDK) => {
        const label = this.determineLabelFromUrl(track.external_urls.spotify);
        return this.convertSpotifyTrackToTrack(track, label);
      });
    } catch (error) {
      console.error('Error getting label releases:', error);
      return [];
    }
  }
}

export const spotifyService = SpotifyService.getInstance();
