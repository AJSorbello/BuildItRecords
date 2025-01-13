import { Track, Artist, Album, SpotifyTrack, SpotifyArtist, SpotifyAlbum, RecordLabel, Label, Release } from '../types';
import { RECORD_LABELS, getLabelByName } from '../constants/labels';
import { spotifyService } from '../services/spotify';

// Cache for tracks
const trackCache = new Map<string, Track[]>();

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

// Get tracks for a specific label
export const getTracksForLabel = async (labelId: string): Promise<Track[]> => {
  try {
    // Check cache first
    const cachedTracks = trackCache.get(labelId);
    if (cachedTracks) {
      return cachedTracks;
    }

    // Fetch from Spotify if not in cache
    const spotifyTracks = await spotifyService.getTracksByLabel(labelId);
    const tracks = formatSpotifyTracks(spotifyTracks);
    trackCache.set(labelId, tracks);
    return tracks;
  } catch (error) {
    log(`Error getting tracks for label ${labelId}: ${error}`, 'error');
    return [];
  }
};

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.padStart(2, '0')}`;
}

export const formatSpotifyArtist = (spotifyArtist: any): Artist => {
  return {
    id: spotifyArtist.id,
    name: spotifyArtist.name,
    external_urls: spotifyArtist.external_urls,
    images: spotifyArtist.images,
    followers: spotifyArtist.followers,
    type: spotifyArtist.type,
    uri: spotifyArtist.uri
  };
};

export const formatSpotifyAlbum = (spotifyAlbum: any): Album => {
  return {
    id: spotifyAlbum.id,
    name: spotifyAlbum.name,
    type: spotifyAlbum.type,
    external_urls: spotifyAlbum.external_urls,
    images: spotifyAlbum.images,
    release_date: spotifyAlbum.release_date,
    artists: spotifyAlbum.artists.map(formatSpotifyArtist),
    uri: spotifyAlbum.uri,
    total_tracks: spotifyAlbum.total_tracks
  };
};

export const formatSpotifyTrack = (spotifyTrack: SpotifyTrack): Track => {
  return {
    id: spotifyTrack.id,
    name: spotifyTrack.name,
    artists: spotifyTrack.artists.map(formatSpotifyArtist),
    duration_ms: spotifyTrack.duration_ms,
    preview_url: spotifyTrack.preview_url,
    external_urls: spotifyTrack.external_urls,
    external_ids: spotifyTrack.external_ids,
    album: formatSpotifyAlbum(spotifyTrack.album),
    uri: spotifyTrack.uri,
    type: spotifyTrack.type,
    spotify_url: spotifyTrack.external_urls.spotify
  };
};

export const formatSpotifyTracks = (spotifyTracks: SpotifyTrack[]): Track[] => {
  return spotifyTracks.map(formatSpotifyTrack);
};

export const formatTrackForLabel = (track: Track, label: Label): Track => {
  return {
    ...track,
    release: {
      id: track.album.id,
      name: track.album.name,
      artists: track.artists,
      release_date: track.album.release_date,
      album: track.album,
      tracks: [track],
      external_urls: track.external_urls,
      artwork_url: track.album.images[0]?.url,
      spotifyUrl: track.external_urls.spotify,
      preview_url: track.preview_url,
      uri: track.uri,
      primaryArtist: track.artists[0]
    }
  };
};

// Get tracks by label
export const getTracksByLabel = (tracks: Track[], labelId: string): Track[] => {
  return tracks.filter(track => track.label?.id === labelId);
};

// Get track artwork URL
export const getTrackImage = (track: Track): string => {
  if (track.images && track.images.length > 0) {
    return track.images[0].url;
  }
  if (track.album?.images && track.album.images.length > 0) {
    return track.album.images[0].url;
  }
  return track.artworkUrl || PLACEHOLDER_IMAGE;
};

export function getArtistNames(track: Track): string {
  return track.artists.map(artist => artist.name).join(', ');
}

// Sort tracks by date
export function sortTracksByDate(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => {
    const dateA = a.album?.release_date || '';
    const dateB = b.album?.release_date || '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });
};

// Filter tracks by label
export const filterTracksByLabel = (tracks: Track[], labelId: string): Track[] => {
  return tracks.filter(track => track.label?.id === labelId);
};

// Create a track from partial data
export const createTrack = (data: Partial<Track>): Track => {
  return {
    id: data.id || '',
    name: data.name || '',
    duration_ms: data.duration_ms || 0,
    preview_url: data.preview_url || null,
    external_urls: data.external_urls || { spotify: '' },
    uri: data.uri || '',
    type: 'track',
    artists: data.artists || [],
    album: data.album,
    popularity: data.popularity,
    external_ids: data.external_ids || {},
    spotifyUrl: data.spotifyUrl || '',
    label: data.label,
    recordLabel: data.recordLabel
  } as Track;
};

// Utility function to validate date strings
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// Get track date with validation
export const getTrackDate = (track: Track): string | undefined => {
  const date = track.releaseDate || track.album?.release_date;
  return date && isValidDate(date) ? date : undefined;
};

// Sort tracks by popularity
export const sortTracksByPopularity = (tracks: Track[]): Track[] => {
  return [...tracks].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
};

// Refresh the track cache
export const refreshTrackCache = async (): Promise<void> => {
  try {
    const labels = RECORD_LABELS;
    await Promise.all(
      labels.map(async (label) => {
        const labelId = label.id || label.name;
        const spotifyTracks = await spotifyService.getTracksByLabel(labelId);
        const tracks = formatSpotifyTracks(spotifyTracks);
        trackCache.set(labelId, tracks);
      })
    );
  } catch (error) {
    log(`Error refreshing track cache: ${error}`, 'error');
  }
};

// Get all tracks from cache
export const getAllTracks = (): Track[] => {
  return Array.from(trackCache.values()).flat();
};

// Search tracks by name
export const searchTracks = (query: string): Track[] => {
  const normalizedQuery = query.toLowerCase();
  return getAllTracks().filter(track => 
    track.name.toLowerCase().includes(normalizedQuery) ||
    track.artists.some(artist => artist.name.toLowerCase().includes(normalizedQuery))
  );
};

// Get track by ID
export const getTrackById = (id: string): Track | undefined => {
  return getAllTracks().find(track => track.id === id);
};

// Get tracks by artist
export const getTracksByArtist = (artistId: string): Track[] => {
  return getAllTracks().filter(track => 
    track.artists.some(artist => artist.id === artistId)
  );
};

// Get tracks by album
export const getTracksByAlbum = (albumId: string): Track[] => {
  return getAllTracks().filter(track => track.album && track.album.id === albumId);
};

// Initialize the track cache
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

export const getTrackLabel = (track: Track) => {
  if (!isTrack(track)) {
    log('Invalid track data in getTrackLabel', 'error');
    return undefined;
  }

  if (track.label) {
    return track.label;
  }
  
  if (track.recordLabel) {
    return getLabelByName(track.recordLabel);
  }
  
  return undefined;
};

// Load tracks for all labels
export const loadAllTracks = async (labels: Label[]) => {
  try {
    await Promise.all(
      labels.map(async (label) => {
        const labelId = label.id || label.name;
        const spotifyTracks = await spotifyService.getTracksByLabel(labelId);
        const tracks = formatSpotifyTracks(spotifyTracks);
        trackCache.set(labelId, tracks);
      })
    );
  } catch (error) {
    console.error('Error loading tracks:', error);
    throw error;
  }
};

// Get tracks for a specific label
export const getTracksByLabelId = (labelId: string): Track[] => {
  return trackCache.get(labelId) || [];
};

// Clear the track cache
export const clearTrackCache = () => {
  trackCache.clear();
};
