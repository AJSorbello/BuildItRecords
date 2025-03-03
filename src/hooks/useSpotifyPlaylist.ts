import { useState, useEffect } from 'react';
import { UnifiedTrack } from '../types/unified';
import { spotifyService } from '../services/SpotifyService';

interface UseSpotifyPlaylistResult {
  tracks: UnifiedTrack[];
  loading: boolean;
  error: string | null;
}

export function useSpotifyPlaylist(playlistId: string): UseSpotifyPlaylistResult {
  const [tracks, setTracks] = useState<UnifiedTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!playlistId) {
        setTracks([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await spotifyService.getPlaylist(playlistId);
        setTracks(response.tracks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching playlist');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [playlistId]);

  return { tracks, loading, error };
}
