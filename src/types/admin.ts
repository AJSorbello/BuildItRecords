import { RecordLabel } from './labels';
import { Image, ExternalUrls } from './models';

export interface AdminFormData {
  id: string;
  name: string;
  artists: string;
  spotifyUrl: string;
  label: RecordLabel;
  albumCover: string;
  album: {
    id: string;
    name: string;
    releaseDate: string;
    images: Image[];
    external_urls: ExternalUrls;
    artists: {
      id: string;
      name: string;
      external_urls: ExternalUrls;
    }[];
  };
  releaseDate: string;
  preview_url: string | null;
  beatportUrl?: string;
  soundcloudUrl?: string;
}

export interface ImportProgress {
  total: number;
  current: number;
  status: 'idle' | 'importing' | 'complete' | 'error';
}

export interface FetchState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}

export interface TrackDetails {
  id: string;
  name: string;
  artists: {
    id: string;
    name: string;
    external_urls: ExternalUrls;
  }[];
  album: {
    id: string;
    name: string;
    releaseDate: string;
    images: Image[];
    external_urls: ExternalUrls;
    artists: {
      id: string;
      name: string;
      external_urls: ExternalUrls;
    }[];
  };
  label: RecordLabel;
  spotifyUrl: string;
  albumCover: string;
  releaseDate: string;
  preview_url: string | null;
  beatportUrl?: string;
  soundcloudUrl?: string;
}
