import { Track } from '../types/track';
import { getData } from './dataInitializer';
import { RECORD_LABELS } from '../constants/labels';

export const getTracksByLabel = (label: typeof RECORD_LABELS[keyof typeof RECORD_LABELS]): Track[] => {
  const { tracks } = getData();
  return tracks.filter(track => track.label === label);
};

export const getFeaturedTrack = (label: typeof RECORD_LABELS[keyof typeof RECORD_LABELS]): Track | null => {
  const { tracks } = getData();
  const labelTracks = tracks.filter(track => track.label === label);
  // Find the track marked as featured, or return null if none found
  return labelTracks.find(track => track.featured) || null;
};

export const getSpotifyAlbumArt = (spotifyUrl: string): string => {
  // For now, return a placeholder image
  // In a real implementation, this would parse the Spotify URL and fetch the album art
  return `https://via.placeholder.com/300x300.png?text=${encodeURIComponent('Album Art')}`;
};

export const processTracksEfficiently = (tracks: Track[]): Track[] => {
  // Sort tracks by release date (newest first)
  return [...tracks].sort((a, b) => {
    const dateA = a.releaseDate ? new Date(a.releaseDate) : new Date(0);
    const dateB = b.releaseDate ? new Date(b.releaseDate) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
};
