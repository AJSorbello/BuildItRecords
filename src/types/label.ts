import type { Artist } from './artist';
import type { Track } from './track';
import type { Album } from './album';

export interface RecordLabel {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  website?: string;
  imageUrl?: string;
  artists?: Artist[];
  tracks?: Track[];
  albums?: Album[];
  createdAt: string;
  updatedAt: string;
}

export interface LabelSearchParams {
  query?: string;
  limit?: number;
  offset?: number;
}

export interface LabelResponse {
  labels: {
    items: RecordLabel[];
    total: number;
    limit: number;
    offset: number;
  };
}

export function formatLabel(label: RecordLabel): RecordLabel {
  return {
    id: label.id,
    name: label.name,
    displayName: label.displayName || label.name,
    description: label.description,
    website: label.website,
    imageUrl: label.imageUrl,
    artists: label.artists || [],
    tracks: label.tracks || [],
    albums: label.albums || [],
    createdAt: label.createdAt,
    updatedAt: label.updatedAt
  };
}

export function getLabelImage(label: RecordLabel): string {
  return label.imageUrl || '';
}

export function getLabelArtists(label: RecordLabel): Artist[] {
  return label.artists || [];
}

export function getLabelTracks(label: RecordLabel): Track[] {
  return label.tracks || [];
}

export function getLabelAlbums(label: RecordLabel): Album[] {
  return label.albums || [];
}
