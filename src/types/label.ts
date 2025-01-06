import type { Artist } from './artist';
import type { Track } from './track';
import type { Album } from './release';

export interface RecordLabel {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  website?: string;
  logo?: string;
  artists?: Artist[];
  tracks?: Track[];
  releases?: Album[];
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

export function createLabel(data: Partial<RecordLabel>): RecordLabel {
  return {
    id: data.id || '',
    name: data.name || '',
    displayName: data.displayName || data.name || '',
    description: data.description || '',
    website: data.website || '',
    logo: data.logo || '',
    artists: data.artists || [],
    tracks: data.tracks || [],
    releases: data.releases || []
  };
}
