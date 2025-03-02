/**
 * @fileoverview Service for handling database operations with Supabase
 * @module services/SupabaseService
 */

import { Track } from '../types/track';
import { Release } from '../types/release';
import { Artist } from '../types/artist';
import { supabase } from './supabase';
import { Database } from '../types/database.types';

interface ImportResponse {
  success: boolean;
  message: string;
  details?: {
    totalTracksImported: number;
    totalArtistsImported: number;
    totalReleasesImported: number;
  };
  totalTracksImported?: number;
  totalArtistsImported?: number;
  totalReleasesImported?: number;
}

interface AdminLoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}

interface TokenVerificationResponse {
  verified: boolean;
  message?: string;
}

/**
 * Service class for handling database operations through Supabase
 */
class SupabaseService {
  private static instance: SupabaseService;

  private constructor() {
    console.log('SupabaseService initialized');
  }

  /**
   * Get the singleton instance of the SupabaseService
   * @returns The SupabaseService instance
   */
  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * Get releases by label ID with pagination
   * @param labelId The ID of the label
   * @param page The page number (starting from 1)
   * @param limit The number of releases per page
   * @returns Promise resolving to releases, count, and pagination info
   */
  async getReleasesByLabelId(
    labelId: string,
    page = 1,
    limit = 50
  ): Promise<{
    releases: Release[];
    totalReleases: number;
    totalTracks: number;
    hasMore: boolean;
  }> {
    try {
      const offset = (page - 1) * limit;
      
      // Get releases for the label with pagination
      const { data: releases, error, count } = await supabase
        .from('releases')
        .select('*, primary_artist_id(*)')
        .eq('label_id', labelId)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      
      // Get total tracks count for the label
      const { count: totalTracks, error: tracksError } = await supabase
        .from('tracks')
        .select('*', { count: 'exact' })
        .eq('label_id', labelId);
      
      if (tracksError) throw new Error(tracksError.message);
      
      // Transform the data to match our frontend model
      const transformedReleases: Release[] = releases.map((release: any) => ({
        id: release.id,
        name: release.title,
        type: 'album',
        release_date: release.release_date,
        images: [{ url: release.artwork_url }],
        artists: release.primary_artist_id ? [release.primary_artist_id] : [],
        label_id: release.label_id,
        artist_id: release.primary_artist_id?.id,
        total_tracks: 0, // Will be populated later
        external_urls: { spotify: release.spotify_url },
        uri: release.spotify_url || '',
        spotify_uri: release.spotify_url || '',
        spotify_id: release.id,
        album_type: 'album',
        popularity: 0,
        tracks: [],
        created_at: release.created_at,
        updated_at: release.updated_at,
        status: release.status
      }));
      
      return {
        releases: transformedReleases,
        totalReleases: count || 0,
        totalTracks: totalTracks || 0,
        hasMore: Boolean(count && offset + limit < count)
      };
    } catch (error: any) {
      console.error('Error fetching releases:', error);
      return {
        releases: [],
        totalReleases: 0,
        totalTracks: 0,
        hasMore: false
      };
    }
  }

  /**
   * Get top releases for a label
   * @param labelId The ID of the label
   * @returns Promise resolving to an array of top releases
   */
  async getTopReleases(labelId: string): Promise<Release[]> {
    try {
      const { data: releases, error } = await supabase
        .from('releases')
        .select('*, primary_artist_id(*)')
        .eq('label_id', labelId)
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw new Error(error.message);
      
      // Transform the data to match our frontend model
      const transformedReleases: Release[] = releases.map((release: any) => ({
        id: release.id,
        name: release.title,
        type: 'album',
        release_date: release.release_date,
        images: [{ url: release.artwork_url }],
        artists: release.primary_artist_id ? [release.primary_artist_id] : [],
        label_id: release.label_id,
        artist_id: release.primary_artist_id?.id,
        total_tracks: 0, // Will be populated later
        external_urls: { spotify: release.spotify_url },
        uri: release.spotify_url || '',
        spotify_uri: release.spotify_url || '',
        spotify_id: release.id,
        album_type: 'album',
        popularity: 0,
        tracks: [],
        created_at: release.created_at,
        updated_at: release.updated_at,
        status: release.status
      }));
      
      return transformedReleases;
    } catch (error: any) {
      console.error('Error fetching top releases:', error);
      return [];
    }
  }

