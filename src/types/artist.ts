/**
 * @fileoverview Artist type definitions
 * @module types/Artist
 */

import type { SpotifyExternalUrls } from './spotify';

// Basic artist properties that are always required
export interface ArtistBase {
  id: string;
  name: string;
}

// Interface for Spotify followers
export interface Followers {
  href?: string | null;
  total?: number;
}

// Full Artist interface with all properties
export interface Artist extends ArtistBase {
  uri: string;
  external_urls?: SpotifyExternalUrls;
  spotify_url?: string;
  image_url?: string;
  profile_image_url?: string;
  profile_image_large_url?: string;
  profile_image_small_url?: string;
  genres?: string[];
  followers?: Followers;
  type: 'artist';
  // Additional properties used in the application
  bio?: string;
  labels?: Array<{ id: string; name?: string }>;
  label_id?: string | number;
  labelId?: string | number;
  images?: Array<{
    url: string;
    width?: number;
    height?: number;
  }>;
  // Additional fields that might be present in the API response
  [key: string]: any;
}

// Simplified interface for tests and other scenarios
export interface SimpleArtist extends ArtistBase {
  uri?: string;
  type?: 'artist';
  external_urls?: SpotifyExternalUrls;
  spotify_url?: string;
}

export interface ArtistWithReleases extends Artist {
  releases: any[]; // You can replace 'any[]' with a more specific type if needed
}
