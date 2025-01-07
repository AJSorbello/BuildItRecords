import axios, { AxiosRequestConfig } from 'axios';
import { Track } from '../types/track';
import type { Release } from '../types/release';
import { Artist } from '../types/artist';
import { RecordLabel } from '../constants/labels';
import { createRelease } from '../types/release';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface Label {
  id: string;
  name: string;
  description?: string;
  website?: string;
}

interface PaginatedResponse<T> {
  releases: T[];
  totalReleases: number;
  currentPage: number;
  totalPages: number;
}

class DatabaseService {
  private static instance: DatabaseService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = `${API_BASE_URL}`;
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async request<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
    try {
      const url = `${this.baseUrl}/api${endpoint}`;
      console.log('Making request to:', url);
      
      const response = await axios({
        url,
        ...options,
      });
      console.log('Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  // Labels
  public async getLabels(): Promise<Label[]> {
    return this.request<Label[]>('/labels');
  }

  // Artists
  public async getArtists(params: { 
    search?: string;
    label?: 'records' | 'tech' | 'deep';
  } = {}): Promise<Artist[]> {
    console.log('Getting artists with params:', params);
    const endpoint = '/artists/search';
    console.log('Making request to endpoint:', endpoint);
    try {
      const queryParams = new URLSearchParams();
      
      // Add search param if it exists
      if (params.search?.trim()) {
        queryParams.append('search', params.search.trim());
      }

      // Add label param if it exists
      if (params.label) {
        queryParams.append('label', params.label);
      }

      const url = `${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('Making request to endpoint:', url);
      
      const response = await this.request<Artist[]>(url);
      console.log('Raw artist response:', response);
      console.log('Sample artist data:', response[0]);
      return response;
    } catch (error) {
      console.error('Error getting artists:', error);
      throw error;
    }
  }

  public async getArtistById(id: string): Promise<Artist & { releases: Release[] }> {
    try {
      console.log('Getting artist by ID:', id);
      
      // Get artist data
      const artist = await this.request<Artist>(`/artists/${id}`);
      console.log('Raw artist data:', {
        id: artist.id,
        name: artist.name,
        hasProfileImage: !!artist.profile_image,
        hasImages: !!artist.images?.length
      });

      // Transform artist data
      const transformedArtist = {
        ...artist,
        id: artist.id || artist.spotify_id,
        profile_image: artist.profile_image || artist.images?.[0]?.url,
        images: artist.images || [],
        genres: artist.genres || []
      };

      // Get all releases that feature this artist
      const releases = await this.getReleasesByArtistId(id);
      console.log('Found releases for artist:', releases.length);

      // Transform releases to ensure consistent data
      const transformedReleases = releases.map(release => {
        // Transform release artists
        const releaseArtists = release.artists?.map(artist => ({
          ...artist,
          id: artist.id || artist.spotify_id,
          profile_image: artist.profile_image || artist.images?.[0]?.url,
          images: artist.images || [],
          genres: artist.genres || []
        })) || [];

        // Transform tracks and their artists
        const transformedTracks = release.tracks?.map(track => {
          const trackArtists = track.artists?.map(artist => ({
            ...artist,
            id: artist.id || artist.spotify_id,
            profile_image: artist.profile_image || artist.images?.[0]?.url,
            images: artist.images || [],
            genres: artist.genres || []
          })) || releaseArtists;

          return {
            ...track,
            duration_ms: track.duration_ms || track.duration || 0,
            artists: trackArtists.filter(artist => artist.name !== 'Various Artists')
          };
        });

        return {
          ...release,
          artists: releaseArtists.filter(artist => artist.name !== 'Various Artists'),
          tracks: transformedTracks,
          artwork_url: release.artwork_url || release.album?.artwork_url || release.tracks?.[0]?.artwork_url,
          images: release.album?.images || []
        };
      });

      return {
        ...transformedArtist,
        releases: transformedReleases
      };
    } catch (error) {
      console.error('Error getting artist by ID:', id, error);
      throw error;
    }
  }

  public async getArtistsForLabel(labelId: string): Promise<Artist[]> {
    try {
      const response = await this.request<{ artists: Artist[] }>(`/labels/${labelId}/artists`);
      return response.artists;
    } catch (error) {
      console.error(`Error fetching artists for label ${labelId}:`, error);
      return [];
    }
  }

  private async getArtistDetails(artistId: string): Promise<Artist | null> {
    try {
      // First try to get from our backend
      const response = await this.request<Artist>(`/artists/${artistId}`);
      
      // If we don't have images, try to get from Spotify
      if (!response.profile_image && (!response.images || response.images.length === 0)) {
        console.log('No images found in backend, fetching from Spotify:', artistId);
        try {
          const spotifyResponse = await this.request<Artist>(`/spotify/artists/${artistId}`);
          if (spotifyResponse) {
            // Update our response with Spotify data
            response.profile_image = spotifyResponse.profile_image || spotifyResponse.images?.[0]?.url;
            response.images = spotifyResponse.images;
            response.spotify_url = spotifyResponse.spotify_url;
            response.genres = spotifyResponse.genres;
            
            // Save the updated artist data back to our backend
            await this.request(`/artists/${artistId}`, {
              method: 'PUT',
              data: response
            });
          }
        } catch (spotifyError) {
          console.error('Error fetching artist from Spotify:', artistId, spotifyError);
        }
      }

      console.log('Artist details response:', {
        id: artistId,
        name: response.name,
        hasProfileImage: !!response.profile_image,
        hasImages: !!response.images?.length,
        imageUrl: response.profile_image || response.images?.[0]?.url
      });
      
      return response;
    } catch (error) {
      console.error('Error getting artist details:', artistId, error);
      return null;
    }
  }

  public async getArtistsByLabel(label: RecordLabel): Promise<Artist[]> {
    try {
      console.log('Getting artists for label:', label);
      const artistsMap = new Map<string, Artist>();

      // First, get all releases for the label
      const releasesResponse = await this.request<PaginatedResponse<Release>>(`/releases/${this.getLabelPath(label)}?limit=100&sort=release_date:desc`);
      console.log('Releases response:', {
        total: releasesResponse.totalReleases,
        received: releasesResponse.releases?.length
      });

      // Process releases to collect artists
      for (const release of releasesResponse.releases || []) {
        // Add release artists
        for (const artist of release.artists || []) {
          if (artist.name !== 'Various Artists' && (artist.id || artist.spotify_id)) {
            const artistId = artist.id || artist.spotify_id;
            if (!artistsMap.has(artistId)) {
              // Get full artist details
              const artistDetails = await this.getArtistDetails(artistId);
              if (artistDetails) {
                console.log('Processing artist:', {
                  name: artistDetails.name,
                  id: artistId,
                  profile_image: artistDetails.profile_image,
                  hasImages: !!artistDetails.images?.length
                });
                artistsMap.set(artistId, {
                  ...artistDetails,
                  id: artistId,
                  name: artistDetails.name,
                  profile_image: artistDetails.profile_image || artistDetails.images?.[0]?.url,
                  images: artistDetails.images || [],
                  spotify_url: artistDetails.spotify_url,
                  genres: artistDetails.genres || []
                });
              }
            }
          }
        }

        // Add track artists
        for (const track of release.tracks || []) {
          for (const artist of track.artists || []) {
            if (artist.name !== 'Various Artists' && (artist.id || artist.spotify_id)) {
              const artistId = artist.id || artist.spotify_id;
              if (!artistsMap.has(artistId)) {
                // Get full artist details
                const artistDetails = await this.getArtistDetails(artistId);
                if (artistDetails) {
                  console.log('Processing track artist:', {
                    name: artistDetails.name,
                    id: artistId,
                    profile_image: artistDetails.profile_image,
                    hasImages: !!artistDetails.images?.length
                  });
                  artistsMap.set(artistId, {
                    ...artistDetails,
                    id: artistId,
                    name: artistDetails.name,
                    profile_image: artistDetails.profile_image || artistDetails.images?.[0]?.url,
                    images: artistDetails.images || [],
                    spotify_url: artistDetails.spotify_url,
                    genres: artistDetails.genres || []
                  });
                }
              }
            }
          }
        }
      }
      
      // Now get all tracks with pagination
      let page = 1;
      let hasMore = true;
      const limit = 100;

      while (hasMore) {
        const tracksResponse = await this.request<{ tracks: Track[], total: number }>(
          `/tracks?label=${this.getLabelPath(label)}&limit=${limit}&page=${page}`
        );
        console.log(`Tracks response page ${page}:`, {
          total: tracksResponse.total,
          received: tracksResponse.tracks?.length
        });

        // Process tracks to collect artists
        for (const track of tracksResponse.tracks || []) {
          // Add track artists
          for (const artist of track.artists || []) {
            if (artist.name !== 'Various Artists' && (artist.id || artist.spotify_id)) {
              const artistId = artist.id || artist.spotify_id;
              if (!artistsMap.has(artistId)) {
                // Get full artist details
                const artistDetails = await this.getArtistDetails(artistId);
                if (artistDetails) {
                  console.log('Processing paginated track artist:', {
                    name: artistDetails.name,
                    id: artistId,
                    profile_image: artistDetails.profile_image,
                    hasImages: !!artistDetails.images?.length
                  });
                  artistsMap.set(artistId, {
                    ...artistDetails,
                    id: artistId,
                    name: artistDetails.name,
                    profile_image: artistDetails.profile_image || artistDetails.images?.[0]?.url,
                    images: artistDetails.images || [],
                    spotify_url: artistDetails.spotify_url,
                    genres: artistDetails.genres || []
                  });
                }
              }
            }
          }

          // Add album artists if present
          for (const artist of track.album?.artists || []) {
            if (artist.name !== 'Various Artists' && (artist.id || artist.spotify_id)) {
              const artistId = artist.id || artist.spotify_id;
              if (!artistsMap.has(artistId)) {
                // Get full artist details
                const artistDetails = await this.getArtistDetails(artistId);
                if (artistDetails) {
                  console.log('Processing album artist:', {
                    name: artistDetails.name,
                    id: artistId,
                    profile_image: artistDetails.profile_image,
                    hasImages: !!artistDetails.images?.length
                  });
                  artistsMap.set(artistId, {
                    ...artistDetails,
                    id: artistId,
                    name: artistDetails.name,
                    profile_image: artistDetails.profile_image || artistDetails.images?.[0]?.url,
                    images: artistDetails.images || [],
                    spotify_url: artistDetails.spotify_url,
                    genres: artistDetails.genres || []
                  });
                }
              }
            }
          }
        }

        // Check if we should continue pagination
        hasMore = tracksResponse.tracks?.length === limit;
        if (hasMore) {
          page++;
        }
      }

      // Convert Map to array and sort by name
      const artists = Array.from(artistsMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log('Found artists:', {
        total: artists.length,
        withImages: artists.filter(a => !!a.profile_image).length,
        sample: artists.slice(0, 3).map(a => ({
          id: a.id,
          name: a.name,
          hasProfileImage: !!a.profile_image,
          hasImages: !!a.images?.length
        }))
      });

      return artists;
    } catch (error) {
      console.error('Error getting artists for label:', label, error);
      return [];
    }
  }

  // Releases
  public async getReleases(params: { artistId?: string; labelId?: string } = {}): Promise<Release[]> {
    try {
      if (params.labelId) {
        return this.getReleasesByLabelId(params.labelId);
      }
      if (params.artistId) {
        return this.getReleasesByArtistId(params.artistId);
      }
      return this.request<Release[]>('/releases');
    } catch (error) {
      console.error('Error fetching releases:', error);
      return [];
    }
  }

  public async getReleasesByArtistId(artistId: string): Promise<Release[]> {
    return this.request<Release[]>(`/artists/${artistId}/releases`);
  }

  async getReleasesByLabelId(labelId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Release>> {
    try {
      console.log('DatabaseService: Fetching releases for label:', labelId, 'page:', page, 'limit:', limit);
      const endpoint = `/releases/${labelId}?page=${page}&limit=${limit}&sort=release_date:desc`;
      console.log('DatabaseService: Using endpoint:', endpoint);
      
      const response = await this.request<PaginatedResponse<Release>>(endpoint);
      console.log('DatabaseService: Response metadata:', {
        totalReleases: response.totalReleases,
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        receivedReleases: response.releases?.length
      });

      if (!response?.releases) {
        console.log('DatabaseService: No releases found');
        return {
          releases: [],
          totalReleases: 0,
          currentPage: page,
          totalPages: 1
        };
      }

      // Transform releases to ensure they have the correct image URLs and track data
      const transformedReleases = response.releases.map(release => {
        console.log('DatabaseService: Processing release:', release.name);
        console.log('Raw release data:', {
          name: release.name,
          artists: release.artists,
          tracks: release.tracks?.map(t => ({
            name: t.name,
            artists: t.artists
          }))
        });

        // Get all unique artists from both release and tracks
        const allArtists = new Map();
        
        // Add release artists
        release.artists?.forEach(artist => {
          if (artist.id && artist.name !== 'Various Artists') {
            allArtists.set(artist.id, {
              ...artist,
              id: artist.id || artist.spotify_id,
              profile_image: artist.profile_image || artist.images?.[0]?.url,
              images: artist.images || []
            });
          }
        });

        // Add track artists
        release.tracks?.forEach(track => {
          track.artists?.forEach(artist => {
            if (artist.id && artist.name !== 'Various Artists') {
              allArtists.set(artist.id, {
                ...artist,
                id: artist.id || artist.spotify_id,
                profile_image: artist.profile_image || artist.images?.[0]?.url,
                images: artist.images || []
              });
            }
          });
        });

        const transformedArtists = Array.from(allArtists.values());
        console.log('Transformed artists:', transformedArtists.map(a => a.name));

        // Transform tracks to ensure they have the correct data
        const transformedTracks = release.tracks?.map(track => {
          const trackArtists = track.artists?.filter(artist => artist.name !== 'Various Artists')
            .map(artist => ({
              ...artist,
              id: artist.id || artist.spotify_id,
              profile_image: artist.profile_image || artist.images?.[0]?.url,
              images: artist.images || []
            })) || transformedArtists;

          return {
            ...track,
            duration_ms: track.duration_ms || track.duration || 0,
            album: {
              ...release,
              images: release.album?.images || []
            },
            artists: trackArtists
          };
        });

        return {
          ...release,
          images: release.album?.images || [],
          artists: transformedArtists,
          tracks: transformedTracks
        };
      });

      console.log('Sample transformed release:', {
        name: transformedReleases[0]?.name,
        artistCount: transformedReleases[0]?.artists?.length,
        artists: transformedReleases[0]?.artists?.map(a => ({
          id: a.id,
          name: a.name,
          profile_image: a.profile_image
        }))
      });
      
      return {
        ...response,
        releases: transformedReleases,
        currentPage: page
      };
    } catch (error) {
      console.error('DatabaseService: Error fetching releases:', error);
      throw error;
    }
  }

  async getLabelStats(): Promise<any> {
    try {
      const response = await this.request('/api/labels/stats');
      return response;
    } catch (error) {
      console.error('Error fetching label stats:', error);
      throw error;
    }
  }

  async saveTrack(track: Track): Promise<Track> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/tracks`, {
        id: track.id,
        name: track.name,
        artists: track.artists,
        album: track.album,
        albumCover: track.albumCover,
        releaseDate: track.releaseDate,
        spotifyUrl: track.spotifyUrl,
        preview_url: track.preview_url,
        recordLabel: track.recordLabel,
        beatportUrl: track.beatportUrl,
        soundcloudUrl: track.soundcloudUrl
      });
      return response.data;
    } catch (error) {
      console.error('Error saving track:', error);
      throw error;
    }
  }

  public async saveTracks(tracks: Track[]): Promise<Track[]> {
    try {
      console.log('Saving tracks:', tracks);
      const response = await this.request<Track[]>('/tracks/batch', {
        method: 'POST',
        data: { tracks }
      });
      console.log('Saved tracks response:', response);
      return response;
    } catch (error) {
      console.error('Error saving tracks:', error);
      throw error;
    }
  }

  // Tracks
  public async getTracksFromApi(): Promise<Track[]> {
    return this.request<Track[]>('/tracks');
  }

  public async getTrackById(id: string): Promise<Track> {
    return this.request<Track>(`/tracks/${id}`);
  }

  public async getTracksByLabel(label: RecordLabel, sort: 'created_at' | 'popularity' = 'created_at'): Promise<Track[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('label', this.getLabelPath(label));
      queryParams.set('sort', sort);
      const response = await this.request<{ tracks: Track[], total: number, limit: number, offset: number }>(`/tracks?${queryParams.toString()}`);
      
      // Transform tracks to ensure they have the correct data
      const transformedTracks = (response.tracks || []).map(track => {
        // Try to get the release date from various possible sources
        const releaseDate = track.release_date || 
                          track.releaseDate || 
                          track.album?.release_date ||
                          track.created_at ||
                          track.createdAt;
                          
        console.log('Track:', track.name);
        console.log('Release date sources:', {
          release_date: track.release_date,
          releaseDate: track.releaseDate,
          album_release_date: track.album?.release_date,
          created_at: track.created_at,
          createdAt: track.createdAt
        });
        
        return {
          ...track,
          name: track.name || track.title || 'Untitled',
          artists: track.artists?.map(artist => ({
            ...artist,
            name: artist.name || 'Unknown Artist'
          })) || [],
          duration_ms: track.duration_ms || track.duration || 0,
          release_date: releaseDate || new Date().toISOString(), // Fallback to current date if no date found
          artwork_url: track.artwork_url || track.album?.artwork_url || track.album?.images?.[0]?.url
        };
      });

      console.log('DatabaseService: First transformed track:', JSON.stringify(transformedTracks[0], null, 2));
      return transformedTracks;
    } catch (error) {
      console.error('Error getting tracks by label:', error);
      return [];
    }
  }

