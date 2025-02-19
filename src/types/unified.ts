import { Artist } from './models';

export type { Artist } from './models';

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyExternalUrls {
  spotify?: string;
  instagram?: string;
  soundcloud?: string;
}

export interface SpotifyExternalIds {
  isrc?: string;
  [key: string]: string | undefined;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
  total_tracks: number;
  release_type: 'album' | 'single' | 'compilation' | 'ep';
  external_urls: SpotifyExternalUrls;
  uri?: string;
  artists: Artist[];
  artwork_url?: string;
  label_id?: string;
}

export interface Release {
  id: string;
  name: string;
  release_type: 'album' | 'single' | 'compilation' | 'ep';
  release_date: string;
  artwork_url?: string;
  spotify_url?: string;
  spotify_uri?: string;
  total_tracks: number;
  artists?: Artist[];
  label_id?: string;
  label?: {
    id: string;
    name: string;
  };
  status?: string;
  created_at?: string;
  updated_at?: string;
  images?: SpotifyImage[];
}

export interface UnifiedTrack {
  id: string;
  name: string;
  artists: Artist[];
  duration_ms: number;
  external_urls: SpotifyExternalUrls;
  external_ids?: SpotifyExternalIds;
  track_number?: number;
  preview_url?: string;
  is_playable?: boolean;
  explicit?: boolean;
  popularity?: number;
  album?: SpotifyAlbum;
  release?: Release;
  label?: {
    id: string;
    name: string;
  };
  label_id?: string;
  uri?: string;
  created_at?: string;
  updated_at?: string;
  images?: SpotifyImage[];
  type?: string;
}

export type { UnifiedTrack as Track };

// Type guard to check if an object is a UnifiedTrack
export function isUnifiedTrack(obj: any): obj is UnifiedTrack {
  return (
    obj &&
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.artists) &&
    typeof obj.duration_ms === 'number'
  );
}
