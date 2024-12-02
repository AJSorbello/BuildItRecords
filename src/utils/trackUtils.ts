import { Track } from '../types/track';
import { getData } from './dataInitializer';
import { RECORD_LABELS } from '../constants/labels';

export const getTracksByLabel = (label: typeof RECORD_LABELS[keyof typeof RECORD_LABELS]): Track[] => {
  const { tracks } = getData();
  return tracks.filter(track => track.recordLabel === label);
};

export const getSpotifyAlbumArt = (spotifyUrl: string): string => {
  // For now, return a placeholder image
  // In a real implementation, this would parse the Spotify URL and fetch the album art
  return `https://via.placeholder.com/300x300.png?text=${encodeURIComponent('Album Art')}`;
};
