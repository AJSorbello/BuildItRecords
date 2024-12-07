import SpotifyWebApi from 'spotify-web-api-node';
import { SpotifyTrack, SpotifyImage, SpotifyApiTrack, SpotifyPlaylist, SimplifiedTrackOutput, SpotifyAlbum } from '../types/spotify';

const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID ?? '';
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET ?? '';
const SPOTIFY_REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI ?? '';

/**
 * Spotify API service class.
 */
export class SpotifyService {
  private static instance: SpotifyService;
  private spotifyApi: SpotifyWebApi;
  private tokenExpirationTime = 0;
  private accessToken: string | null = null;

  private constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      redirectUri: SPOTIFY_REDIRECT_URI
    });
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  public async ensureAccessToken(): Promise<void> {
    try {
      if (!this.accessToken || Date.now() >= this.tokenExpirationTime) {
        console.log('Getting new Spotify access token...');
        
        // Use btoa for base64 encoding in the browser
        const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
        
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Failed to get access token:', errorData);
          throw new Error(`Failed to get Spotify access token: ${errorData}`);
        }

        const data = await response.json();
        console.log('Got access token response:', { 
          success: !!data.access_token,
          expiresIn: data.expires_in 
        });

        if (!data.access_token) {
          throw new Error('No access token received from Spotify');
        }

        this.accessToken = data.access_token;
        this.tokenExpirationTime = Date.now() + (data.expires_in * 1000);
        
        if (this.accessToken) {
          this.spotifyApi.setAccessToken(this.accessToken);
          console.log('Successfully set new access token');
        }
      }
    } catch (error) {
      console.error('Error in ensureAccessToken:', error);
      throw error;
    }
  }

  private async ensureValidToken(): Promise<void> {
    await this.ensureAccessToken();
  }

  private convertImages(images: { url: string; height?: number | null; width?: number | null; }[]): SpotifyImage[] {
    return images.map(image => ({
      url: image.url,
      height: image.height ?? 0,
      width: image.width ?? 0
    }));
  }

  private convertToSpotifyApiTrack(track: SpotifyApi.TrackObjectFull): SpotifyApiTrack {
    return {
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        external_urls: artist.external_urls
      })),
      album: {
        id: track.album.id,
        name: track.album.name,
        images: track.album.images.map(image => ({
          url: image.url,
          height: image.height ?? null,
          width: image.width ?? null
        })),
        artists: track.album.artists.map(artist => ({
          id: artist.id,
          name: artist.name,
          external_urls: artist.external_urls
        })),
        release_date: track.album.release_date,
        external_urls: track.album.external_urls,
        label: 'Unknown Label' // We'll update this when we fetch album details
      },
      preview_url: track.preview_url,
      external_urls: track.external_urls
    };
  }

  private convertToSpotifyApiPlaylist(playlist: SpotifyApi.SinglePlaylistResponse): SpotifyPlaylist {
    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      images: playlist.images.map(image => ({
        url: image.url,
        height: image.height ?? null,
        width: image.width ?? null
      })),
      tracks: {
        items: playlist.tracks.items.map(item => ({
          track: this.convertToSpotifyApiTrack(item.track as SpotifyApi.TrackObjectFull),
          added_at: item.added_at
        }))
      },
      external_urls: playlist.external_urls
    };
  }

  public async getTrackDetails(trackId: string): Promise<SpotifyTrack | null> {
    try {
      await this.ensureValidToken();
      const response = await this.spotifyApi.getTrack(trackId);
      const track = response.body;

      const apiTrack = this.convertToSpotifyApiTrack(track);
      return this.convertTrackToSpotifyTrack(apiTrack);
    } catch (error) {
      console.error('Error fetching track details:', error);
      return null;
    }
  }

  private async convertTrackToSpotifyTrack(track: SpotifyApiTrack): Promise<SpotifyTrack> {
    await this.ensureValidToken();
    
    try {
      // Get album details to get the label
      const albumResponse = await this.spotifyApi.getAlbum(track.album.id);
      const album = albumResponse.body;
      
      // Debug log
      console.log('Album response:', album);
      console.log('Album images:', track.album.images);
      
      // Get the highest quality image or use a placeholder
      let albumCover = 'https://via.placeholder.com/300';
      if (track.album.images && track.album.images.length > 0) {
        const bestImage = track.album.images.sort((a, b) => (b.width || 0) - (a.width || 0))[0];
        if (bestImage && bestImage.url) {
          albumCover = bestImage.url;
        }
      }
      
      // Debug log
      console.log('Selected album cover:', albumCover);
      
      // Convert album
      const spotifyAlbum: SpotifyAlbum = {
        id: track.album.id,
        name: track.album.name,
        images: track.album.images.map(img => ({
          url: img.url,
          height: img.height || 0,
          width: img.width || 0
        })),
        artists: track.album.artists.map(a => a.name).join(', '),
        releaseDate: track.album.release_date,
        label: album.label || 'Unknown Label',
        spotifyUrl: track.album.external_urls.spotify
      };

      // Convert track
      const spotifyTrack = {
        id: track.id,
        trackTitle: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        albumCover, // Will never be undefined now
        recordLabel: album.label || 'Unknown Label',
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls.spotify,
        album: spotifyAlbum,
        releaseDate: track.album.release_date
      };

      // Debug log
      console.log('Converted Spotify track:', spotifyTrack);

      return spotifyTrack;
    } catch (error) {
      console.error('Error converting track:', error);
      throw error;
    }
  }

  async getTrackDetailsByUrl(trackUrl: string): Promise<SpotifyTrack | null> {
    try {
      const trackId = this.extractTrackId(trackUrl);
      if (!trackId) {
        throw new Error('Invalid Spotify URL');
      }

      const trackResponse = await this.spotifyApi.getTrack(trackId);
      if (!trackResponse || !trackResponse.body) {
        throw new Error('Track not found');
      }

      const track = trackResponse.body;

      // Get album details to get the release date
      const albumResponse = await this.spotifyApi.getAlbum(track.album.id);
      if (!albumResponse || !albumResponse.body) {
        throw new Error('Album not found');
      }
      const album = albumResponse.body;

      return {
        id: track.id,
        trackTitle: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        spotifyUrl: track.external_urls.spotify,
        albumCover: track.album.images[0]?.url || 'https://via.placeholder.com/300',
        recordLabel: album.label || 'Unknown Label',
        releaseDate: album.release_date || new Date().toISOString().split('T')[0],
        previewUrl: track.preview_url,
        album: {
          id: album.id,
          name: album.name,
          images: album.images.map(img => ({
            url: img.url,
            height: img.height || 0,
            width: img.width || 0
          })),
          artists: album.artists.map(artist => artist.name).join(', '),
          releaseDate: album.release_date,
          label: album.label || 'Unknown Label',
          spotifyUrl: album.external_urls.spotify
        }
      };
    } catch (error) {
      console.error('Error getting track details:', error);
      return null;
    }
  }

  private extractTrackId(trackUrl: string): string | null {
    if (!trackUrl) return null;
    
    try {
      // Extract the ID between track/ and ? or end of string
      const match = trackUrl.match(/track\/([a-zA-Z0-9]+)(?:\?|$)/);
      if (match) return match[1];
      
      // Handle Spotify URIs
      const uriMatch = trackUrl.match(/^spotify:track:([a-zA-Z0-9]+)$/);
      if (uriMatch) return uriMatch[1];
      
      // Handle direct IDs (22 characters)
      if (/^[a-zA-Z0-9]{22}$/.test(trackUrl)) {
        return trackUrl;
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting track ID:', error);
      return null;
    }
  }

  async getSimplifiedTrackDetails(trackUrl: string): Promise<SimplifiedTrackOutput> {
    try {
      const track = await this.getTrackDetailsByUrl(trackUrl);
      if (!track) {
        throw new Error('Track not found');
      }

      return {
        trackTitle: track.trackTitle,
        artistName: track.artist,
        recordLabel: track.recordLabel || 'Unknown Label',
        artwork: track.albumCover
      };
    } catch (error) {
      console.error('Error getting simplified track details:', error);
      throw error;
    }
  }

  public async searchTracks(query: string): Promise<SpotifyTrack[]> {
    try {
      await this.ensureValidToken();
      console.log('Searching tracks for query:', query);
      const response = await this.spotifyApi.searchTracks(query);
      const tracks = response.body.tracks?.items || [];
      console.log('Got search tracks response:', tracks);
      
      const apiTracks = tracks.map(track => this.convertToSpotifyApiTrack(track));
      return Promise.all(apiTracks.map(track => this.convertTrackToSpotifyTrack(track)));
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  public async getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
    try {
      await this.ensureValidToken();
      console.log('Fetching playlist:', playlistId);
      const response = await this.spotifyApi.getPlaylist(playlistId);
      console.log('Got playlist response:', response.body);
      return this.convertToSpotifyApiPlaylist(response.body);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      throw error;
    }
  }

  public async getLabelReleases(playlistId: string): Promise<SpotifyTrack[]> {
    try {
      await this.ensureValidToken();
      console.log('Fetching label releases for playlist:', playlistId);
      const playlist = await this.getPlaylist(playlistId);
      
      return Promise.all(
        playlist.tracks.items
          .map(item => this.convertTrackToSpotifyTrack(item.track))
      );
    } catch (error) {
      console.error('Error fetching label releases:', error);
      throw error;
    }
  }

  public async getArtistDetails(artistName: string): Promise<{ id: string; name: string; images: SpotifyImage[] } | null> {
    try {
      await this.ensureValidToken();
      
      // Add delay to prevent rate limiting
      await this.delay(1000);
      
      // Search for the artist
      const searchResponse = await this.spotifyApi.searchArtists(artistName, { limit: 1 });
      
      if (!searchResponse?.body?.artists?.items?.length) {
        console.log(`No artist found for name: ${artistName}`);
        return null;
      }

      const artist = searchResponse.body.artists.items[0];
      return {
        id: artist.id,
        name: artist.name,
        images: this.convertImages(artist.images || [])
      };
    } catch (error: any) {
      if (error?.response?.statusCode === 429) {
        console.log('Rate limit hit, waiting before retry...');
        await this.delay(2000);
        return this.getArtistDetails(artistName);
      }
      
      console.error('Error fetching artist details:', error?.message || 'Unknown error');
      return null;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async searchTracksByLabel(labelName: string): Promise<SpotifyTrack[]> {
    console.log('Starting searchTracksByLabel for label:', labelName);
    await this.ensureValidToken();
    
    if (!labelName.trim()) {
      throw new Error('Please enter a valid label name');
    }

    // Search for albums by label with exact match using quotes
    const query = `label:"${labelName.trim()}"`;
    console.log('Querying Spotify with:', query);
    let searchResponse;
    try {
      searchResponse = await this.spotifyApi.searchAlbums(query, { limit: 50 });
      console.log('Search response:', searchResponse);
      if (!searchResponse || !searchResponse.body || !searchResponse.body.albums) {
        throw new Error('Invalid response from Spotify');
      }
    } catch (error) {
      console.error('Error searching for albums:', error);
      if (error instanceof Error) {
        if (error.message.includes('No search query')) {
          throw new Error('Please enter a valid label name');
        } else if (error.message.includes('Invalid response')) {
          throw new Error('Unable to connect to Spotify. Please try again.');
        }
      }
      throw new Error('Failed to search for albums. Please try again.');
    }

    const albums = searchResponse.body.albums.items || [];
    const totalAlbums = albums.length;
    console.log(`Found ${totalAlbums} albums for label: ${labelName}`);

    if (albums.length === 0) {
      throw new Error(`No albums found for label: "${labelName}". Please check the label name and try again.`);
    }

    // Process albums in smaller batches
    const batchSize = 5;
    const allTracks: SpotifyTrack[] = [];
    
    for (let i = 0; i < albums.length; i += batchSize) {
      const albumBatch = albums.slice(i, i + batchSize);
      console.log(`Processing albums ${i + 1} to ${Math.min(i + batchSize, albums.length)} of ${albums.length}`);
      
      const batchTracksPromises = albumBatch.map(async (album) => {
        try {
          await this.delay(1000); // Wait 1 second between album requests
          const tracksResponse = await this.spotifyApi.getAlbumTracks(album.id, { limit: 50 });
          if (!tracksResponse || !tracksResponse.body || !tracksResponse.body.items) {
            console.error(`Invalid response for album ${album.id}`);
            return [];
          }

          const tracks = tracksResponse.body.items;
          console.log(`Found ${tracks.length} tracks in album ${album.name}`);
          
          // Process tracks in smaller batches
          const trackBatchSize = 5;
          const albumTracks: SpotifyTrack[] = [];
          
          for (let j = 0; j < tracks.length; j += trackBatchSize) {
            const trackBatch = tracks.slice(j, j + trackBatchSize);
            await this.delay(1000); // Wait 1 second between track batch requests
            
            const trackDetailsPromises = trackBatch.map(async (track) => {
              try {
                const trackResponse = await this.spotifyApi.getTrack(track.id);
                if (!trackResponse || !trackResponse.body) {
                  console.error(`Invalid response for track ${track.id}`);
                  return null;
                }

                const trackData = trackResponse.body;
                return {
                  id: trackData.id,
                  trackTitle: trackData.name,
                  artist: trackData.artists.map(artist => artist.name).join(', '),
                  spotifyUrl: trackData.external_urls.spotify,
                  albumCover: trackData.album.images[0]?.url || 'https://via.placeholder.com/300',
                  releaseDate: trackData.album.release_date,
                  recordLabel: labelName
                };
              } catch (error) {
                console.error(`Error fetching details for track ${track.id}:`, error);
                // Wait longer if we hit rate limits
                if (error instanceof Error && error.message.includes('rate limit')) {
                  await this.delay(5000);
                }
                return null;
              }
            });

            const batchResults = await Promise.all(trackDetailsPromises);
            albumTracks.push(...batchResults.filter((track): track is SpotifyTrack => track !== null));
          }
          
          return albumTracks;
        } catch (error) {
          console.error(`Error fetching tracks for album ${album.id}:`, error);
          // Wait longer if we hit rate limits
          if (error instanceof Error && error.message.includes('rate limit')) {
            await this.delay(5000);
          }
          return [];
        }
      });

      const batchResults = await Promise.all(batchTracksPromises);
      allTracks.push(...batchResults.flat());
      
      // Wait between album batches
      if (i + batchSize < albums.length) {
        await this.delay(2000);
      }
    }

    if (allTracks.length === 0) {
      throw new Error(`No tracks found for label: "${labelName}". Please check the label name and try again.`);
    }
    
    // Sort by release date, newest first
    allTracks.sort((a, b) => {
      const dateA = new Date(a.releaseDate || '');
      const dateB = new Date(b.releaseDate || '');
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log(`Found ${allTracks.length} total tracks for label: ${labelName} across ${totalAlbums} albums`);
    return allTracks;
  }

  public async importLabelTracks(
    labelName: string,
    batchSize = 50,
    onProgress?: (imported: number, total: number) => void
  ): Promise<void> {
    console.log('Starting importLabelTracks for label:', labelName);
    try {
      const tracks = await this.searchTracksByLabel(labelName);
      console.log('Tracks found:', tracks);
      
      // Normalize labels for case-insensitive comparison
      const normalizedLabelName = labelName.toLowerCase();
      const filteredTracks = tracks.filter(track => track.recordLabel.toLowerCase() === normalizedLabelName);
      console.log('Filtered tracks:', filteredTracks);

      // Get existing tracks from localStorage
      const existingTracks = JSON.parse(localStorage.getItem('tracks') || '[]');
      console.log('Existing tracks:', existingTracks);
      
      // Filter out duplicates
      const existingUrls = new Set(existingTracks.map((track: any) => track.spotifyUrl));
      const newTracks = filteredTracks.filter(track => !existingUrls.has(track.spotifyUrl));
      console.log('New tracks to import:', newTracks);

      if (newTracks.length === 0) {
        throw new Error('No new tracks found. All tracks from this label are already imported.');
      }

      // Sort tracks by release date (newest first)
      newTracks.sort((a, b) => {
        const dateA = new Date(a.releaseDate || '');
        const dateB = new Date(b.releaseDate || '');
        return dateB.getTime() - dateA.getTime();
      });

      // Process tracks in batches
      const totalBatches = Math.ceil(newTracks.length / batchSize);
      let importedCount = 0;

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, newTracks.length);
        const batch = newTracks.slice(start, end);

        // Get current tracks from localStorage
        const currentTracks = JSON.parse(localStorage.getItem('tracks') || '[]');
        
        // Sort all tracks by release date (newest first)
        const updatedTracks = [...currentTracks, ...batch].sort((a, b) => {
          const dateA = new Date(a.releaseDate || '');
          const dateB = new Date(b.releaseDate || '');
          return dateB.getTime() - dateA.getTime();
        });

        localStorage.setItem('tracks', JSON.stringify(updatedTracks));
        
        importedCount += batch.length;
        
        // Report progress
        if (onProgress) {
          onProgress(importedCount, newTracks.length);
        }

        // Wait 3 seconds before processing next batch
        if (i < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      console.log(`Imported ${newTracks.length} new tracks for label: ${labelName}`);
    } catch (error) {
      console.error('Error importing label tracks:', error);
      throw error instanceof Error ? error : new Error('An unexpected error occurred while importing tracks');
    }
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.tokenExpirationTime;
  }

  public getLoginUrl(): string {
    const scopes = ['user-read-private', 'playlist-read-private'];
    return this.spotifyApi.createAuthorizeURL(scopes, 'state');
  }

  public handleRedirect(hash: string): boolean {
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    if (accessToken) {
      this.accessToken = accessToken;
      this.spotifyApi.setAccessToken(accessToken);
      this.tokenExpirationTime = Date.now() + 3600 * 1000; // 1 hour
      return true;
    }
    return false;
  }

  public logout(): void {
    this.accessToken = null;
    this.tokenExpirationTime = 0;
    this.spotifyApi.setAccessToken('');
  }
}

export const spotifyService = SpotifyService.getInstance();
