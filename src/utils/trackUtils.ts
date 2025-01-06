import { Track, Artist, Album, SpotifyTrack, SpotifyArtist, SpotifyAlbum, RecordLabel } from '../types';
import { RECORD_LABELS, getLabelByName } from '../constants/labels';
import { spotifyService } from '../services/spotify';

// Cache for tracks
const trackCache = new Map<string, Track[]>();

const log = (message: string, level: 'info' | 'error' = 'info') => {
  if (process.env.NODE_ENV !== 'production') {
    console[level](message);
  }
};

export const PLACEHOLDER_IMAGE = '/placeholder-track.png';

export const isTrack = (obj: any): obj is Track => {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.artists) &&
    typeof obj.duration_ms === 'number' &&
    typeof obj.uri === 'string'
  );
};

// Get tracks for a specific label
export const getTracksForLabel = async (label: string): Promise<Track[]> => {
  // Check cache first
  if (trackCache.has(label)) {
    return trackCache.get(label) || [];
  }

  try {
    const spotifyTracks = await spotifyService.getTracksByLabel(label);
    const tracks = transformTracks(spotifyTracks);
    trackCache.set(label, tracks);
    return tracks;
  } catch (error) {
    log(`Error fetching tracks for label ${label}:`, 'error');
    return [];
  }
};

// Convert SpotifyTrack to Track
export const convertToTrack = (spotifyTrack: SpotifyTrack): Track => ({
  id: spotifyTrack.id,
  name: spotifyTrack.name,
  title: spotifyTrack.name,
  type: 'track',
  artists: spotifyTrack.artists.map(artist => ({
    id: artist.id,
    name: artist.name,
    uri: artist.uri,
    external_urls: { spotify: artist.external_urls.spotify },
    spotifyUrl: artist.external_urls.spotify,
    type: 'artist',
  })),
  duration_ms: spotifyTrack.duration_ms,
  preview_url: spotifyTrack.preview_url,
  external_urls: { spotify: spotifyTrack.external_urls.spotify },
  external_ids: spotifyTrack.external_ids || {},
  uri: spotifyTrack.uri,
  album: spotifyTrack.album
    ? {
        ...spotifyTrack.album,
        spotifyUrl: spotifyTrack.album.external_urls.spotify || '',
      }
    : {
        id: '',
        name: 'Unknown Album',
        artists: [],
        images: [],
        release_date: '',
        release_date_precision: 'day',
        total_tracks: 0,
        external_urls: { spotify: '' },
        uri: '',
        type: 'album',
        spotifyUrl: '',
      },
  popularity: spotifyTrack.popularity || 0,
  releaseDate: spotifyTrack.album?.release_date || '',
  spotifyUrl: spotifyTrack.external_urls.spotify,
  images: spotifyTrack.album?.images || [],
  artworkUrl: spotifyTrack.album?.images?.[0]?.url,
});


// Transform SpotifyTrack[] to Track[]
export const transformTracks = (spotifyTracks: SpotifyTrack[]): Track[] => {
  return spotifyTracks.map(convertToTrack);
};

// Get tracks by label
export const getTracksByLabel = (tracks: Track[], label: RecordLabel): Track[] => {
  return tracks.filter(track => track.label?.id === label.id);
};

// Transform artists
export const transformArtists = (artists: SpotifyArtist[]): Artist[] => {
  return artists.map(artist => ({
    id: artist.id,
    name: artist.name,
    uri: artist.uri,
    external_urls: { spotify: artist.external_urls.spotify },
    spotifyUrl: artist.external_urls.spotify,
    spotify_url: artist.external_urls.spotify,
    type: 'artist'
  }));
};

// Get track artwork URL
export const getTrackImage = (track: Track): string => {
  if (track.artworkUrl) {
    return track.artworkUrl;
  }
  
  if (track.images && track.images.length > 0) {
    return track.images[0].url;
  }
  
  if (track.album?.images && track.album.images.length > 0) {
    return track.album.images[0].url;
  }
  
  return PLACEHOLDER_IMAGE;
};

// Get artist names as string
export const getArtistNames = (track: Track): string => {
  if (!track.artists || track.artists.length === 0) {
    return 'Unknown Artist';
  }
  return track.artists.map(artist => artist.name).join(', ');
};

// Format track duration
export const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
};

// Sort tracks by date
export const sortTracksByDate = (tracks: Track[]): Track[] => {
  return [...tracks].sort((a, b) => {
    const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
    const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
    return dateB - dateA;
  });
};

// Filter tracks by label
export const filterTracksByLabel = (tracks: Track[], labelId: string): Track[] => {
  return tracks.filter(track => track.label?.id === labelId);
};

// Refresh the track cache
export const refreshTrackCache = async (): Promise<void> => {
  try {
    // Clear existing cache
    trackCache.clear();

    // Fetch tracks for all labels
    const labels = Object.values(RECORD_LABELS);
    await Promise.all(
      labels.map(async (label) => {
        const spotifyTracks = await spotifyService.getTracksByLabel(label.id || label.name);
        const tracks = transformTracks(spotifyTracks);
        trackCache.set(label, tracks);
      })
    );

    log('Track cache refreshed successfully');
  } catch (error) {
    log('Error refreshing track cache:', 'error');
    throw error;
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

export const createTrack = (data: Partial<Track>): Track => {
  if (!data.id || !data.name) {
    throw new Error('Track must have an id and name');
  }

  return {
    id: data.id,
    name: data.name,
    title: data.title || data.name,
    artists: data.artists || [],
    duration_ms: data.duration_ms || 0,
    preview_url: data.preview_url || null,
    external_urls: data.external_urls || { spotify: '' },
    external_ids: data.external_ids || {},
    uri: data.uri || `spotify:track:${data.id}`,
    album: data.album || {
      id: '',
      name: '',
      artists: [],
      images: [],
      release_date: '',
      release_date_precision: 'day',
      total_tracks: 0,
      external_urls: { spotify: '' },
      uri: '',
      type: 'album',
      spotifyUrl: ''
    },
    popularity: data.popularity || 0,
    releaseDate: data.releaseDate || new Date().toISOString(),
    spotifyUrl: data.spotifyUrl || `https://open.spotify.com/track/${data.id}`,
    images: data.images || [],
    artworkUrl: data.artworkUrl || PLACEHOLDER_IMAGE,
    label: data.label,
    recordLabel: data.recordLabel,
    featured: data.featured || false
  };
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
