import { Track } from '../types/track';
import { RECORD_LABELS, RecordLabel } from '../constants/labels';

export interface Artist {
  id: string;
  name: string;
  bio: string;
  image: string;
  imageUrl: string;  // For backward compatibility
  recordLabel: RecordLabel;
  spotifyUrl?: string;
  beatportUrl?: string;
  soundcloudUrl?: string;
  bandcampUrl?: string;
}

export const mockArtists: Artist[] = [];

export const mockTracks: Track[] = [];

export const initializeMockData = () => {
  // Initialize tracks if they don't exist
  const existingTracks = localStorage.getItem('tracks');
  if (!existingTracks) {
    localStorage.setItem('tracks', JSON.stringify([]));
  }

  // Initialize artists if they don't exist
  const existingArtists = localStorage.getItem('artists');
  if (!existingArtists) {
    localStorage.setItem('artists', JSON.stringify([]));
  }
};
