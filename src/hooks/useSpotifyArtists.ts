import { useState, useEffect } from 'react';
import { Artist } from '../types/artist';
import { spotifyService } from '../services/spotify';

interface UseSpotifyArtistsResult {
  artists: Artist[];
  loading: boolean;
  error: string | null;
}

export function useSpotifyArtists(artistIds: string[]): UseSpotifyArtistsResult {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtists = async () => {
      if (!artistIds.length) {
        setArtists([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fetchedArtists = await spotifyService.getArtists(artistIds);
        setArtists(fetchedArtists);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch artists');
        setArtists([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [artistIds]);

  return { artists, loading, error };
}
