import { useState, useEffect } from 'react';
import { spotifyService } from '../services/SpotifyService';

interface PlaylistTrack {
  id: string;
  name: string;
  artists: string[];
  albumCover: string;
  previewUrl: string | null;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  tracks: PlaylistTrack[];
}

const playlistIds = {
  records: ['YOUR_RECORDS_PLAYLIST_ID'],
  tech: ['YOUR_TECH_PLAYLIST_ID'],
  deep: ['YOUR_DEEP_PLAYLIST_ID']
};

export const useSpotifyPlaylists = (label: keyof typeof playlistIds) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        setError(null);

        const playlistPromises = playlistIds[label].map(async (id) => {
          const playlist = await spotifyService.getPlaylist(id);
          return {
            id: playlist.id,
            name: playlist.name,
            description: playlist.description || '',
            imageUrl: playlist.images[0]?.url || '',
            tracks: playlist.tracks.items.map(item => ({
              id: item.track.id,
              name: item.track.name,
              artists: item.track.artists.map(artist => artist.name),
              albumCover: item.track.album.images[0]?.url || '',
              previewUrl: item.track.preview_url
            }))
          };
        });

        const fetchedPlaylists = await Promise.all(playlistPromises);
        setPlaylists(fetchedPlaylists);
      } catch (error) {
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [label]);

  return { playlists, loading, error };
};

export default useSpotifyPlaylists;
