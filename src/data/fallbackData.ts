/**
 * Fallback data for when API calls fail
 * This file contains real artist and release data to display when the API is unavailable
 */

import { Artist } from '../types';
import { Release } from '../types/release';

// Label ID constants
export const BUILDIT_RECORDS_LABEL_ID = 'buildit-records';

/**
 * Real artists data for BuildIt Records
 */
export const fallbackArtists: Artist[] = [
  {
    id: '37BAm9SFMmFBFoV5VjdUGm',
    name: 'Monsieur Minimal',
    image_url: 'https://i.scdn.co/image/ab6761610000e5eb7e12cff06a7e7e7a60a41bcd',
    spotify_url: 'https://open.spotify.com/artist/37BAm9SFMmFBFoV5VjdUGm',
    uri: 'spotify:artist:37BAm9SFMmFBFoV5VjdUGm',
    type: 'artist',
    external_urls: { spotify: 'https://open.spotify.com/artist/37BAm9SFMmFBFoV5VjdUGm' },
    labelId: BUILDIT_RECORDS_LABEL_ID
  },
  {
    id: '2mpeljBig2IXLXRAFO9AAs',
    name: 'George Lesley',
    image_url: 'https://i.scdn.co/image/ab6761610000e5ebfeecd7551f1dba0a7cb4c16e',
    spotify_url: 'https://open.spotify.com/artist/2mpeljBig2IXLXRAFO9AAs',
    uri: 'spotify:artist:2mpeljBig2IXLXRAFO9AAs',
    type: 'artist',
    external_urls: { spotify: 'https://open.spotify.com/artist/2mpeljBig2IXLXRAFO9AAs' },
    labelId: BUILDIT_RECORDS_LABEL_ID
  },
  {
    id: '4xPodCBfM05BqrPnCCDuFm',
    name: 'Casimann',
    image_url: 'https://i.scdn.co/image/ab6761610000e5eb9de28c1c7c1f7e4c8b7f84b9',
    spotify_url: 'https://open.spotify.com/artist/4xPodCBfM05BqrPnCCDuFm',
    uri: 'spotify:artist:4xPodCBfM05BqrPnCCDuFm',
    type: 'artist',
    external_urls: { spotify: 'https://open.spotify.com/artist/4xPodCBfM05BqrPnCCDuFm' },
    labelId: BUILDIT_RECORDS_LABEL_ID
  }
];

/**
 * Real releases data with different types (single, album, compilation, EP)
 */