  /**
   * Get tracks by label
   * @param labelId The ID of the label
   * @param sortBy The field to sort by
   * @returns Promise resolving to tracks and count
   */
  async getTracksByLabel(labelId: string, sortBy = 'created_at'): Promise<{
    tracks: Track[];
    total: number;
  }> {
    try {
      const { data: tracks, error, count } = await supabase
        .from('tracks')
        .select('*, release_id(*), label_id(*)')
        .eq('label_id', labelId)
        .order(sortBy, { ascending: false });
      
      if (error) throw new Error(error.message);
      
      // We need to fetch artists for each track
      const transformedTracks: Track[] = await Promise.all(
        tracks.map(async (track: any) => {
          // Fetch artists for this track
          const { data: trackArtists, error: artistsError } = await supabase
            .from('track_artists')
            .select('artist_id(*)')
            .eq('track_id', track.id);
          
          if (artistsError) throw new Error(artistsError.message);
          
          const artists = trackArtists.map((ta: any) => ta.artist_id);
          
          return {
            id: track.id,
            name: track.title,
            duration_ms: track.duration,
            track_number: track.track_number,
            disc_number: track.disc_number,
            preview_url: track.preview_url,
            external_urls: { spotify: track.spotify_url },
            uri: track.spotify_url || '',
            isrc: track.isrc,
            artists: artists,
            release: track.release_id,
            label: track.label_id,
            created_at: track.created_at,
            updated_at: track.updated_at,
            status: track.status
          };
        })
      );
      
      return {
        tracks: transformedTracks,
        total: count || 0
      };
    } catch (error: any) {
      console.error('Error fetching tracks:', error);
      return {
        tracks: [],
        total: 0
      };
    }
  }

