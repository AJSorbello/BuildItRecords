import { QueryClient } from '@tanstack/react-query';

// Efficient query configuration with exponential backoff
export const queryConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
};

// Create a singleton QueryClient for better performance
export const queryClient = new QueryClient(queryConfig);

// Query keys for better cache management
export const queryKeys = {
  artists: {
    all: ['artists'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.artists.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.artists.all, 'detail', id] as const,
    tracks: (id: string) => [...queryKeys.artists.all, 'tracks', id] as const,
  },
  releases: {
    all: ['releases'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.releases.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.releases.all, 'detail', id] as const,
  },
  playlists: {
    all: ['playlists'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.playlists.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.playlists.all, 'detail', id] as const,
    tracks: (id: string) => [...queryKeys.playlists.all, 'tracks', id] as const,
  },
  tracks: {
    all: ['tracks'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.tracks.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.tracks.all, 'detail', id] as const,
  },
};

// Error handler for queries
export const handleQueryError = (error: unknown) => {
  // Log error to monitoring service
  console.error('Query error:', error);
  
  // Return user-friendly error message
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Prefetch configuration
export const prefetchConfigs = {
  // Prefetch artist details when hovering over artist links
  artistDetails: (id: string) => ({
    queryKey: queryKeys.artists.detail(id),
    staleTime: 10 * 60 * 1000, // Prefetched data is fresh for 10 minutes
  }),
  
  // Prefetch playlist tracks when hovering over playlist
  playlistTracks: (id: string) => ({
    queryKey: queryKeys.playlists.tracks(id),
    staleTime: 5 * 60 * 1000, // Prefetched data is fresh for 5 minutes
  }),
};

// Custom hook for query configuration
export const useQueryConfig = () => {
  return {
    queryClient,
    config: queryConfig,
  };
};
