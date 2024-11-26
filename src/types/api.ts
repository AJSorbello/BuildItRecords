export interface SpotifyTrack {
  name: string;
  artists: Array<{
    name: string;
  }>;
  album: {
    images: Array<{
      url: string;
    }>;
    release_date: string;
  };
  external_urls: {
    spotify: string;
  };
}

export interface BeatportTrack {
  name: string;
  artists: Array<{
    name: string;
  }>;
  release: {
    image: {
      uri: string;
    };
  };
  publish_date: string;
  url: string;
  isrc: string;
}

export interface SoundCloudTrack {
  title: string;
  user: {
    username: string;
  };
  artwork_url: string | null;
  created_at: string;
  permalink_url: string;
}

export interface PlatformTrackData {
  title: string;
  artist: string;
  imageUrl: string;
  releaseDate: string;
  spotifyUrl?: string;
  beatportUrl?: string;
  soundcloudUrl?: string;
  isrc?: string;
}
