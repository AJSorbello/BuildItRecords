export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface Album {
  id: string;
  name: string;
  images: SpotifyImage[];
  releaseDate: string;
  totalTracks?: number;
}
