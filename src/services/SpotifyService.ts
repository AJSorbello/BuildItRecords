import axios from 'axios';
import { encode as base64Encode } from 'base-64';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '@env';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyRelease {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  images: Array<{ url: string }>;
  release_date: string;
  external_urls: {
    spotify: string;
  };
  tracks: {
    items: SpotifyTrack[];
  };
}

class SpotifyService {
  private static instance: SpotifyService;
  private accessToken: string | null = null;
  private tokenExpirationTime: number = 0;

  private constructor() {}

  static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpirationTime) {
      return this.accessToken;
    }

    try {
      // Get a new token using client credentials
      const auth = base64Encode(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpirationTime = Date.now() + (response.data.expires_in * 1000);
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
      throw error;
    }
  }

  async searchByISRC(isrc: string): Promise<SpotifyTrack | null> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `https://api.spotify.com/v1/search?q=isrc:${isrc}&type=track`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const tracks = response.data.tracks.items;
      return tracks.length > 0 ? tracks[0] : null;
    } catch (error) {
      console.error('Error searching Spotify by ISRC:', error);
      return null;
    }
  }

  async searchByUPC(upc: string): Promise<SpotifyTrack | null> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `https://api.spotify.com/v1/search?q=upc:${upc}&type=album`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const albums = response.data.albums.items;
      if (albums.length > 0) {
        const albumTracks = await axios.get(
          `https://api.spotify.com/v1/albums/${albums[0].id}/tracks`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return albumTracks.data.items[0] || null;
      }
      return null;
    } catch (error) {
      console.error('Error searching Spotify by UPC:', error);
      return null;
    }
  }

  async getTrackPreview(trackId: string): Promise<string | null> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(
        `https://api.spotify.com/v1/tracks/${trackId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.preview_url;
    } catch (error) {
      console.error('Error getting track preview:', error);
      return null;
    }
  }

  async getLabelReleases(labelId: string): Promise<SpotifyRelease[]> {
    try {
      const token = await this.getAccessToken();
      if (!token) throw new Error('No access token available');

      // Map label names to their Spotify artist IDs
      const labelSpotifyIds = {
        'records': 'builditrecords',  // Build It Records
        'tech': 'buildittech',        // Build It Tech (placeholder - need actual ID)
        'deep': 'builditdeep',        // Build It Deep (placeholder - need actual ID)
      };

      const spotifyId = labelSpotifyIds[labelId];
      if (!spotifyId) throw new Error('Invalid label ID');

      // First get the user's playlists
      const response = await axios.get(
        `https://api.spotify.com/v1/users/${spotifyId}/playlists`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          params: {
            limit: 50,
          },
        }
      );

      // Get full details for each playlist
      const releases = await Promise.all(
        response.data.items.map(async (playlist: any) => {
          const playlistDetails = await axios.get(
            `https://api.spotify.com/v1/playlists/${playlist.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          // Convert playlist to our release format
          return {
            id: playlist.id,
            name: playlist.name,
            artists: playlist.description ? [{ name: playlist.description }] : [{ name: 'Various Artists' }],
            images: playlist.images,
            release_date: playlist.description?.match(/\d{4}/)?.[0] || new Date().getFullYear().toString(),
            external_urls: {
              spotify: playlist.external_urls.spotify,
            },
            tracks: {
              items: playlistDetails.data.tracks.items.map((item: any) => ({
                id: item.track.id,
                name: item.track.name,
                artists: item.track.artists,
                duration_ms: item.track.duration_ms,
                preview_url: item.track.preview_url,
                external_urls: item.track.external_urls,
              })),
            },
          };
        })
      );

      return releases.sort((a, b) => 
        new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      );
    } catch (error) {
      console.error('Error fetching label releases:', error);
      throw error;
    }
  }

  async getLatestRelease(labelId: string): Promise<SpotifyRelease | null> {
    try {
      const releases = await this.getLabelReleases(labelId);
      return releases.length > 0 ? releases[0] : null;
    } catch (error) {
      console.error('Error fetching latest release:', error);
      throw error;
    }
  }

  async searchArtist(query: string): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      if (!token) throw new Error('No access token available');

      const response = await axios.get(
        'https://api.spotify.com/v1/search',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          params: {
            q: query,
            type: 'artist',
            limit: 10,
          },
        }
      );

      return response.data.artists.items;
    } catch (error) {
      console.error('Error searching for artist:', error);
      throw error;
    }
  }

  async getArtistReleases(artistId: string): Promise<SpotifyRelease[]> {
    try {
      const token = await this.getAccessToken();
      if (!token) throw new Error('No access token available');

      const response = await axios.get(
        `https://api.spotify.com/v1/artists/${artistId}/albums`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          params: {
            include_groups: 'album,single',
            limit: 50,
            market: 'US',
          },
        }
      );

      // Get full album details for each release
      const releases = await Promise.all(
        response.data.items.map(async (album: any) => {
          const albumDetails = await axios.get(
            `https://api.spotify.com/v1/albums/${album.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          return albumDetails.data;
        })
      );

      return releases.sort((a, b) => 
        new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      );
    } catch (error) {
      console.error('Error fetching artist releases:', error);
      throw error;
    }
  }

  async getTrackDetails(trackId: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      if (!token) throw new Error('No access token available');

      const response = await axios.get(
        `https://api.spotify.com/v1/tracks/${trackId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      // Get artist details
      const artistResponses = await Promise.all(
        response.data.artists.map((artist: any) =>
          axios.get(`https://api.spotify.com/v1/artists/${artist.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          })
        )
      );

      const artists = artistResponses.map(res => res.data);

      return {
        track: response.data,
        artists: artists
      };
    } catch (error) {
      console.error('Error getting track details:', error);
      throw error;
    }
  }
}

export default SpotifyService;
