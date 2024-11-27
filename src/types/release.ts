export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  previewUrl: string | null;
  spotifyId?: string;
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
