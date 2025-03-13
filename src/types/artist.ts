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

// Full Artist interface with all properties
export interface Artist extends ArtistBase {
  uri?: string;
  external_urls?: SpotifyExternalUrls;
  spotify_url?: string;
  image_url?: string;
  profile_image_url?: string;
  profile_image_large_url?: string;
  profile_image_small_url?: string;
  type: 'artist';
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