  /**
   * Get artists for a label
   * @param labelId The ID of the label or an object containing the ID
   * @returns Promise resolving to an array of artists
   */
  async getArtistsForLabel(labelId: string | { id: string }): Promise<Artist[]> {
    try {
      const labelIdString = typeof labelId === 'string' ? labelId : labelId.id;
      
      const { data: artists, error } = await supabase
        .from('artists')
        .select('*')
        .eq('label_id', labelIdString);
      
      if (error) throw new Error(error.message);
      
      // Transform the data to match our frontend model
      const transformedArtists: Artist[] = artists.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        profile_image_url: artist.profile_image_url,
        profile_image_small_url: artist.profile_image_small_url,
        profile_image_large_url: artist.profile_image_large_url,
        label: artist.label_id,
        label_id: artist.label_id,
        external_urls: { spotify: artist.spotify_url },
        uri: artist.spotify_url || '',
        spotify_id: artist.id,
        type: 'artist',
        created_at: artist.created_at,
        updated_at: artist.updated_at
      }));
      
      return transformedArtists;
    } catch (error: any) {
      console.error('Error fetching artists:', error);
      return [];
    }
  }

  /**
   * Get tracks by artist
   * @param artistId The ID of the artist
   * @returns Promise resolving to an array of tracks
   */
  async getTracksByArtist(artistId: string): Promise<Track[]> {
    try {
      // Get track IDs from track_artists join table
      const { data: trackArtists, error: trackArtistsError } = await supabase
        .from('track_artists')
        .select('track_id')
        .eq('artist_id', artistId);
      
      if (trackArtistsError) throw new Error(trackArtistsError.message);
      
      if (!trackArtists || trackArtists.length === 0) {
        return [];
      }
      
      // Get the actual tracks
      const trackIds = trackArtists.map(ta => ta.track_id);
      const { data: tracks, error: tracksError } = await supabase
        .from('tracks')
        .select('*, release_id(*)')
        .in('id', trackIds);
      
      if (tracksError) throw new Error(tracksError.message);
      
      // Transform the data to match our frontend model
      const transformedTracks: Track[] = await Promise.all(
        tracks.map(async (track: any) => {
          // Get all artists for this track
          const { data: trackArtists, error: artistsError } = await supabase
            .from('track_artists')
            .select('artist_id(*)')
            .eq('track_id', track.id);
          
          if (artistsError) throw new Error(artistsError.message);
          
          const artists = trackArtists.map((ta: any) => ta.artist_id);
          
          return {
            id: track.id,
            name: track.title,
            duration_ms: track.duration,
            track_number: track.track_number,
            disc_number: track.disc_number,
            preview_url: track.preview_url,
            external_urls: { spotify: track.spotify_url },
            uri: track.spotify_url || '',
            isrc: track.isrc,
            artists: artists,
            release: track.release_id,
            created_at: track.created_at,
            updated_at: track.updated_at,
            status: track.status
          };
        })
      );
      
      return transformedTracks;
    } catch (error: any) {
      console.error('Error fetching tracks by artist:', error);
      return [];
    }
  }

  /**
   * Get releases by artist
   * @param artistId The ID of the artist
   * @returns Promise resolving to an array of releases
   */
  async getReleasesByArtist(artistId: string): Promise<Release[]> {
    try {
      // Get release IDs from release_artists join table
      const { data: releaseArtists, error: releaseArtistsError } = await supabase
        .from('release_artists')
        .select('release_id')
        .eq('artist_id', artistId);
      
      if (releaseArtistsError) throw new Error(releaseArtistsError.message);
      
      if (!releaseArtists || releaseArtists.length === 0) {
        return [];
      }
      
      // Get the actual releases
      const releaseIds = releaseArtists.map(ra => ra.release_id);
      const { data: releases, error: releasesError } = await supabase
        .from('releases')
        .select('*')
        .in('id', releaseIds);
      
      if (releasesError) throw new Error(releasesError.message);
      
      // Transform the data to match our frontend model
      const transformedReleases: Release[] = await Promise.all(
        releases.map(async (release: any) => {
          // Get the primary artist
          const { data: primaryArtist, error: artistError } = await supabase
            .from('artists')
            .select('*')
            .eq('id', release.primary_artist_id)
            .single();
          
          if (artistError && artistError.code !== 'PGRST116') {
            // PGRST116 is "no rows returned" which is ok if there's no primary artist
            throw new Error(artistError.message);
          }
          
          // Get all tracks for this release
          const { data: tracks, error: tracksError } = await supabase
            .from('tracks')
            .select('*')
            .eq('release_id', release.id);
          
          if (tracksError) throw new Error(tracksError.message);
          
          return {
            id: release.id,
            name: release.title,
            type: 'album',
            release_date: release.release_date,
            images: [{ url: release.artwork_url }],
            artists: primaryArtist ? [primaryArtist] : [],
            label_id: release.label_id,
            artist_id: release.primary_artist_id,
            total_tracks: tracks.length,
            external_urls: { spotify: release.spotify_url },
            uri: release.spotify_url || '',
            spotify_uri: release.spotify_url || '',
            spotify_id: release.id,
            album_type: 'album',
            popularity: 0,
            tracks: [],
            created_at: release.created_at,
            updated_at: release.updated_at,
            status: release.status
          };
        })
      );
      
      return transformedReleases;
    } catch (error: any) {
      console.error('Error fetching releases by artist:', error);
      return [];
    }
  }

  /**
   * Import tracks from Spotify (placeholder - actual implementation would depend on backend)
   * @param labelId The ID of the label
   * @returns Promise resolving to import response
   */
  async importTracksFromSpotify(labelId: string): Promise<ImportResponse> {
    // NOTE: This would typically be a server-side operation
    // For now, we'll return a placeholder response
    return {
      success: false,
      message: "This operation must be performed from the server side. Please use the API endpoint instead."
    };
  }

  /**
   * Admin login (placeholder - would need to implement proper auth)
   * @param username Admin username
   * @param password Admin password
   * @returns Promise resolving to login response
   */
  async adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
    // This is just a placeholder - you'd typically use Supabase Auth or a custom auth system
    // For demo purposes, we'll just check against environment variables
    const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
    const adminPasswordHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH;
    
    if (username === adminUsername && password === adminPasswordHash) {
      // In a real app, you'd generate a JWT here or use Supabase session
      return {
        success: true,
        token: 'demo-token'
      };
    }
    
    return {
      success: false,
      message: 'Invalid credentials'
    };
  }

  /**
   * Verify admin token (placeholder)
   * @returns Promise resolving to token verification response
   */
  async verifyAdminToken(): Promise<TokenVerificationResponse> {
    // In a real app, you'd validate the JWT or check the Supabase session
    // This is just a placeholder
    const token = localStorage.getItem('adminToken');
    
    if (token) {
      return {
        verified: true
      };
    }
    
    return {
      verified: false,
      message: 'Invalid or expired token'
    };
  }
}

export const supabaseService = SupabaseService.getInstance();
