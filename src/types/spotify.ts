export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  duration_ms: number;
  preview_url: string | null;
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyRelease {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  images: SpotifyImage[];
  release_date: string;
  tracks: {
    items: SpotifyTrack[];
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
