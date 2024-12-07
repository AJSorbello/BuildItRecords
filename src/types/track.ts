import { RecordLabel } from '../constants/labels';

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface Album {
  name: string;
  releaseDate: string;
  images: SpotifyImage[];
}

export interface Track {
  id: string;
  trackTitle: string;
  artist: string;
  albumCover: string;
  album: Album;
  recordLabel: RecordLabel;
  previewUrl: string | null;
  spotifyUrl: string;
  releaseDate: string;
  beatportUrl: string;
  soundcloudUrl: string;
}

export interface SpotifyApiTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    release_date: string;
    images: SpotifyImage[];
  };
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  duration_ms: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  tracks: {
    items: {
      track: SpotifyApiTrack;
      added_at: string;
    }[];
  };
  external_urls: {
    spotify: string;
  };
  owner: {
    display_name: string;
  };
}
