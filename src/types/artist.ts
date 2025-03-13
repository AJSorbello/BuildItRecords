/**
 * @fileoverview Artist type definitions
 * @module types/Artist
 */

import type { SpotifyExternalUrls } from './spotify';

export interface Artist {
  id: string;
  name: string;
  uri?: string;
  external_urls?: SpotifyExternalUrls;
  spotify_url?: string;
  image_url?: string;
  profile_image_url?: string;
  profile_image_large_url?: string;
  profile_image_small_url?: string;
  type: 'artist';
}

export interface ArtistWithReleases extends Artist {
  releases: any[]; // You can replace 'any[]' with a more specific type if needed
}
