import { Track } from './track';
import { RecordLabel as LabelType } from '../constants/labels';

export type RecordLabel = LabelType;

export interface Release {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  releaseDate: string;
  tracks: Track[];
  label: RecordLabel;
  spotifyUrl: string;
  beatportUrl: string;
  soundcloudUrl: string;
}
