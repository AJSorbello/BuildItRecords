import { useState, useEffect } from 'react';
import { Track } from '../types/track';
import { spotifyService } from '../services/spotify';

interface UseSpotifyTracksResult {
  tracks: Track[];
  loading: boolean;
  error: string | null;
}

export function useSpotifyTracks(
  trackIds: string[],
  market?: string
): UseSpotifyTracksResult {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      if (!trackIds.length) {
        setTracks([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const fetchedTracks = await spotifyService.getTracks(trackIds, market);
        setTracks(fetchedTracks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
        setTracks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [trackIds, market]);

  return { tracks, loading, error };
}
