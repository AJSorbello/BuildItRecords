export interface Track {
  id: string;
  name: string;
  previewUrl: string | null;
}

export interface Release {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  releaseDate: string;
  tracks: Track[];
  label: string;
  spotifyUrl: string;
  beatportUrl: string;
  soundcloudUrl: string;
}
