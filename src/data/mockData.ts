import { Track } from '../types/track';
import { RECORD_LABELS, RecordLabel } from '../constants/labels';

export interface Artist {
  id: string;
  name: string;
  bio: string;
  spotifyUrl: string;
  beatportUrl: string;
  soundcloudUrl: string;
  recordLabel: RecordLabel;
  imageUrl?: string;
}

export const mockArtists: Artist[] = [];

export const mockTracks: Track[] = [];

export const initializeMockData = () => {
  const existingTracks = localStorage.getItem('tracks');
  if (!existingTracks) {
    localStorage.setItem('tracks', JSON.stringify([]));
  }
};
