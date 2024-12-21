import { Track } from './track';
import { RecordLabel } from '../constants/labels';
import { SimplifiedAlbum } from '@spotify/web-api-ts-sdk';
import { SimpleArtist } from './artist';

export interface Release {
  id: string;
  title: string;
  artist: SimpleArtist;
  imageUrl: string;
  artwork?: string;  // For backward compatibility
  artworkUrl?: string;  // For backward compatibility
  releaseDate: string;
  genre?: string;
  labelName: RecordLabel;
  label: RecordLabel;
  tracks?: Track[];
  stores?: {
    spotify?: string;
    beatport?: string;
    soundcloud?: string;
  };
  spotifyUrl: string;
  beatportUrl?: string;
  soundcloudUrl?: string;
}

export interface ReleaseFormData {
  title: string;
  artist: string;
  imageUrl: string;
  releaseDate: string;
  genre: string;
  labelName: RecordLabel;
  spotifyUrl: string;
  beatportUrl: string;
  soundcloudUrl: string;
}

export function convertSpotifyAlbumToRelease(album: SimplifiedAlbum, label: RecordLabel): Release {
  return {
    id: album.id,
    title: album.name,
    artist: {
      id: album.artists[0]?.id,
      name: album.artists[0]?.name || '',
      spotifyUrl: album.artists[0]?.external_urls?.spotify,
      imageUrl: album.images?.[0]?.url,
    },
    imageUrl: album.images?.[0]?.url || '',
    releaseDate: album.release_date,
    genre: '',
    labelName: label,
    label,
    stores: {
      spotify: album.external_urls?.spotify || '',
    },
    spotifyUrl: album.external_urls?.spotify || '',
  };
}
