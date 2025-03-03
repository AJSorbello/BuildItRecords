import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { spotifyService } from '../services/SpotifyService';
import type { Artist, Track, Release, Playlist } from '../types/models';

interface QueryResponse<T> {
  items: T[];
  total: number;
  next?: string;
  previous?: string;
}

type SpotifyQueryKey = 
  | ['artists']
  | ['artist', string]
  | ['artistTracks', string]
  | ['tracks']
  | ['track', string]
  | ['releases']
  | ['release', string]
  | ['playlists']
  | ['playlist', string]
  | ['search', string];

type QueryResult<T> = T extends Array<any> ? T : T extends QueryResponse<any> ? T : T;

export function useSpotifyData<T>(
  key: SpotifyQueryKey[0],
  id?: string,
  options?: Omit<UseQueryOptions<QueryResult<T>, Error>, 'queryKey' | 'queryFn'>
) {
  const queryKey = id ? [key, id] : [key];

  return useQuery<QueryResult<T>, Error>({
    queryKey,
    queryFn: async () => {
      try {
        switch (key) {
          case 'artists':
            return spotifyService.getAllArtists() as Promise<QueryResult<T>>;
          case 'artist':
            if (!id) throw new Error('Artist ID is required');
            return spotifyService.getArtist(id) as Promise<QueryResult<T>>;
          case 'artistTracks':
            if (!id) throw new Error('Artist ID is required');
            return spotifyService.getArtistTopTracks(id) as Promise<QueryResult<T>>;
          case 'tracks':
            return spotifyService.getAllTracks() as Promise<QueryResult<T>>;
          case 'track':
            if (!id) throw new Error('Track ID is required');
            return spotifyService.getTrack(id) as Promise<QueryResult<T>>;
          case 'releases':
            return spotifyService.getAllReleases() as Promise<QueryResult<T>>;
          case 'release':
            if (!id) throw new Error('Release ID is required');
            return spotifyService.getReleaseById(id) as Promise<QueryResult<T>>;
          case 'playlists':
            return spotifyService.getAllPlaylists() as Promise<QueryResult<T>>;
          case 'playlist':
            if (!id) throw new Error('Playlist ID is required');
            return spotifyService.getPlaylistById(id) as Promise<QueryResult<T>>;
          case 'search':
            if (!id) throw new Error('Search query is required');
            return spotifyService.searchTracks(id) as Promise<QueryResult<T>>;
          default:
            throw new Error('Invalid query key');
        }
      } catch (error) {
        throw error instanceof Error ? error : new Error('An error occurred');
      }
    },
    ...options,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
