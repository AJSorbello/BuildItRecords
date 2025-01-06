import { useState, useEffect, useCallback } from 'react';
import { Track } from '../types/track';
import { Artist } from '../types/artist';
import { Album } from '../types/release';
import { spotifyService } from '../services/spotify';
import { useDebounce } from './useDebounce';

interface UseSpotifySearchResult {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  loading: boolean;
  error: string | null;
}

interface UseSpotifySearchOptions {
  limit?: number;
  offset?: number;
  market?: string;
  includeExternal?: 'audio';
}

export function useSpotifySearch(
  query: string,
  types: ('track' | 'artist' | 'album')[],
  options: UseSpotifySearchOptions = {}
): UseSpotifySearchResult {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  const performSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setTracks([]);
      setArtists([]);
      setAlbums([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await spotifyService.search(debouncedQuery, types, {
        limit: options.limit || 20,
        offset: options.offset || 0,
        market: options.market,
        includeExternal: options.includeExternal,
      });

      if (response.tracks && types.includes('track')) {
        setTracks(response.tracks.items);
      }
      if (response.artists && types.includes('artist')) {
        setArtists(response.artists.items);
      }
      if (response.albums && types.includes('album')) {
        setAlbums(response.albums.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setTracks([]);
      setArtists([]);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, types, options]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  return {
    tracks,
    artists,
    albums,
    loading,
    error,
  };
}
