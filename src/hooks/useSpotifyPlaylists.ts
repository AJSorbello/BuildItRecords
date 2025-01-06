import { useState, useEffect } from 'react';
import { Track, SpotifyTrack } from '../types';
import { transformSpotifyTrack } from '../utils/trackUtils';
import { spotifyApi } from '../services/spotify';

interface UseSpotifyPlaylistsResult {
  tracks: Track[];
  loading: boolean;
  error: Error | null;
}

export const useSpotifyPlaylists = (playlistId: string): UseSpotifyPlaylistsResult => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTracks = async () => {
      if (!playlistId) {
        setError(new Error('No playlist ID provided'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await spotifyApi.playlists.getPlaylistItems(playlistId);
        const spotifyTracks = response.items
          .map(item => item.track)
          .filter((track): track is SpotifyTrack => track !== null);

        const transformedTracks = spotifyTracks.map(transformSpotifyTrack);
        setTracks(transformedTracks);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch playlist tracks'));
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [playlistId]);

  return { tracks, loading, error };
};
