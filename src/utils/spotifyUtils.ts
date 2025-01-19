import type { Track } from '../types/track';
import type { Artist } from '../types/artist';
import type { Album } from '../types/release';
import type { SpotifyImage } from '../types/spotify';

interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
  images?: SpotifyImage[];
  external_urls: {
    spotify: string;
  };
}

interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
  artists: SpotifyArtist[];
  album_type: string;
  available_markets: string[];
}

interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  external_urls: {
    spotify: string;
  };
  external_ids: {
    [key: string]: string;
  };
  preview_url: string | null;
  popularity: number;
}

// Convert a Spotify track to our Track type
export const transformSpotifyTrack = (track: SpotifyTrack): Track => ({
  id: track.id,
  title: track.title,  // Changed from name to title
  uri: track.uri,
  type: 'track',
  artists: track.artists.map(artist => ({
    id: artist.id,
    name: artist.name,
    uri: artist.uri,
    images: artist.images || [],
    external_urls: artist.external_urls,
    spotifyUrl: artist.external_urls.spotify
  })),
  album: {
    id: track.album.id,
    title: track.album.name,
    images: track.album.images,
    release_date: track.album.release_date,
    artists: track.album.artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      uri: artist.uri,
      images: artist.images || [],
      external_urls: artist.external_urls,
      spotifyUrl: artist.external_urls.spotify
    }))
  },
  duration_ms: track.duration_ms,
  preview_url: track.preview_url,
  external_urls: track.external_urls,
  external_ids: track.external_ids,
  popularity: track.popularity,
  spotifyUrl: track.external_urls.spotify,
  releaseDate: track.album.release_date,
  artistImage: track.artists[0]?.images?.[0]?.url
});

// Convert a Spotify artist to our Artist type
export const transformSpotifyArtist = (spotifyArtist: SpotifyArtist): Artist => ({
  id: spotifyArtist.id,
  name: spotifyArtist.name,
  uri: spotifyArtist.uri,
  images: spotifyArtist.images || [],
  external_urls: spotifyArtist.external_urls,
  spotifyUrl: spotifyArtist.external_urls.spotify
});

// Convert a Spotify album to our Album type
export const transformSpotifyAlbum = (spotifyAlbum: SpotifyAlbum): Album => ({
  id: spotifyAlbum.id,
  name: spotifyAlbum.name,
  images: spotifyAlbum.images,
  release_date: spotifyAlbum.release_date,
  artists: spotifyAlbum.artists.map(artist => ({
    id: artist.id,
    name: artist.name,
    uri: artist.uri,
    images: artist.images || [],
    external_urls: artist.external_urls,
    spotifyUrl: artist.external_urls.spotify
  })),
  album_type: spotifyAlbum.album_type,
  available_markets: spotifyAlbum.available_markets
});

// Extract Spotify ID from URL
export const extractSpotifyId = (url: string): string | null => {
  const match = url.match(/spotify\.com\/.+\/([a-zA-Z0-9]+)$/);
  return match ? match[1] : null;
};

// Check if URL is a valid Spotify URL
export const isValidSpotifyUrl = (url: string): boolean => {
  return /^https:\/\/open\.spotify\.com\/(track|album|artist)\/[a-zA-Z0-9]+$/.test(url);
};

// Normalize Spotify URL
export const normalizeSpotifyUrl = (url: string): string => {
  const id = extractSpotifyId(url);
  if (!id) return url;
  return `https://open.spotify.com/track/${id}`;
};
