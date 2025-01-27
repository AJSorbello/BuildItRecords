import { useState, useEffect } from 'react';
import { Artist } from '../types/artist';
import { spotifyService } from '../services/spotify';

interface UseSpotifyArtistResult {
  artist: Artist | null;
  loading: boolean;
  error: string | null;
}

interface UseSpotifyArtistOptions {
  includeTopTracks?: boolean;
  includeAlbums?: boolean;
  includeRelatedArtists?: boolean;
  market?: string;
}

export function useSpotifyArtist(
  artistId: string | null,
  options: UseSpotifyArtistOptions = {}
): UseSpotifyArtistResult {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtist = async () => {
      if (!artistId) {
        setArtist(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const artistData = await spotifyService.getArtist(artistId);
        
        // Fetch additional data if requested
        const [topTracks, albums, relatedArtists] = await Promise.all([
          options.includeTopTracks
            ? spotifyService.getArtistTopTracks(artistId, options.market)
            : Promise.resolve(undefined),
          options.includeAlbums
            ? spotifyService.getArtistAlbums(artistId, {
                include_groups: ['album', 'single'],
                market: options.market,
                limit: 50
              })
            : Promise.resolve(undefined),
          options.includeRelatedArtists
            ? spotifyService.getRelatedArtists(artistId)
            : Promise.resolve(undefined)
        ]);

        setArtist({
          ...artistData,
          topTracks,
          albums,
          relatedArtists
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch artist');
        setArtist(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [
    artistId,
    options.includeTopTracks,
    options.includeAlbums,
    options.includeRelatedArtists,
    options.market
  ]);

  return { artist, loading, error };
}
