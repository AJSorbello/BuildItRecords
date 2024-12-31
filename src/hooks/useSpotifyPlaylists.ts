import { useState, useEffect } from 'react';
import { spotifyService } from '../services/SpotifyService';

export const useSpotifyPlaylists = (playlistId?: string) => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      if (!playlistId) {
        setLoading(false);
        return;
      }

      try {
        const response = await spotifyService.getPlaylist(playlistId);
        if (response && response.tracks) {
          setTracks(response.tracks.items);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch playlist'));
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [playlistId]);

  return { tracks, loading, error };
};
