import { useState, useEffect } from 'react';
import { UnifiedTrack, SpotifyAlbum } from '../types/unified';
import { spotifyService } from '../services/SpotifyService';

interface UseSpotifyAlbumResult {
  tracks: UnifiedTrack[];
  album: SpotifyAlbum | null;
  loading: boolean;
  error: string | null;
}

export function useSpotifyAlbum(albumId: string): UseSpotifyAlbumResult {
  const [tracks, setTracks] = useState<UnifiedTrack[]>([]);
  const [album, setAlbum] = useState<SpotifyAlbum | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!albumId) {
        setTracks([]);
        setAlbum(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await spotifyService.getAlbum(albumId);
        setTracks(response.tracks);
        setAlbum(response.album);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching album');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [albumId]);

  return { tracks, album, loading, error };
}
