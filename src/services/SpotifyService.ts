import { SpotifyApi, Track as SpotifyTrackSDK, Artist as SpotifyArtist, SearchResults } from '@spotify/web-api-ts-sdk';
import { Track, SpotifyImage, SpotifyApiTrack, SpotifyPlaylist, Album } from '../types/track';
import { RecordLabel, RECORD_LABELS, LABEL_URLS } from '../constants/labels';
import { redisService } from './RedisService';

/**
 * Service for interacting with the Spotify Web API
 */
export class SpotifyService {
  private spotifyApi: SpotifyApi;
  private static instance: SpotifyService;
  private accessToken: string | null = null;
  private tokenExpiration = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private rateLimitWindow = 0;
  private requestCount = 0;
  private readonly MAX_REQUESTS_PER_WINDOW = 100;
  private readonly RATE_LIMIT_WINDOW_MS = 30000; // 30 seconds

  private constructor() {
    this.spotifyApi = SpotifyApi.withClientCredentials(
      process.env.REACT_APP_SPOTIFY_CLIENT_ID || '',
      process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || ''
    );
    this.initializeRateLimitWindow();
  }

  private initializeRateLimitWindow() {
    this.rateLimitWindow = Date.now();
    this.requestCount = 0;
    
    // Reset window periodically
    setInterval(() => {
      this.rateLimitWindow = Date.now();
      this.requestCount = 0;
    }, this.RATE_LIMIT_WINDOW_MS);
  }

  private async executeWithRateLimit<T>(
    key: string,
    operation: () => Promise<T>,
    cacheDuration: number = 24 * 60 * 60 * 1000 // 24 hours
  ): Promise<T> {
    // Check Redis cache first
    const isArtistKey = key.startsWith('artist:');
    const cached = isArtistKey 
      ? await redisService.getArtistDetails(key.replace('artist:', ''))
      : await redisService.getTracksForLabel(key as RecordLabel);
      
    if (cached) {
      return cached as T;
    }

    // If not in cache, execute operation
    const result = await this.addToQueue(operation);

    // Cache the result
    if (isArtistKey) {
      await redisService.setArtistDetails(key.replace('artist:', ''), result);
    } else {
      await redisService.setTracksForLabel(key as RecordLabel, result as Track[]);
    }

    return result;
  }

