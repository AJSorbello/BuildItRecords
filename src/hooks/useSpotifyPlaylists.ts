import { useState, useEffect } from 'react';
import { Track, SpotifyTrack } from '../types/track';
import { transformSpotifyTrack } from '../utils/trackUtils';
import { spotifyService } from '../services/spotify';

interface UseSpotifyPlaylistsResult {
  tracks: Track[];
  loading: boolean;
  error: string | null;
}

export function useSpotifyPlaylists(playlistId: string): UseSpotifyPlaylistsResult {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        const response = await spotifyService.getPlaylistTracks(playlistId);
        const spotifyTracks = response.items
          .map(item => item.track)
          .filter((track): track is SpotifyTrack => track !== null);

        const transformedTracks = spotifyTracks.map(transformSpotifyTrack);
        setTracks(transformedTracks);
        setError(null);
      } catch (err) {
        console.error('Error fetching playlist tracks:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
      } finally {
        setLoading(false);
      }
    };

    if (playlistId) {
      fetchTracks();
    }
  }, [playlistId]);

  return { tracks, loading, error };
}
