export interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  labels: string[];
  spotifyUrl?: string;
  beatportUrl?: string;
  soundcloudUrl?: string;
  bandcampUrl?: string;
  bio?: string;
  monthlyListeners?: number;
  releases: string[]; // Array of release IDs
}

export interface ArtistFormData {
  name: string;
  imageUrl: string;
  labels: string[];
  spotifyUrl?: string;
  beatportUrl?: string;
  soundcloudUrl?: string;
  bandcampUrl?: string;
  bio?: string;
}
