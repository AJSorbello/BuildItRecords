import { SpotifyApi, Track as SpotifyTrackSDK, Artist as SpotifyArtist, SearchResults } from '@spotify/web-api-ts-sdk';
import { Track, SpotifyImage, SpotifyApiTrack, SpotifyPlaylist, Album } from '../types/track';
import { RecordLabel, RECORD_LABELS, LABEL_URLS } from '../constants/labels';

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

  async getTrackMetrics(trackId: string): Promise<{ popularity: number; streams: number }> {
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
        popularity: track.popularity || 0,
        streams: Math.floor(Math.random() * 1000000) // Simulated stream count since Spotify API doesn't provide it
      };
    } catch (error) {
      console.error('Error getting track metrics:', error);
      return { popularity: 0, streams: 0 };
    }
  }

  private async convertSpotifyTrackToTrack(track: SpotifyTrackSDK, label: RecordLabel): Promise<Track> {
    try {
      // Get track metrics
      const metrics = await this.getTrackMetrics(track.id);

      // Get track popularity
      const popularity = await this.getTrackPopularity(track.id);

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
        artist: track.artists.map(artist => artist.name).join(', '),
        recordLabel: label,
        spotifyUrl: track.external_urls.spotify,
        albumCover: track.album.images[0]?.url || '',
        album: album,
        releaseDate: track.album.release_date,
        previewUrl: track.preview_url,
        beatportUrl: '',
        soundcloudUrl: '',
        popularity: metrics.popularity,
        streams: metrics.streams,
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
        artist: track.artists.map(artist => artist.name).join(', '),
        recordLabel: label,
        spotifyUrl: track.external_urls.spotify,
        albumCover: track.album.images[0]?.url || '',
        album: album,
        releaseDate: track.album.release_date,
        previewUrl: track.preview_url,
        beatportUrl: '',
        soundcloudUrl: '',
      };
    }
  }

  private extractTrackId(trackUrl: string): string | null {
    const match = trackUrl.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  private extractPlaylistId(playlistUrl: string): string | null {
    const match = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  async getTrackDetailsByUrl(trackUrl: string): Promise<Track | null> {
    try {
      console.log('Processing track URL:', trackUrl);
      const trackId = this.extractTrackId(trackUrl);
      if (!trackId) {
        console.error('Failed to extract track ID from URL:', trackUrl);
        throw new Error('Invalid Spotify URL');
      }
      console.log('Extracted track ID:', trackId);

      await this.ensureValidToken();
      console.log('Token validated, fetching track details...');
      const track = await this.spotifyApi.tracks.get(trackId);
      console.log('Track details fetched:', track.name);
      
      const label = await this.determineLabelFromUrl(trackUrl);
      console.log('Determined label:', label);
      
      return this.convertSpotifyTrackToTrack(track, label);
    } catch (error) {
      console.error('Error getting track details by URL:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      return null;
    }
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

      // Commented out playlist checking until proper playlists are configured
      /*
      for (const [label, playlistUrl] of Object.entries(LABEL_URLS)) {
        console.log('Checking playlist for label:', label);
        const playlistId = this.extractPlaylistId(playlistUrl);
        if (!playlistId) {
          console.log('No playlist ID found for label:', label);
          continue;
        }

        const playlist = await this.getPlaylist(playlistId);
        if (!playlist) {
          console.log('Could not fetch playlist for label:', label);
          continue;
        }

        const trackInPlaylist = playlist.tracks.items.some(item => item.track.id === trackId);
        if (trackInPlaylist) {
          console.log('Track found in playlist for label:', label);
          return label as RecordLabel;
        }
      }
      */
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

  async getLabelReleases(labelName: string): Promise<Track[]> {
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
      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch track popularity');
      }
      
      const track = await response.json();
      return track.popularity || 0;
    } catch (error) {
      console.error('Error getting track popularity:', error);
      return 0;
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
}

export const spotifyService = SpotifyService.getInstance();
