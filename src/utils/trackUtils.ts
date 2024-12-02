import { Track } from '../types/track';
import { getData } from './dataInitializer';
import { RECORD_LABELS, RecordLabel } from '../constants/labels';

export const getTracksByLabel = (label: RecordLabel): Track[] => {
  try {
    const { tracks } = getData();
    return tracks.filter(track => track.recordLabel === label);
  } catch (error) {
    console.error('Error getting tracks by label:', error);
    return [];
  }
};

export const getSpotifyAlbumArt = (spotifyUrl: string): string => {
  // This is a placeholder function that would normally extract album art from Spotify
  // For now, return a placeholder image
  return 'https://via.placeholder.com/300x300.png?text=Album+Art';
};