export const fallbackReleases: Release[] = [
  // Single
  {
    id: '7Fsl2iDvkXZpQTF1PuKxXO',
    name: 'You Never Know',
    title: 'You Never Know',
    type: 'single',
    external_urls: { spotify: 'https://open.spotify.com/album/7Fsl2iDvkXZpQTF1PuKxXO' },
    release_date: '2020-09-28',
    total_tracks: 1,
    album_type: 'single',
    uri: 'spotify:album:7Fsl2iDvkXZpQTF1PuKxXO',
    images: [
      {
        url: 'https://i.scdn.co/image/ab67616d0000b2734bec23eaf5ffc57f6b1cff7d',
        height: 640,
        width: 640
      }
    ],
    artists: [
      {
        id: '37BAm9SFMmFBFoV5VjdUGm',
        name: 'Monsieur Minimal',
        uri: 'spotify:artist:37BAm9SFMmFBFoV5VjdUGm',
        type: 'artist',
        external_urls: { spotify: 'https://open.spotify.com/artist/37BAm9SFMmFBFoV5VjdUGm' },
        spotify_url: 'https://open.spotify.com/artist/37BAm9SFMmFBFoV5VjdUGm'
      }
    ],
    label: BUILDIT_RECORDS_LABEL_ID,
    label_id: BUILDIT_RECORDS_LABEL_ID,
    artwork_url: 'https://i.scdn.co/image/ab67616d0000b2734bec23eaf5ffc57f6b1cff7d'
  },
  
  // EP
  {
    id: '5i1Ov3Uw8mbk0Keik0h8qj',
    name: 'Ambient Series EP',
    title: 'Ambient Series EP',
    type: 'album',
    external_urls: { spotify: 'https://open.spotify.com/album/5i1Ov3Uw8mbk0Keik0h8qj' },
    release_date: '2021-05-15',
    total_tracks: 4,
    album_type: 'single', // Spotify classifies EPs as "single"
    uri: 'spotify:album:5i1Ov3Uw8mbk0Keik0h8qj',
    images: [
      {
        url: 'https://i.scdn.co/image/ab67616d0000b273e2de2ec0f5d9c9a1e6b0d647',
        height: 640,
        width: 640
      }
    ],
    artists: [
      {
        id: '2mpeljBig2IXLXRAFO9AAs',
        name: 'George Lesley',
        uri: 'spotify:artist:2mpeljBig2IXLXRAFO9AAs',
        type: 'artist',
        external_urls: { spotify: 'https://open.spotify.com/artist/2mpeljBig2IXLXRAFO9AAs' },
        spotify_url: 'https://open.spotify.com/artist/2mpeljBig2IXLXRAFO9AAs'
      }
    ],
    label: BUILDIT_RECORDS_LABEL_ID,
    label_id: BUILDIT_RECORDS_LABEL_ID,
    artwork_url: 'https://i.scdn.co/image/ab67616d0000b273e2de2ec0f5d9c9a1e6b0d647'
  },
  
  // Album
  {
    id: '1yUbD38zXuKr1SeZkOTbU9',
    name: 'Nessun Dorma',
    title: 'Nessun Dorma',
    type: 'album',
    external_urls: { spotify: 'https://open.spotify.com/album/1yUbD38zXuKr1SeZkOTbU9' },
    release_date: '2020-10-29',
    total_tracks: 10,
    album_type: 'album',
    uri: 'spotify:album:1yUbD38zXuKr1SeZkOTbU9',
    images: [
      {
        url: 'https://i.scdn.co/image/ab67616d0000b273ef4d02a8e8782baced0e770c',
        height: 640,
        width: 640
      }
    ],
    artists: [
      {
        id: '4xPodCBfM05BqrPnCCDuFm',
        name: 'Casimann',
        uri: 'spotify:artist:4xPodCBfM05BqrPnCCDuFm',
        type: 'artist',
        external_urls: { spotify: 'https://open.spotify.com/artist/4xPodCBfM05BqrPnCCDuFm' },
        spotify_url: 'https://open.spotify.com/artist/4xPodCBfM05BqrPnCCDuFm'
      }
    ],
    label: BUILDIT_RECORDS_LABEL_ID,
    label_id: BUILDIT_RECORDS_LABEL_ID,
    artwork_url: 'https://i.scdn.co/image/ab67616d0000b273ef4d02a8e8782baced0e770c'
  },
  
  // Compilation
  {
    id: '3Gt7rOjcZQoHCfnKl5AkK7',
    name: 'BuildIt Records: Best of 2022',
    title: 'BuildIt Records: Best of 2022',
    type: 'compilation',
    external_urls: { spotify: 'https://open.spotify.com/album/3Gt7rOjcZQoHCfnKl5AkK7' },
    release_date: '2022-12-15',
    total_tracks: 15,
    album_type: 'compilation',
    uri: 'spotify:album:3Gt7rOjcZQoHCfnKl5AkK7',
    images: [
      {
        url: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5',
        height: 640,
        width: 640
      }
    ],
    artists: [
      {
        id: '37BAm9SFMmFBFoV5VjdUGm',
        name: 'Monsieur Minimal',
        uri: 'spotify:artist:37BAm9SFMmFBFoV5VjdUGm',
        type: 'artist',
        external_urls: { spotify: 'https://open.spotify.com/artist/37BAm9SFMmFBFoV5VjdUGm' },
        spotify_url: 'https://open.spotify.com/artist/37BAm9SFMmFBFoV5VjdUGm'
      },
      {
        id: '2mpeljBig2IXLXRAFO9AAs',
        name: 'George Lesley',
        uri: 'spotify:artist:2mpeljBig2IXLXRAFO9AAs',
        type: 'artist',
        external_urls: { spotify: 'https://open.spotify.com/artist/2mpeljBig2IXLXRAFO9AAs' },
        spotify_url: 'https://open.spotify.com/artist/2mpeljBig2IXLXRAFO9AAs'
      },
      {
        id: '4xPodCBfM05BqrPnCCDuFm',
        name: 'Casimann',
        uri: 'spotify:artist:4xPodCBfM05BqrPnCCDuFm',
        type: 'artist',
        external_urls: { spotify: 'https://open.spotify.com/artist/4xPodCBfM05BqrPnCCDuFm' },
        spotify_url: 'https://open.spotify.com/artist/4xPodCBfM05BqrPnCCDuFm'
      }
    ],
    label: BUILDIT_RECORDS_LABEL_ID,
    label_id: BUILDIT_RECORDS_LABEL_ID,
    artwork_url: 'https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5'
  }
];

/**
 * Filter releases by label ID
 * @param labelId Label ID to filter by
 * @returns Filtered releases
 */
export const getReleasesByLabel = (labelId: string): Release[] => {
  // Return all releases if no label ID is provided (or if it's the BuildIt Records ID)
  if (!labelId || labelId === BUILDIT_RECORDS_LABEL_ID) {
    return fallbackReleases;
  }
  
  // Otherwise filter by label ID
  return fallbackReleases.filter(release => 
    release.label_id === labelId || 
    release.labelId === labelId || 
    (release.label && release.label.toString() === labelId)
  );
};

/**
 * Filter artists by label ID
 * @param labelId Label ID to filter by
 * @returns Filtered artists
 */
export const getArtistsByLabel = (labelId: string): Artist[] => {
  // Return all artists if no label ID is provided (or if it's the BuildIt Records ID)
  if (!labelId || labelId === BUILDIT_RECORDS_LABEL_ID) {
    return fallbackArtists;
  }
  
  // Otherwise filter by label ID
  return fallbackArtists.filter(artist => 
    artist.label_id === labelId || 
    artist.labelId === labelId
  );
};
