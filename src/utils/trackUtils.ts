import type { Track, TrackDetails } from '../types/track';
import type { Artist } from '../types/artist';
import type { Album } from '../types/album';
import type { SpotifyTrack, SpotifyArtist, SpotifyAlbum, SpotifyImage, SpotifyExternalUrls, SpotifyExternalIds } from '../types/spotify';
import type { RecordLabelId } from '../types/labels';
import { RECORD_LABELS } from '../constants/labels';
import { spotifyService } from '../services/SpotifyService';

// Cache for tracks
const trackCache = new Map<RecordLabelId, Track[]>();

function log(message: string, level: 'info' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] ${message}`);
}

export const PLACEHOLDER_IMAGE = '/placeholder-track.png';

export const isTrack = (obj: any): obj is Track => {
  return obj && typeof obj === 'object' && 
    'id' in obj && 
    'name' in obj && 
    'artists' in obj && 
    Array.isArray(obj.artists);
};

export const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const convertSpotifyTrackToTrackDetails = (spotifyTrack: SpotifyTrack): TrackDetails => {
  return {
    id: spotifyTrack.id,
    name: spotifyTrack.name,
    artists: spotifyTrack.artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      uri: artist.uri
    })),
    album: {
      id: spotifyTrack.album.id,
      name: spotifyTrack.album.name,
      release_date: spotifyTrack.album.release_date,
      images: spotifyTrack.album.images,
      uri: spotifyTrack.album.uri
    },
    duration_ms: spotifyTrack.duration_ms,
    uri: spotifyTrack.uri,
    preview_url: spotifyTrack.preview_url
  };
};

export const formatSpotifyTrack = (spotifyTrack: SpotifyTrack): TrackDetails => ({
  id: spotifyTrack.id,
  name: spotifyTrack.name,
  artists: spotifyTrack.artists.map(formatSpotifyArtist),
  album: formatSpotifyAlbum(spotifyTrack.album),
  duration_ms: spotifyTrack.duration_ms,
  preview_url: spotifyTrack.preview_url,
  external_urls: spotifyTrack.external_urls,
  external_ids: spotifyTrack.external_ids,
  uri: spotifyTrack.uri,
  type: 'track',
  track_number: spotifyTrack.track_number,
  disc_number: spotifyTrack.disc_number,
  isrc: spotifyTrack.external_ids.isrc || '',
  images: spotifyTrack.album.images,
  explicit: spotifyTrack.explicit,
  popularity: spotifyTrack.popularity,
  available_markets: spotifyTrack.available_markets || [],
  is_local: spotifyTrack.is_local || false
});

export const formatSpotifyArtist = (artist: SpotifyArtist): Artist => ({
  id: artist.id,
  name: artist.name,
  images: artist.images,
  external_urls: artist.external_urls,
  uri: artist.uri,
  type: artist.type,
  followers: artist.followers,
  genres: artist.genres,
  popularity: artist.popularity
});

export const formatSpotifyAlbum = (album: SpotifyAlbum): Album => ({
  id: album.id,
  name: album.name,
  artists: album.artists.map(formatSpotifyArtist),
  images: album.images,
  release_date: album.release_date,
  release_date_precision: album.release_date_precision,
  total_tracks: album.total_tracks,
  type: album.type,
  external_urls: album.external_urls,
  external_ids: album.external_ids,
  uri: album.uri
});

export const getTrackLabel = (track: Track): RecordLabelId | undefined => {
  return track.label;
};

export const getTracksByLabel = async (label: RecordLabelId): Promise<Track[]> => {
  try {
    const tracks = await spotifyService.getPlaylistTracks(label);
    return tracks.map(track => convertSpotifyTrackToTrackDetails(track));
  } catch (error) {
    console.error(`Error getting tracks for label ${label}:`, error);
    return [];
  }
};

export const getTracksByLabelId = (labelId: RecordLabelId): Track[] => {
  return trackCache.get(labelId) || [];
};

export const clearTrackCache = () => {
  trackCache.clear();
};

export const refreshTrackCache = async (): Promise<void> => {
  try {
    const labels = RECORD_LABELS;
    await Promise.all(
      labels.map(async (label) => {
        const labelId = label.id || label.name;
        const spotifyTracks = await spotifyService.getTracksByLabel(labelId);
        const tracks = spotifyTracks.map(formatSpotifyTrack);
        trackCache.set(labelId, tracks);
      })
    );
  } catch (error) {
    log(`Error refreshing track cache: ${error}`, 'error');
  }
};

export const getAllTracks = (): Track[] => {
  return Array.from(trackCache.values()).flat();
};

export const searchTracks = (query: string): Track[] => {
  const normalizedQuery = query.toLowerCase();
  return getAllTracks().filter(track => 
    track.name.toLowerCase().includes(normalizedQuery) ||
    track.artists.some(artist => artist.name.toLowerCase().includes(normalizedQuery))
  );
};

export const getTrackById = (id: string): Track | undefined => {
  return getAllTracks().find(track => track.id === id);
};

export const getTracksByArtist = (artistId: string): Track[] => {
  return getAllTracks().filter(track => 
    track.artists.some(artist => artist.id === artistId)
  );
};

export const getTracksByAlbum = (albumId: string): Track[] => {
  return getAllTracks().filter(track => track.album && track.album.id === albumId);
};

export const getTrackArtists = (track: Track): string => {
  return track.artists.map(artist => artist.name).join(', ');
};

export const getTrackReleaseDate = (track: Track): string => {
  return track.album.release_date || 'N/A';
};

export const initializeTrackCache = async (): Promise<void> => {
  try {
    if (trackCache.size === 0) {
      await refreshTrackCache();
    }
    log('Track cache initialized successfully');
  } catch (error) {
    log('Error initializing track cache:', 'error');
    throw error;
  }
};
