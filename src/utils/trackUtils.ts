import { Track } from '../types/track';
import { getTracksByLabel } from './spotifyUtils';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';

// Cache for tracks
const trackCache = new Map<string, Track[]>();

// Get tracks for a specific label
export const getTracksForLabel = async (label: string): Promise<Track[]> => {
  // Check cache first
  if (trackCache.has(label)) {
    return trackCache.get(label) || [];
  }

  try {
    const tracks = await getTracksByLabel(label);
    trackCache.set(label, tracks);
    return tracks;
  } catch (error) {
    console.error(`Error fetching tracks for label ${label}:`, error);
    return [];
  }
};

// Refresh the track cache
export const refreshTrackCache = async (): Promise<void> => {
  try {
    // Clear existing cache
    trackCache.clear();

    // Fetch tracks for all labels
    await Promise.all(
      Object.values(RECORD_LABELS).map(async (label) => {
        const tracks = await getTracksByLabel(label);
        trackCache.set(label, tracks);
      })
    );

    console.log('Track cache refreshed successfully');
  } catch (error) {
    console.error('Error refreshing track cache:', error);
    throw error;
  }
};

// Get all tracks from cache
export const getAllTracks = (): Track[] => {
  return Array.from(trackCache.values()).flat();
};

// Search tracks by name
export const searchTracks = (query: string): Track[] => {
  const allTracks = getAllTracks();
  const searchTerms = query.toLowerCase().split(' ');
  
  return allTracks.filter(track => {
    const trackText = `${track.name} ${track.artists.map(a => a.name).join(' ')}`.toLowerCase();
    return searchTerms.every(term => trackText.includes(term));
  });
};

// Get track by ID
export const getTrackById = (id: string): Track | undefined => {
  const allTracks = getAllTracks();
  return allTracks.find(track => track.id === id);
};

// Get tracks by artist
export const getTracksByArtist = (artistId: string): Track[] => {
  const allTracks = getAllTracks();
  return allTracks.filter(track => 
    track.artists.some(artist => artist.id === artistId)
  );
};

// Get tracks by album
export const getTracksByAlbum = (albumId: string): Track[] => {
  const allTracks = getAllTracks();
  return allTracks.filter(track => track.album.id === albumId);
};

// Initialize the track cache
export const initializeTrackCache = async (): Promise<void> => {
  try {
    await refreshTrackCache();
    console.log('Track cache initialized successfully');
  } catch (error) {
    console.error('Error initializing track cache:', error);
    throw error;
  }
};
