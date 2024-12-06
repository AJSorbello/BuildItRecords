import { RecordLabel } from '../constants/labels';

export interface Track {
  id: string;
  trackTitle: string;
  artist: string;
  spotifyUrl: string;
  albumCover?: string;
  recordLabel: RecordLabel;
  beatportUrl?: string;
  soundcloudUrl?: string;
  releaseDate: string;
}
