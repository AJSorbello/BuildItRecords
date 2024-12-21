import { SpotifyImage } from './track';
import { Album } from './Album';
import { Track } from './track';
import { RecordLabel } from '../constants/labels';

export interface Artist {
  id: string;
  name: string;
  imageUrl: string;  // Primary image URL
  image: string;  // Required for compatibility
  images?: SpotifyImage[];  // Full array of Spotify images
  recordLabel: RecordLabel;
  labels: RecordLabel[];
  bio: string;  // Make required
  spotifyUrl: string;
  beatportUrl?: string;
  soundcloudUrl?: string;
  bandcampUrl?: string;
  monthlyListeners?: number;
  followers?: { total: number };
  releases: string[];
  genres: string[];
  tracks?: Track[];
  external_urls?: { spotify: string };
}

export interface ArtistFormData {
  name: string;
  imageUrl: string;
  labels: string[];
  spotifyUrl?: string;
  beatportUrl?: string;
  soundcloudUrl?: string;
  bandcampUrl?: string;
  bio?: string;
}
