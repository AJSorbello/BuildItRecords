import { Track } from './track';
import { RecordLabel } from '../constants/labels';

export type RecordLabel = RecordLabel;

export interface Release {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string;
  releaseDate: string;
  genre: string;
  labelName: RecordLabel;
  stores: {
    spotify?: string;
    beatport?: string;
    soundcloud?: string;
  };
}