  public async getTracksByArtist(artistId: string): Promise<Track[]> {
    try {
      console.log('Getting tracks for artist:', artistId);
      // Get tracks from all labels with pagination
      const labels = ['buildit-records', 'buildit-tech', 'buildit-deep'];
      const limit = 100; // Increase limit to get more tracks per request
      const trackPromises = labels.map(label => 
        this.request<{ tracks: Track[], total: number }>(`/tracks?label=${this.getLabelPath(label)}&limit=${limit}`).then(response => ({
          ...response,
          tracks: response.tracks?.map(track => ({
            ...track,
            label // Add label to each track
          }))
        }))
      );

      const responses = await Promise.all(trackPromises);
      const allTracks = responses.flatMap(response => response.tracks || []);
      console.log('Total tracks fetched:', allTracks.length);
      
      // Log a sample of tracks to debug artist IDs
      console.log('Sample track artist data:', allTracks.slice(0, 3).map(track => ({
        trackName: track.name,
        artists: track.artists?.map(a => ({
          id: a.id || a.spotify_id,
          name: a.name
        }))
      })));
      
      // Filter tracks by artist ID with more detailed logging
      const artistTracks = allTracks.filter(track => {
        const hasArtist = track.artists?.some(artist => {
          const artistMatches = (artist.id === artistId || artist.spotify_id === artistId) && 
                              artist.name !== 'Various Artists';
          if (artistMatches) {
            console.log('Found matching artist in track:', {
              trackName: track.name,
              artistId: artist.id || artist.spotify_id,
              artistName: artist.name
            });
          }
          return artistMatches;
        });
        return hasArtist;
      });
      
      console.log('Tracks for artist:', artistTracks.length);

      // Transform tracks to ensure they have the correct data
      const transformedTracks = artistTracks.map(track => {
        // Get artwork URL from track, release, or album
        const artworkUrl = track.artwork_url 
          || track.release?.artwork_url
          || track.album?.artwork_url 
          || track.album?.images?.[0]?.url;

        // Transform artists to ensure they have profile images
        const transformedArtists = track.artists
          ?.filter(artist => artist.name !== 'Various Artists')
          ?.map(artist => ({
            ...artist,
            id: artist.id || artist.spotify_id,
            profile_image: artist.profile_image || artist.images?.[0]?.url,
            images: artist.images || []
          })) || [];

        return {
          ...track,
          artwork_url: artworkUrl,
          duration_ms: track.duration_ms || track.duration || 0,
          artists: transformedArtists,
          album: track.album ? {
            ...track.album,
            artwork_url: artworkUrl,
            artists: transformedArtists
          } : undefined
        };
      });

      console.log('Sample transformed track:', transformedTracks[0]);
      return transformedTracks;
    } catch (error) {
      console.error('Error getting tracks by artist:', error);
      return [];
    }
  }

  public async importTracks(tracks: Track[]): Promise<Track[]> {
    try {
      console.log('Importing tracks:', tracks);
      const response = await this.request<Track[]>('/tracks/import', {
        method: 'POST',
        data: { tracks }
      });
      console.log('Import response:', response);
      return response;
    } catch (error) {
      console.error('Error importing tracks:', error);
      throw error;
    }
  }

  public async updateTrack(trackId: string, updates: Partial<Track>): Promise<Track> {
    try {
      const response = await axios.put(`${this.baseUrl}/api/tracks/${trackId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating track:', error);
      throw error;
    }
  }

  async verifyAdminToken(): Promise<{ verified: boolean }> {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await this.request('/api/admin/verify-admin-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return { verified: true };
    } catch (error) {
      console.error('Error verifying admin token:', error);
      throw error;
    }
  }

  // Helper methods
  private getLabelPath(label: RecordLabel | string): string {
    return typeof label === 'string' ? label : label.id;
  }
}

export const databaseService = DatabaseService.getInstance();
