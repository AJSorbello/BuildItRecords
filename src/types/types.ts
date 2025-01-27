export interface ExternalUrls {
  spotify: string;
}

export interface Image {
  url: string;
  height: number | null;
  width: number | null;
}

export interface ExternalIds {
  isrc?: string;
  ean?: string;
  upc?: string;
}

export interface Followers {
  href: string | null;
  total: number;
}

export interface Copyright {
  text: string;
  type: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface Artist {
  id: string;
  name: string;
  external_urls: ExternalUrls;
  uri: string;
  type: 'artist';
  spotify_url: string;
}

export interface Album {
  id?: string;
  name: string;
  releaseDate: string;
  images: Image[];
}

export enum RecordLabel {
  RECORDS = 'buildit-records',
  TECH = 'buildit-tech',
  DEEP = 'buildit-deep'
}

export interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album?: Album;
  releaseDate: string;
  spotifyUrl?: string;
  preview_url?: string;
  duration_ms?: number;
  explicit?: boolean;
  popularity?: number;
  label?: RecordLabel;
  albumCover?: string;
  beatportUrl?: string;
  soundcloudUrl?: string;
  external_urls?: {
    spotify?: string;
    [key: string]: string | undefined;
  };
  external_ids?: ExternalIds;
}

export interface TrackResponse {
  tracks: Track[];
  total: number;
}

export interface SpotifyTrackData {
  id: string;
  name: string;
  artists: Artist[];
  album?: Album;
  releaseDate: string;
  spotifyUrl?: string;
  preview_url?: string;
  duration_ms?: number;
}

export interface ImportProgress {
  imported: number;
  total: number;
}

export interface FetchState {
  loading: boolean;
  error: string | null;
}
