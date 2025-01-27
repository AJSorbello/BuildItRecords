export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: Record<string, any>;
}

export interface ImportStatus {
  status: 'pending' | 'completed' | 'failed';
  progress: number;
  tracksImported?: number;
  message?: string;
}
