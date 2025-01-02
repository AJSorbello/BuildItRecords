import { Artist } from '../types/artist';
import { Track } from '../types/track';
import { Release, Album } from '../types/release';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';
import { ClientCredentialsStrategy, SpotifyApi } from '@spotify/web-api-ts-sdk';

// Initialize the Spotify API client
const authStrategy = new ClientCredentialsStrategy(
  process.env.REACT_APP_SPOTIFY_CLIENT_ID || '',
  process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || ''
);

export const spotifyApi = new SpotifyApi(authStrategy);

// Define our interfaces
export interface SpotifyTrack {
  album: SpotifyAlbum;
  popularity?: number;
  external_ids?: { isrc: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
    uri: string;
    external_urls: {
      spotify: string;
    };
  }>;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  release_date: string;
  release_date_precision: 'day' | 'month' | 'year';
  total_tracks: number;
  external_urls: {
    spotify: string;
  };
  external_ids: {
    upc?: string;
  };
  genres: string[];
  href: string;
  label: string;
  uri: string;
  tracks?: {
    items: SpotifyTrack[];
  };
  popularity?: number;
  album_group?: string;
  album_type: 'album' | 'single' | 'compilation';
  available_markets?: string[];
  copyrights?: Array<{
    text: string;
    type: string;
  }>;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
  external_urls: {
    spotify: string;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  genres: string[];
  followers: {
    href: string | null;
    total: number;
  };
  popularity: number;
}

export const transformSpotifyTrack = (spotifyTrack: SpotifyTrack): Track => {
  return {
    id: spotifyTrack.id,
    name: spotifyTrack.name,
    title: spotifyTrack.name,
    artists: spotifyTrack.artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      uri: artist.uri
    })),
    duration_ms: spotifyTrack.duration_ms,
    preview_url: spotifyTrack.preview_url,
    external_urls: spotifyTrack.external_urls,
    external_ids: spotifyTrack.external_ids || { isrc: '' },
    uri: spotifyTrack.uri,
    album: transformSpotifyAlbum(spotifyTrack.album),
    popularity: spotifyTrack.popularity || 0,
    releaseDate: spotifyTrack.album.release_date,
    artworkUrl: spotifyTrack.album.images[0]?.url || '',
    spotifyUrl: spotifyTrack.external_urls.spotify
  };
};

export const transformSpotifyArtist = (spotifyArtist: SpotifyArtist): Artist => {
  return {
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    uri: spotifyArtist.uri,
    images: spotifyArtist.images,
    genres: spotifyArtist.genres,
    followers: spotifyArtist.followers,
    popularity: spotifyArtist.popularity,
    external_urls: spotifyArtist.external_urls
  };
};

export const transformSpotifyAlbum = (spotifyAlbum: SpotifyAlbum): Album => {
  return {
    id: spotifyAlbum.id,
    name: spotifyAlbum.name,
    artists: spotifyAlbum.artists,
    images: spotifyAlbum.images,
    release_date: spotifyAlbum.release_date,
    release_date_precision: spotifyAlbum.release_date_precision,
    total_tracks: spotifyAlbum.total_tracks,
    external_urls: spotifyAlbum.external_urls,
    uri: spotifyAlbum.uri,
    type: 'album',
    album_type: spotifyAlbum.album_type
  };
};

export const getTracksByLabel = async (label: string): Promise<Track[]> => {
  try {
    const searchResults = await spotifyApi.search(
      `label:${label}`,
      ['track']
    );

    const tracks = searchResults.tracks.items
      .filter(track => track.album?.label?.toLowerCase() === label.toLowerCase())
      .map(track => transformSpotifyTrack(track as unknown as SpotifyTrack));

    return tracks;
  } catch (error) {
    console.error(`Error fetching tracks for label ${label}:`, error);
    return [];
  }
};
