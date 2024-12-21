import { SpotifyImage } from './track';

export interface Album {
  id: string;
  name: string;
  images: SpotifyImage[];
  releaseDate: string;
  totalTracks?: number;
}
