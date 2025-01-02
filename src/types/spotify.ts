import { Artist } from './artist';

export interface ExternalIds {
  isrc?: string;
  ean?: string;
  upc?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
    external_urls: {
      spotify: string;
    };
  }>;
  album: {
    id: string;
    name: string;
    release_date: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    external_urls: {
      spotify: string;
    };
    external_ids?: ExternalIds;
  };
  external_urls: {
    spotify: string;
  };
  preview_url: string | null;
  duration_ms: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  followers: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  external_urls: {
    spotify: string;
  };
  external_ids?: ExternalIds;
  genres?: string[];
  href?: string;
  label?: string;
}

export interface SpotifyRelease {
  id: string;
  title: string;
  artist: Artist;
  releaseDate: string;
  albumCover: string;
  spotifyUrl: string;
  previewUrl?: string;
  label?: string;
  external_ids?: ExternalIds;
}