  private async addToQueue(operation: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          // Check if we need to wait for rate limit
          const now = Date.now();
          if (this.requestCount >= this.MAX_REQUESTS_PER_WINDOW) {
            const timeToWait = this.RATE_LIMIT_WINDOW_MS - (now - this.rateLimitWindow);
            if (timeToWait > 0) {
              await new Promise(resolve => setTimeout(resolve, timeToWait));
              this.rateLimitWindow = Date.now();
              this.requestCount = 0;
            }
          }

          // Execute operation
          const result = await operation();
          this.requestCount++;

          resolve(result);
        } catch (error) {
          if (error instanceof Error && error.message.includes('rate limit')) {
            // Retry after delay if rate limited
            setTimeout(() => task(), this.RATE_LIMIT_WINDOW_MS);
          } else {
            reject(error);
          }
        }
      };

      this.requestQueue.push(task);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const task = this.requestQueue.shift();
      if (task) {
        try {
          await task();
        } catch (error) {
          console.error('Error processing queue task:', error);
        }
        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    this.isProcessingQueue = false;
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  private async ensureValidToken(): Promise<void> {
    const now = Date.now();
    if (!this.accessToken || now >= this.tokenExpiration) {
      await this.spotifyApi.authenticate();
      const token = await this.spotifyApi.getAccessToken();
      if (!token) {
        throw new Error('Failed to get access token');
      }
      this.accessToken = token.access_token;
      this.tokenExpiration = now + 3600000; // 1 hour
    }
  }

  async getTrackMetrics(trackId: string): Promise<{ popularity: number }> {
    try {
      await this.ensureValidToken();
      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch track details');
      }
      
      const track = await response.json();
      
      return {
        popularity: track.popularity || 0
      };
    } catch (error) {
      console.error('Error getting track metrics:', error);
      return { popularity: 0 };
    }
  }

  private async convertSpotifyTrackToTrack(track: SpotifyTrackSDK, label: RecordLabel): Promise<Track> {
    try {
      // Get track metrics
      const metrics = await this.getTrackMetrics(track.id);

      // Create album object
      const album: Album = {
        name: track.album.name,
        releaseDate: track.album.release_date,
        images: track.album.images.map(img => ({
          url: img.url,
          height: img.height ?? 0,
          width: img.width ?? 0
        }))
      };

      return {
        id: track.id,
        trackTitle: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        recordLabel: label,
        spotifyUrl: track.external_urls.spotify,
        albumCover: track.album.images[0]?.url || '',
        album: album,
        releaseDate: track.album.release_date,
        previewUrl: track.preview_url,
        beatportUrl: '',
        soundcloudUrl: '',
        popularity: metrics.popularity
      };
    } catch (error) {
      console.error('Error converting track:', error);
      // Create album object for error case
      const album: Album = {
        name: track.album.name,
        releaseDate: track.album.release_date,
        images: track.album.images.map(img => ({
          url: img.url,
          height: img.height ?? 0,
          width: img.width ?? 0
        }))
      };

      return {
        id: track.id,
        trackTitle: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        recordLabel: label,
        spotifyUrl: track.external_urls.spotify,
        albumCover: track.album.images[0]?.url || '',
        album: album,
        releaseDate: track.album.release_date,
        previewUrl: track.preview_url,
        beatportUrl: '',
        soundcloudUrl: ''
      };
    }
  }

  private extractTrackId(trackUrl: string): string | null {
    if (!trackUrl) return null;
    
    try {
      const url = new URL(trackUrl);
      const pathParts = url.pathname.split('/');
      const trackIndex = pathParts.indexOf('track');
      if (trackIndex !== -1 && trackIndex + 1 < pathParts.length) {
        return pathParts[trackIndex + 1];
      }
    } catch (error) {
      console.error('Error extracting track ID:', error);
    }
    return null;
  }

  private extractPlaylistId(playlistUrl: string): string | null {
    if (!playlistUrl) return null;
    
    try {
      const url = new URL(playlistUrl);
      const pathParts = url.pathname.split('/');
      const playlistIndex = pathParts.indexOf('playlist');
      if (playlistIndex !== -1 && playlistIndex + 1 < pathParts.length) {
        return pathParts[playlistIndex + 1];
      }
    } catch (error) {
      console.error('Error extracting playlist ID:', error);
    }
    return null;
  }

  async getTrackDetailsByUrl(trackUrl: string): Promise<Track | null> {
    const cacheKey = `track:${trackUrl}`;
    
    return this.executeWithRateLimit(cacheKey, async () => {
      const trackId = this.extractTrackId(trackUrl);
      if (!trackId) {
        console.error('Could not extract track ID from URL:', trackUrl);
        return null;
      }

      try {
        await this.ensureValidToken();
        const track = await this.spotifyApi.tracks.get(trackId);
        const label = await this.determineLabelFromUrl(trackUrl);
        
        return this.convertSpotifyTrackToTrack(track, label);
      } catch (error) {
        console.error('Error getting track details:', error);
        return null;
      }
    });
  }

  async searchTracks(query: string): Promise<Track[]> {
    try {
      await this.ensureValidToken();
      const results = await this.spotifyApi.search(query, ['track']);
      const tracks = await Promise.all(
        results.tracks.items.map(async (track: SpotifyTrackSDK) => {
          const label = await this.determineLabelFromUrl(track.external_urls.spotify);
          return this.convertSpotifyTrackToTrack(track, label);
        })
      );
      return tracks;
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  }

  async searchTracksByLabel(labelName: string): Promise<Track[]> {
    try {
      await this.ensureValidToken();
      const searchResults = await this.spotifyApi.search(`label:${labelName}`, ['track']);
      const tracks = await Promise.all(
        searchResults.tracks.items.map(async (track: SpotifyTrackSDK) => {
          const label = await this.determineLabelFromUrl(track.external_urls.spotify);
          return this.convertSpotifyTrackToTrack(track, label);
        })
      );
      return tracks;
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
      const allTracks: Track[] = [];
      let offset = 0;
      let hasMore = true;
      const limit = 50;

      // Only use exact label search
      const query = `label:"${label}"`;
      console.log('Using search query:', query);

      // First search to get total count
      const initialSearch = await this.spotifyApi.search(
        query,
        ['track'],
        undefined,
        1,
        0
      );

      const totalTracks = initialSearch.tracks.total;
      console.log(`Found ${totalTracks} total tracks for label "${label}"`);

      while (hasMore) {
        try {
          console.log(`Searching with offset: ${offset}`);
          const results = await this.spotifyApi.search(
            query,
            ['track'],
            undefined,
            limit,
            offset
          );

          console.log(`Found ${results.tracks.items.length} tracks`);

          if (results.tracks.items.length > 0) {
            const tracks = await Promise.all(
              results.tracks.items.map(async (track: SpotifyTrackSDK) => {
                try {
                  // Check if track already exists in allTracks
                  const exists = allTracks.some(t => t.id === track.id);
                  if (!exists) {
                    return this.convertSpotifyTrackToTrack(track, label);
                  }
                  return null;
                } catch (error) {
                  console.error('Error converting track:', error);
                  return null;
                }
              })
            );

            const validTracks = tracks.filter((track): track is Track => 
              track !== null && 
              !allTracks.some(t => t.id === track.id)
            );
            
            if (validTracks.length > 0) {
              allTracks.push(...validTracks);
              console.log(`Added ${validTracks.length} new tracks. Total: ${allTracks.length}`);
              
              if (onProgress) {
                onProgress(allTracks.length, totalTracks);
              }
            }
          }

          // Stop if we've reached the total or no more tracks
          hasMore = results.tracks.items.length > 0 && offset < totalTracks;
          offset += limit;

          console.log(`Progress: ${allTracks.length}/${totalTracks} tracks imported`);

          // Add a small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error('Error during search:', error);
          hasMore = false;
        }
      }

      // Remove duplicates before returning
      const uniqueTracks = Array.from(
        new Map(allTracks.map(track => [track.id, track])).values()
      );

      console.log(`Found ${uniqueTracks.length} unique tracks for label ${label}`);
      return uniqueTracks;
    } catch (error) {
      console.error('Error importing label tracks:', error);
      return [];
    }
  }

  async getTracksByLabel(label: RecordLabel): Promise<Track[]> {
    const cacheKey = label;
    return this.executeWithRateLimit<Track[]>(cacheKey, async () => {
      await this.ensureValidToken();
      
      try {
        const playlistUrl = LABEL_URLS[label];
        if (!playlistUrl) {
          console.error(`No playlist URL found for label: ${label}`);
          return [];
        }

        const playlistId = this.extractPlaylistId(playlistUrl);
        if (!playlistId) {
          console.error(`Could not extract playlist ID from URL: ${playlistUrl}`);
          return [];
        }

        const playlist = await this.spotifyApi.playlists.getPlaylist(playlistId);
        if (!playlist || !playlist.tracks.items) {
          return [];
        }

        // Filter out episodes and map only tracks
        const trackPromises = playlist.tracks.items
          .filter(item => item.track && 'album' in item.track) // Only include tracks, not episodes
          .map(item => this.convertSpotifyTrackToTrack(item.track as SpotifyTrackSDK, label));

        const tracks = await Promise.all(trackPromises);
        return tracks;
      } catch (error) {
        console.error('Error fetching tracks by label:', error);
        return [];
      }
    });
  }

  private async determineLabelFromUrl(spotifyUrl: string): Promise<RecordLabel> {
    console.log('Determining label for URL:', spotifyUrl);
    const trackId = this.extractTrackId(spotifyUrl);
    if (!trackId) {
      console.log('No track ID found, defaulting to Build It Records');
      return RECORD_LABELS.RECORDS;
    }

    try {
      // For now, let's default to Build It Records since we need to set up proper playlists
      console.log('Defaulting to Build It Records until playlists are properly configured');
      return RECORD_LABELS.RECORDS;
    } catch (error) {
      console.error('Error in determineLabelFromUrl:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    }

    console.log('No matching label found, defaulting to Build It Records');
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
        artist: track.artists[0]?.name || 'Unknown Artist',
        albumCover: track.album.images[0]?.url || '',
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls.spotify
      };
    } catch (error) {
      console.error('Error getting simplified track details:', error);
      return null;
    }
  }

  async getLabelReleases(labelName: string): Promise<Track[]> {
    try {
      await this.ensureValidToken();
      
      // Get the playlist ID for the given label
      const playlistUrl = LABEL_URLS[labelName as keyof typeof LABEL_URLS];
      if (!playlistUrl) {
        console.error('No playlist URL found for label:', labelName);
        return [];
      }

      const playlistId = this.extractPlaylistId(playlistUrl);
      if (!playlistId) {
        console.error('Could not extract playlist ID from URL:', playlistUrl);
        return [];
      }

      // Fetch the playlist tracks
      const playlist = await this.spotifyApi.playlists.getPlaylist(playlistId);
      if (!playlist || !playlist.tracks.items) {
        console.error('Could not fetch playlist or no tracks found');
        return [];
      }

      // Convert playlist tracks to our Track type
      const trackPromises = playlist.tracks.items
        .filter(item => item.track && 'album' in item.track) // Filter out episodes and null tracks
        .map(item => this.convertSpotifyTrackToTrack(item.track as SpotifyTrackSDK, labelName as RecordLabel));

      const tracks = await Promise.all(trackPromises);
      return tracks;
    } catch (error) {
      console.error('Error getting label releases:', error);
      return [];
    }
  }

  /**
   * Get an artist's releases from Spotify
   * @param artistId The Spotify artist ID
   * @returns Array of releases (albums, singles, etc.)
   */
  public async getArtistReleases(artistId: string) {
    await this.ensureValidToken();
    const response = await this.spotifyApi.artists.albums(
      artistId,
      'album,single,compilation'
    );
    return (response.items || []).map(album => ({
      id: album.id,
      name: album.name,
      type: album.album_type,
      release_date: album.release_date,
      images: album.images,
      artists: album.artists.map(artist => ({
        id: artist.id,
        name: artist.name
      }))
    }));
  }

  async getTrackPopularity(trackId: string): Promise<number> {
    try {
      await this.ensureValidToken();
      const track = await this.spotifyApi.tracks.get(trackId);
      return track.popularity;
    } catch (error) {
      console.error('Error getting track popularity:', error);
      return 0;
    }
  }

  async getArtistDetailsByName(artistName: string, trackTitle?: string): Promise<SpotifyArtist | null> {
    const cacheKey = `artist:${artistName}:${trackTitle || ''}`;
    
    return this.executeWithRateLimit<SpotifyArtist | null>(cacheKey, async () => {
      await this.ensureValidToken();
      
      try {
        // First try with exact track and artist match
        if (trackTitle) {
          const trackSearchQuery = `track:"${trackTitle}" artist:"${artistName}"`;
          console.log('Searching with track query:', trackSearchQuery);
          const trackResults = await this.spotifyApi.search(trackSearchQuery, ['track']);
          
          if (trackResults.tracks.items.length > 0) {
            // Find exact matches first
            const exactMatch = trackResults.tracks.items.find(track => 
              track.artists.some(artist => 
                artist.name.toLowerCase() === artistName.toLowerCase()
              )
            );

            if (exactMatch) {
              const matchingArtist = exactMatch.artists.find(
                artist => artist.name.toLowerCase() === artistName.toLowerCase()
              );

              if (matchingArtist) {
                console.log('Found exact artist match from track:', matchingArtist.name);
                return this.getArtistDetails(matchingArtist.id);
              }
            }

            // If no exact match, try the first artist that's close enough
            const closeMatch = trackResults.tracks.items[0].artists[0];
            if (closeMatch) {
              console.log('Found close artist match:', closeMatch.name);
              return this.getArtistDetails(closeMatch.id);
            }
          }
        }

        // Try artist-specific search with multiple strategies
        const searchStrategies = [
          `artist:"${artistName}"`,
          `artist:"${artistName}" genre:electronic`,
          `artist:"${artistName}" genre:house`,
          `artist:"${artistName}" genre:techno`,
          artistName // fallback to simple search
        ];

        for (const searchQuery of searchStrategies) {
          console.log('Trying artist search query:', searchQuery);
          const results = await this.spotifyApi.search(searchQuery, ['artist']);
          
          if (results.artists.items.length > 0) {
            // Try exact match first
            const exactMatch = results.artists.items.find(
              a => a.name.toLowerCase() === artistName.toLowerCase()
            );

            if (exactMatch) {
              console.log('Found exact artist match:', exactMatch.name);
              return this.getArtistDetails(exactMatch.id);
            }

            // If no exact match, try fuzzy matching
            const closeMatch = results.artists.items[0];
            const artistNameNormalized = artistName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const closeMatchNameNormalized = closeMatch.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            if (closeMatchNameNormalized.includes(artistNameNormalized) || 
                artistNameNormalized.includes(closeMatchNameNormalized)) {
              console.log('Found fuzzy match:', closeMatch.name);
              return this.getArtistDetails(closeMatch.id);
            }
          }
        }

        // Try searching by track title as artist name (some artists name tracks after themselves)
        if (trackTitle) {
          const artistAsTrackQuery = `artist:"${trackTitle}"`;
          const results = await this.spotifyApi.search(artistAsTrackQuery, ['artist']);
          
          if (results.artists.items.length > 0) {
            const bestMatch = results.artists.items[0];
            if (bestMatch) {
              console.log('Found artist through track title search:', bestMatch.name);
              return this.getArtistDetails(bestMatch.id);
            }
          }
        }

        console.log('No artist found for:', artistName);
        return null;
      } catch (error) {
        console.error('Error searching for artist:', error);
        return null;
      }
    });
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

  async searchArtist(query: string): Promise<SpotifyArtist | null> {
    const cacheKey = `artist:${query}`;
    return this.executeWithRateLimit<SpotifyArtist | null>(cacheKey, async () => {
      const searchResults = await this.spotifyApi.search(query, ['artist']);
      const artists = searchResults.artists.items;
      if (artists && artists.length > 0) {
        return artists[0];
      }
      return null;
    });
  }

  // Remove unused cache-related code
  private cleanCache() {
    // This functionality is now handled by Redis TTL
  }

  // Public method to clear cache if needed
  public clearCache() {
    return redisService.clearCache();
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

  // Add cache warming method
  async warmupCache(labels: RecordLabel[]): Promise<void> {
    console.log('Starting cache warmup for labels:', labels);
    
    const warmupPromises = labels.map(async (label) => {
      try {
        const tracks = await this.getTracksByLabel(label);
        console.log(`Cached ${tracks.length} tracks for label: ${label}`);
      } catch (error) {
        console.error(`Failed to warmup cache for label ${label}:`, error);
      }
    });

    await Promise.all(warmupPromises);
    console.log('Cache warmup completed');
  }

}

export const spotifyService = SpotifyService.getInstance();
