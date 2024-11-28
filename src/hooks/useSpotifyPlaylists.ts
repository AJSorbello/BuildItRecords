import { useState, useEffect } from 'react';
import SpotifyService from '../services/SpotifyService';

interface PlaylistTrack {
  id: string;
  name: string;
  artists: string[];
  album: string;
  duration: number;
  preview_url: string | null;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: PlaylistTrack[];
  imageUrl: string;
}

const playlistIds: Record<string, string[]> = {
  records: ['YOUR_RECORDS_PLAYLIST_ID'],
  tech: ['YOUR_TECH_PLAYLIST_ID'],
  deep: ['YOUR_DEEP_PLAYLIST_ID']
};

export const useSpotifyPlaylists = (label: 'records' | 'tech' | 'deep') => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        setError(null);

        const spotifyService = SpotifyService.getInstance();

        const playlistPromises = playlistIds[label].map(async (id) => {
          const playlist = await spotifyService.getPlaylist(id);
          return {
            id: playlist.id,
            name: playlist.name,
            description: playlist.description || '',  
            imageUrl: playlist.images[0]?.url || '',
            tracks: playlist.tracks.items.map((item: any) => ({
              id: item.track.id,
              name: item.track.name,
              artists: item.track.artists.map((artist: any) => artist.name),
              album: item.track.album.name,
              duration: item.track.duration_ms,
              preview_url: item.track.preview_url
            }))
          };
        });

        const fetchedPlaylists = await Promise.all(playlistPromises);
        setPlaylists(fetchedPlaylists);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch playlists');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [label]);

  return { playlists, loading, error };
};

export default useSpotifyPlaylists;
