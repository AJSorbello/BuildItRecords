// Spotify API Types
export interface SpotifyApiImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyApiArtist {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyApiAlbum {
  id: string;
  name: string;
  images: SpotifyApiImage[];
  artists: SpotifyApiArtist[];
  release_date: string;
  external_urls: {
    spotify: string;
  };
  label?: string;
}

export interface SpotifyApiTrack {
  id: string;
  name: string;
  artists: SpotifyApiArtist[];
  album: SpotifyApiAlbum;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

// Application Types
export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  artists: string;
  releaseDate: string;
  spotifyUrl: string;
}

export interface SpotifyTrack {
  id: string;
  trackTitle: string;
  artist: string;
  albumCover: string;
  recordLabel: string;
  previewUrl: string | null;
  spotifyUrl: string;
  album: SpotifyAlbum;
}

export interface SimplifiedTrackOutput {
  trackTitle: string;
  artistName: string;
  recordLabel: string;
  artwork: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyApiImage[];
  tracks: {
    items: {
      track: SpotifyApiTrack;
      added_at: string;
    }[];
  };
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
  tracks: {
    items: Array<{
      id: string;
      name: string;
      artists: Array<{ name: string }>;
      duration_ms: number;
      preview_url: string | null;
    }>;
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SpotifyApiError extends Error {
  statusCode?: number;
  body?: {
    error?: {
      status: number;
      message: string;
    };
  };
}

// Type Guards
export function isSpotifyTrack(track: any): track is SpotifyApiTrack {
  return track &&
    typeof track.id === 'string' &&
    typeof track.name === 'string' &&
    Array.isArray(track.artists) &&
    track.album &&
    typeof track.album.id === 'string';
}

export function isSpotifyAlbum(album: any): album is SpotifyApiAlbum {
  return album &&
    typeof album.id === 'string' &&
    typeof album.name === 'string' &&
    Array.isArray(album.images) &&
    Array.isArray(album.artists);
}
