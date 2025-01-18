import type { Track, TrackDetails, Artist as TrackArtist } from '../types/track';
import type { Artist } from '../types/artist';
import type { Album } from '../types/album';
import type { SpotifyTrack, SpotifyArtist, SpotifyAlbum } from '../types/spotify';
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
  if (ms <= 0) return '0:00';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const convertSpotifyTrackToTrack = (spotifyTrack: SpotifyTrack): Track => {
  return {
    id: spotifyTrack.id,
    name: spotifyTrack.name,
    artists: spotifyTrack.artists.map(artist => ({
      id: artist.id,
      name: artist.name,
      external_urls: artist.external_urls,
      uri: artist.uri,
      type: 'artist',
      images: artist.images || [],
      followers: artist.followers || { href: null, total: 0 },
      genres: artist.genres || [],
      popularity: artist.popularity || 0
    })),
    duration: spotifyTrack.duration_ms,
    track_number: spotifyTrack.track_number,
    disc_number: spotifyTrack.disc_number,
    preview_url: spotifyTrack.preview_url,
    spotify_url: spotifyTrack.external_urls.spotify,
    spotify_uri: spotifyTrack.uri,
    release: {
      id: spotifyTrack.album.id,
      name: spotifyTrack.album.name,
      release_date: spotifyTrack.album.release_date,
      images: spotifyTrack.album.images?.map(img => ({
        url: img.url,
        height: img.height || 0,
        width: img.width || 0
      })) || [],
      external_urls: spotifyTrack.album.external_urls,
      uri: spotifyTrack.album.uri,
      artists: spotifyTrack.album.artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        external_urls: artist.external_urls,
        uri: artist.uri,
        type: 'artist',
        images: artist.images || [],
        followers: artist.followers || { href: null, total: 0 },
        genres: artist.genres || [],
        popularity: artist.popularity || 0
      })),
      total_tracks: spotifyTrack.album.total_tracks,
      label_id: 'buildit-records' // Default to main label
    },
    created_at: new Date(),
    updated_at: new Date()
  };
};

export const formatSpotifyArtist = (artist: SpotifyArtist): Artist => ({
  id: artist.id,
  name: artist.name,
  external_urls: artist.external_urls,
  uri: artist.uri,
  type: 'artist',
  images: artist.images || [],
  followers: artist.followers || { href: null, total: 0 },
  genres: artist.genres || [],
  popularity: artist.popularity || 0
});

export const getTrackLabel = (track: Track): RecordLabelId | undefined => {
  return track.release?.label_id as RecordLabelId;
};

export const getTracksByLabel = async (labelId: RecordLabelId): Promise<Track[]> => {
  try {
    const tracks = await spotifyService.getPlaylistTracks(labelId);
    return tracks.map(track => convertSpotifyTrackToTrack(track));
  } catch (error) {
    console.error(`Error getting tracks for label ${labelId}:`, error);
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
    await Promise.all(
      Object.values(RECORD_LABELS).map(async (label: RecordLabel) => {
        const tracks = await getTracksByLabel(label.id as RecordLabelId);
        trackCache.set(label.id as RecordLabelId, tracks);
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
  const tracks = getAllTracks();
  const lowerQuery = query.toLowerCase();
  return tracks.filter(track =>
    track.name.toLowerCase().includes(lowerQuery) ||
    track.artists?.some(artist => artist.name.toLowerCase().includes(lowerQuery))
  );
};

export const getTrackById = (id: string): Track | undefined => {
  const tracks = getAllTracks();
  return tracks.find(track => track.id === id);
};

export const getTracksByArtist = (artistId: string): Track[] => {
  const tracks = getAllTracks();
  return tracks.filter(track =>
    track.artists?.some(artist => artist.id === artistId)
  );
};

export const getTracksByAlbumId = (releaseId: string): Track[] => {
  return getAllTracks().filter(track => track.release?.id === releaseId);
};

export const getTrackArtists = (track: Track): string => {
  return track.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist';
};

export const getTrackImage = (track: Track): string => {
  if (!track.release) return PLACEHOLDER_IMAGE;
  const release = track.release;
  return release.images?.[0]?.url || PLACEHOLDER_IMAGE;
};

export const getTrackSpotifyUrl = (track: any): string => {
  return track?.spotify_url || track?.external_urls?.spotify || '';
};

export const getTrackReleaseDate = (track: any): string => {
  if (!track?.release?.release_date) return '';
  return new Date(track.release.release_date).toLocaleDateString();
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
