import type { QueryOptions } from './paginated-response';

export enum TrackType {
  TRACK = 'track',
  REMIX = 'remix',
  EDIT = 'edit',
  INSTRUMENTAL = 'instrumental',
  ACAPELLA = 'acapella'
}

export enum TrackStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum ReleaseType {
  SINGLE = 'single',
  EP = 'ep',
  ALBUM = 'album',
  COMPILATION = 'compilation'
}

export enum ReleaseStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum ArtistType {
  ARTIST = 'artist',
  REMIXER = 'remixer',
  PRODUCER = 'producer',
  FEATURED = 'featured'
}

export interface ExternalUrls {
  spotify?: string;
  [key: string]: string | undefined;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PopularityHistory {
  id: string;
  albumId: string;
  popularity: number;
  timestamp: string;
}

export interface Market {
  id: string;
  code: string;
  name: string;
  region: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export type { QueryOptions };
