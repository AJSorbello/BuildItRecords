import { 
  SimplifiedAlbum, 
  SimplifiedArtist, 
  Track as SpotifyTrack,
  PlaylistedTrack,
  SimplifiedPlaylist,
  Image
} from '@spotify/web-api-ts-sdk';
import { RecordLabel } from '../constants/labels';

// Re-export SDK types
export type {
  SimplifiedAlbum as SpotifyAlbum,
  SimplifiedArtist as SpotifyArtist,
  SpotifyTrack,
  PlaylistedTrack as SpotifyPlaylistTrack,
  SimplifiedPlaylist as SpotifyPlaylist,
  Image as SpotifyImage
};

// Application-specific types that extend Spotify SDK types
export interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SpotifyApiError {
  statusCode?: number;
  body?: {
    error?: {
      status: number;
      message: string;
    };
  };
}

// Type Guards
export function isSpotifyTrack(track: any): track is SpotifyTrack {
  return (
    track &&
    typeof track === 'object' &&
    'id' in track &&
    'name' in track &&
    'artists' in track &&
    Array.isArray(track.artists) &&
    'album' in track
  );
}

export function isSpotifyAlbum(album: any): album is SimplifiedAlbum {
  return (
    album &&
    typeof album === 'object' &&
    'id' in album &&
    'name' in album &&
    'artists' in album &&
    Array.isArray(album.artists) &&
    'images' in album &&
    Array.isArray(album.images)
  );
}
