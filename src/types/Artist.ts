import { SpotifyApi, Artist as SpotifyArtist } from '@spotify/web-api-ts-sdk';
import { RecordLabel } from '../constants/labels';

export interface Artist {
  id: string;
  name: string;
  spotifyUrl: string;
  images?: Array<{ url: string }>;
  imageUrl?: string;
  genres: string[];
  followers?: number;
  monthlyListeners?: number;
  primaryLabel?: RecordLabel;
  label?: RecordLabel;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
  popularity?: number;
}

export interface ArtistFormData {
  name: string;
  spotifyUrl?: string;
  imageUrl?: string;
  label: RecordLabel;
  bio?: string;
}

export interface SimpleArtist {
  id?: string;
  name: string;
  spotifyUrl?: string;
  imageUrl?: string;
  genres?: string[];
  popularity?: number;
}

export function convertSpotifyArtistToArtist(spotifyArtist: SpotifyArtist, recordLabel?: RecordLabel): Artist {
  return {
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    spotifyUrl: spotifyArtist.external_urls.spotify,
    images: spotifyArtist.images,
    imageUrl: spotifyArtist.images[0]?.url,
    genres: spotifyArtist.genres,
    followers: spotifyArtist.followers.total,
    monthlyListeners: spotifyArtist.followers.total,
    primaryLabel: recordLabel,
    label: recordLabel,
    popularity: spotifyArtist.popularity,
    bio: ''
  };
}
