import { Track } from './track';
import { RecordLabel } from '../constants/labels';

export interface Release {
  id: string;
  title: string;
  artist: string;
  artwork: string;  // For backward compatibility
  artworkUrl: string;
  releaseDate: string;
  genre: string;
  labelName: RecordLabel;
  tracks?: Track[];
  label?: RecordLabel;
  stores: {
    spotify?: string;
    beatport?: string;
    soundcloud?: string;
  };
  spotifyUrl?: string;
  beatportUrl?: string;
  soundcloudUrl?: string;
}
