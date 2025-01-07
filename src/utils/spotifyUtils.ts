import type { Track } from '../types/track';
import type { Artist } from '../types/artist';
import type { Album } from '../types/release';
import type { SpotifyImage } from '../types/spotify';

interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
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
  name: track.name,
  uri: track.uri,
  type: 'track',
  artists: track.artists.map(artist => ({
    id: artist.id,
    name: artist.name,
    uri: artist.uri,
    external_urls: artist.external_urls
  })),
  album: {
    id: track.album.id,
    name: track.album.name,
    images: track.album.images,
    release_date: track.album.release_date
  },
  duration_ms: track.duration_ms,
  preview_url: track.preview_url,
  external_urls: track.external_urls,
  external_ids: track.external_ids,
  popularity: track.popularity,
  spotifyUrl: track.external_urls.spotify,
  releaseDate: track.album.release_date
});

// Convert a Spotify artist to our Artist type
export const transformSpotifyArtist = (spotifyArtist: SpotifyArtist): Artist => {
  return {
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    uri: spotifyArtist.uri,
    external_urls: spotifyArtist.external_urls,
    spotifyUrl: spotifyArtist.external_urls.spotify,
    type: 'artist',
    images: [],
    genres: [],
    popularity: undefined
  };
};

// Convert a Spotify album to our Album type
export const transformSpotifyAlbum = (spotifyAlbum: SpotifyAlbum): Album => {
  return {
    id: spotifyAlbum.id,
    name: spotifyAlbum.name,
    artists: spotifyAlbum.artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      uri: artist.uri,
      external_urls: artist.external_urls,
      spotifyUrl: artist.external_urls.spotify,
      type: 'artist'
    })),
    release_date: spotifyAlbum.release_date,
    release_date_precision: '',
    total_tracks: 0,
    uri: spotifyAlbum.uri,
    external_urls: spotifyAlbum.external_urls,
    images: spotifyAlbum.images,
    type: spotifyAlbum.album_type === 'single' ? 'single' : 'album',
    spotifyUrl: spotifyAlbum.external_urls.spotify
  };
};

export const extractSpotifyId = (url: string): string | null => {
  // Handle both track and album URLs
  const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
  const albumMatch = url.match(/album\/([a-zA-Z0-9]+)/);
  return trackMatch?.[1] || albumMatch?.[1] || null;
};

export const isValidSpotifyUrl = (url: string): boolean => {
  const spotifyUrlPattern = /^https:\/\/open\.spotify\.com\/(track|album)\/[a-zA-Z0-9]+(\?.*)?$/;
  return spotifyUrlPattern.test(url);
};

export const normalizeSpotifyUrl = (url: string): string => {
  const id = extractSpotifyId(url);
  if (!id) return url;
  // Always normalize to track URL format
  return `https://open.spotify.com/track/${id}`;
};
