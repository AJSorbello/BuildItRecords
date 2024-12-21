import { RecordLabel } from '../constants/labels';
import { Track } from './track';
import { Release } from './release';

export interface ArtistFormData {
  name: string;
  spotifyUrl?: string;
  imageUrl?: string;
  label: RecordLabel;
  bio?: string;
}

export interface SimpleArtist {
  id: string;
  name: string;
  spotifyUrl: string;
  recordLabel: RecordLabel;
  imageUrl?: string;
}

export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface Artist extends SimpleArtist {
  bio?: string;
  images?: SpotifyImage[];
  beatportUrl?: string;
  soundcloudUrl?: string;
  bandcampUrl?: string;
  socialLinks?: {
    spotify?: string;
    beatport?: string;
    soundcloud?: string;
    bandcamp?: string;
  };
}

export interface SpotifyArtistData {
  id: string;
  name: string;
  images: SpotifyImage[];
  genres: string[];
  external_urls: {
    spotify: string;
  };
}

export function convertSpotifyArtistToArtist(spotifyArtist: SpotifyArtistData, recordLabel: RecordLabel): SimpleArtist {
  return {
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    spotifyUrl: spotifyArtist.external_urls.spotify,
    recordLabel,
    imageUrl: spotifyArtist.images[0]?.url
  };
}

export const createArtist = (data: Partial<Artist>): Artist => {
  return {
    id: data.id || '',
    name: data.name || '',
    spotifyUrl: data.spotifyUrl || '',
    recordLabel: data.recordLabel || RecordLabel.RECORDS,
    imageUrl: data.imageUrl,
    bio: data.bio,
    images: data.images,
    beatportUrl: data.beatportUrl,
    soundcloudUrl: data.soundcloudUrl,
    bandcampUrl: data.bandcampUrl,
    socialLinks: {
      spotify: data.spotifyUrl,
      beatport: data.beatportUrl,
      soundcloud: data.soundcloudUrl,
      bandcamp: data.bandcampUrl,
    }
  };
};
