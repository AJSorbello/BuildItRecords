export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyExternalUrls {
  spotify: string;
}

export interface SpotifyExternalIds {
  isrc?: string;
  ean?: string;
  upc?: string;
}

export interface SpotifyRestrictions {
  reason: 'market' | 'product' | 'explicit';
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  duration_ms: number;
  preview_url: string | null;
  external_urls: SpotifyExternalUrls;
  album: SpotifyAlbum;  
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  images: SpotifyImage[];
  release_date: string;
  external_urls: SpotifyExternalUrls;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: SpotifyExternalUrls;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;  
  images: SpotifyImage[];
  tracks: {
    items: SpotifyPlaylistTrack[];
  };
  external_urls: SpotifyExternalUrls;
}

export interface SpotifyPlaylistTrack {
  track: SpotifyTrack;
  added_at: string;
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

export interface SpotifyError {
  status: number;
  message: string;
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
