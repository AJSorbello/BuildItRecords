import type { Track } from '../types/track';
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

export const isTrack = (obj: unknown): obj is Track => {
  return obj && typeof obj === 'object' && 
    'id' in obj && 
    'title' in obj && 
    'artists' in obj && 
    Array.isArray(obj.artists);
};

const convertSpotifyTrackToTrack = (spotifyTrack: SpotifyTrack): Track => {
  return {
    id: spotifyTrack.id,
    title: spotifyTrack.name,
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
    external_urls: spotifyTrack.external_urls,
    uri: spotifyTrack.uri,
    album: {
      id: spotifyTrack.album.id,
      title: spotifyTrack.album.name,
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

export const formatSpotifyTrack = convertSpotifyTrackToTrack;

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

export const formatSpotifyAlbum = (album: SpotifyAlbum): Album => ({
  id: album.id,
  title: album.name,
  release_date: album.release_date,
  images: album.images?.map(img => ({
    url: img.url,
    height: img.height || 0,
    width: img.width || 0
  })) || [],
  external_urls: album.external_urls,
  uri: album.uri,
  artists: album.artists.map(formatSpotifyArtist),
  total_tracks: album.total_tracks,
  label_id: 'buildit-records' // Default to main label
});

export const getTrackLabel = (track: Track): RecordLabelId | undefined => {
  return track.album?.label_id as RecordLabelId;
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

export const searchTracks = (query: string, tracks: Track[]): Track[] => {
  const lowerQuery = query.toLowerCase();
  return tracks.filter(track =>
    track.title.toLowerCase().includes(lowerQuery) ||
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
  return getAllTracks().filter(track => track.album?.id === releaseId);
};

export const getTrackArtists = (track: Track): string => {
  return track.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist';
};

export const getTrackImage = (track: Track): string => {
  if (!track.album) return PLACEHOLDER_IMAGE;
  const album = track.album;
  return album.images?.[0]?.url || PLACEHOLDER_IMAGE;
};

export const getTrackSpotifyUrl = (track: Track): string => {
  return track.external_urls?.spotify || '#';
};

export const getTrackReleaseDate = (track: Track): string => {
  return track.album?.release_date || '';
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
